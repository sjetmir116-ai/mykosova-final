// ===== ORKESTRATORI I IMPORTIT MASIV =====
// I njëjti kod shërben tre thirrës: callable-in (importoMasiv), CLI-në
// (scripts/importo-masiv.js) dhe testet. Firestore dhe klienti i Google
// INJEKTOHEN, prandaj gjithçka mund të testohet pa rrjet dhe pa credentials.
//
// Rrjedha për çdo vend të gjetur:
//   place → mapoPlace() → dedup në memorie → TRANSAKSION (dok + rezervim) → foto
//
// Kufizimi kryesor: Cloud Functions ka timeout. Prandaj puna ndahet në copa
// (buxhetiMs) dhe vazhdohet nga kursori — dokumenti i punës mban vetëm
// indeksin, kurse plani rigjenerohet deterministikisht nga kërkesa.

const { normalizoKerkesen, ndertoPlanin, vleresoPlanin } = require('./places/plani');
const { kutiaEQytetit } = require('./places/qytetet');
const {
  mapoPlace,
  googlePlaceDocumentId,
  eSigurtPerRuajtje,
  normalizoTelefonin,
  celesiEmriQyteti,
} = require('./places/mapping');

const KOLEKSIONI_BIZNESET = 'bizneset';
const KOLEKSIONI_INDEKSI = 'biznesetIndeks';
const KOLEKSIONI_PUNET = 'importJobs';

// 300s nga 540s maksimum i Gen2 — lë kohë të mjaftueshme për flush-in e fundit.
const BUXHETI_PARAZGJEDHUR_MS = 300000;

class GabimDublikat extends Error {
  constructor(lloji) {
    super(lloji);
    this.name = 'GabimDublikat';
    this.lloji = lloji;
  }
}

function numeratorBosh() {
  return {
    vendeTeGjetura: 0,
    vendeUnike: 0,
    teShtuara: 0,
    tePerditesuara: 0,
    teAprovuara: 0,
    tePendshe: 0,
    dublikateGoogle: 0,
    dublikateEmri: 0,
    dublikateTelefoni: 0,
    teAnashkaluara: 0,
    gabime: 0,
    kerkesaApi: 0,
    fotoTeMarra: 0,
  };
}

// Çelës i qëndrueshëm i rezervimit emër+qytet. SHA1 sepse emrat përmbajnë '/'
// dhe karaktere që s'lejohen te një document path.
function idIndeksit(celesi, crypto) {
  return crypto.createHash('sha1').update(celesi).digest('hex');
}

// ---------- indeksi paraprak ----------
// Një lexim i vetëm i gjithë koleksionit me .select() (vetëm 3 fusha, jo dokumentet
// e plota) na kursen një transaksion për çdo vend që e kemi tashmë. Për 5000
// biznese kjo është ~1 lexim i lirë kundrejt 5000 transaksioneve.
async function ngarkoIndeksin(db) {
  const indeksi = {
    placeIds: new Set(),
    emraQytete: new Set(),
    telefonat: new Map(),
    dokumente: 0,
  };

  const snap = await db.collection(KOLEKSIONI_BIZNESET).select('googlePlaceId', 'emri', 'qyteti', 'telefoni').get();

  snap.forEach((d) => {
    const data = d.data() || {};
    indeksi.dokumente++;

    const placeId = String(data.googlePlaceId || '').trim();
    if (placeId) indeksi.placeIds.add(placeId);
    // Dokumentet e importuara kanë ID-në determinist edhe kur fusha mungon.
    if (d.id.startsWith('google_')) {
      try {
        indeksi.placeIds.add(decodeURIComponent(d.id.slice('google_'.length)));
      } catch {
        /* ID e keqformuar — injorohet */
      }
    }

    const celesi = celesiEmriQyteti(data.emri, data.qyteti);
    if (celesi) indeksi.emraQytete.add(celesi);

    const tel = normalizoTelefonin(data.telefoni);
    if (tel && tel.length >= 6) indeksi.telefonat.set(tel, d.id);
  });

  return indeksi;
}

// ---------- shkrimi me deduplikim atomik ----------
// Tre garanci në NJË transaksion:
//   1. s'ekziston dokumenti google_{placeId}
//   2. s'ekziston rezervimi emër+qytet (kap dy placeId të ndryshëm për të njëjtin biznes)
//   3. të dyja shkruhen bashkë, ose asnjëra (pa rezervime jetime)
async function ruajMeDeduplikim(db, crypto, { dok, meta, perditeso }) {
  const biznesiRef = db.collection(KOLEKSIONI_BIZNESET).doc(meta.docId);
  const indeksRef = meta.celesiEmriQyteti
    ? db.collection(KOLEKSIONI_INDEKSI).doc(idIndeksit(meta.celesiEmriQyteti, crypto))
    : null;

  return db.runTransaction(async (tx) => {
    const refs = indeksRef ? [biznesiRef, indeksRef] : [biznesiRef];
    const snaps = await tx.getAll(...refs);
    const biznesiSnap = snaps[0];
    const indeksSnap = indeksRef ? snaps[1] : null;

    if (biznesiSnap.exists) {
      if (!perditeso) throw new GabimDublikat('dublikat_google');
      // Përditësim: NUK preken fushat që i ka prekur njeriu ose biznesi —
      // statusi, pronari, paketa, oferta, verifikimi mbeten si janë.
      const { status, uidPronari, krijuarM, oferta, ...teFreskuara } = dok;
      tx.update(biznesiRef, { ...teFreskuara, perditesuarM: new Date().toISOString() });
      return { veprimi: 'perditesuar' };
    }

    if (indeksSnap && indeksSnap.exists && indeksSnap.data()?.biznesiId !== meta.docId) {
      throw new GabimDublikat('dublikat_emri');
    }

    tx.create(biznesiRef, dok);
    if (indeksRef) {
      tx.set(indeksRef, {
        biznesiId: meta.docId,
        emri: dok.emri,
        qyteti: dok.qyteti,
        celesi: meta.celesiEmriQyteti,
        krijuarM: dok.krijuarM,
      });
    }
    return { veprimi: 'shtuar' };
  });
}

// ---------- një task i vetëm ----------
async function ekzekutoTaskun(ctx, task, kursori) {
  const { klienti, kerkesa } = ctx;
  const vendet = [];

  if (task.lloji === 'text') {
    const kutia = kutiaEQytetit(task.qyteti);
    const rez = await klienti.kerkoTekst({
      pyetja: task.pyetja,
      kutia,
      maksFaqe: kerkesa.maksFaqe,
    });
    vendet.push(...rez.vendet);
    return { vendet, qelizaTjeter: 0, perfunduar: true };
  }

  // nearby: qelizat përpunohen një nga një, që buxheti të mund të ndërpresë
  // në mes dhe vazhdimi të fillojë saktësisht aty ku mbeti.
  const filli = Number(kursori?.qeliza || 0);
  for (let i = filli; i < task.qelizat.length; i++) {
    const qeliza = task.qelizat[i];
    const rez = await klienti.kerkoAfer({
      lat: qeliza.lat,
      lng: qeliza.lng,
      rrezjaKm: qeliza.rrezjaKm,
      tipat: task.tipat,
    });
    vendet.push(...rez.vendet);

    const iFundit = i === task.qelizat.length - 1;
    if (!iFundit && ctx.buxhetiKaMbaruar()) {
      return { vendet, qelizaTjeter: i + 1, perfunduar: false };
    }
  }

  return { vendet, qelizaTjeter: 0, perfunduar: true };
}

// ---------- përpunimi i një vendi ----------
async function perpunoVendin(ctx, place, task) {
  const { indeksi, kerkesa, numeratori, db, crypto, klienti } = ctx;

  const rezultati = mapoPlace(place, {
    kategoriaEKerkuar: task.kategoria,
    qytetiIKerkuar: task.qyteti,
    statusi: kerkesa.statusi,
    telefonDublikat: false,
    autori: ctx.autori,
    uidPronari: ctx.uidPronari,
  });

  if (!rezultati.ok) {
    numeratori.teAnashkaluara++;
    ctx.shtoArsye(rezultati.arsyeja);
    return;
  }

  const { dok, meta } = rezultati;

  // Dedup 1 — indeksi në memorie (pa asnjë shkrim, pa asnjë lexim shtesë)
  if (indeksi.placeIds.has(meta.placeId) && !kerkesa.perditeso) {
    numeratori.dublikateGoogle++;
    return;
  }
  if (indeksi.emraQytete.has(meta.celesiEmriQyteti) && !indeksi.placeIds.has(meta.placeId)) {
    numeratori.dublikateEmri++;
    return;
  }

  // Telefon dublikat: NUK e hedh poshtë biznesin — ul skorin, pra shkon në
  // moderim. Zinxhirët (p.sh. një numër qendror) janë raste legjitime.
  const telDublikat = Boolean(meta.telefoniNormalizuar && meta.telefoniNormalizuar.length >= 6 && indeksi.telefonat.has(meta.telefoniNormalizuar));
  if (telDublikat) {
    numeratori.dublikateTelefoni++;
    const rikthim = mapoPlace(place, {
      kategoriaEKerkuar: task.kategoria,
      qytetiIKerkuar: task.qyteti,
      statusi: kerkesa.statusi,
      telefonDublikat: true,
      autori: ctx.autori,
      uidPronari: ctx.uidPronari,
    });
    if (rikthim.ok) {
      dok.status = rikthim.dok.status;
      dok.cilesiaSkori = rikthim.dok.cilesiaSkori;
    }
  }

  // Provë (dry-run): gjithçka llogaritet, asgjë s'shkruhet.
  if (kerkesa.prove) {
    numeratori.vendeUnike++;
    if (dok.status === 'aprovar') numeratori.teAprovuara++;
    else numeratori.tePendshe++;
    ctx.shtoMostren({ emri: dok.emri, qyteti: dok.qyteti, kategoria: dok.kategoria, status: dok.status, skori: dok.cilesiaSkori });
    indeksi.placeIds.add(meta.placeId);
    indeksi.emraQytete.add(meta.celesiEmriQyteti);
    return;
  }

  // Fotoja: +1 thirrje API për biznes. Nëse dështon ose s'është e sigurt,
  // biznesi ruhet gjithsesi — <Foto> bie te gjejFotoAutomatikisht().
  if (kerkesa.merrFotot && meta.fotoRef) {
    try {
      const url = await klienti.merrUrlFotos(meta.fotoRef);
      if (url && eSigurtPerRuajtje(url)) {
        dok.foto = url;
        numeratori.fotoTeMarra++;
      }
    } catch {
      /* fotoja s'e bllokon kurrë importin */
    }
  }

  try {
    const { veprimi } = await ruajMeDeduplikim(db, crypto, { dok, meta, perditeso: kerkesa.perditeso });
    numeratori.vendeUnike++;
    if (veprimi === 'shtuar') {
      numeratori.teShtuara++;
      if (dok.status === 'aprovar') numeratori.teAprovuara++;
      else numeratori.tePendshe++;
    } else {
      numeratori.tePerditesuara++;
    }
    indeksi.placeIds.add(meta.placeId);
    indeksi.emraQytete.add(meta.celesiEmriQyteti);
    if (meta.telefoniNormalizuar) indeksi.telefonat.set(meta.telefoniNormalizuar, meta.docId);
    ctx.shtoMostren({ emri: dok.emri, qyteti: dok.qyteti, kategoria: dok.kategoria, status: dok.status, skori: dok.cilesiaSkori });
  } catch (e) {
    if (e instanceof GabimDublikat) {
      if (e.lloji === 'dublikat_emri') numeratori.dublikateEmri++;
      else numeratori.dublikateGoogle++;
      return;
    }
    numeratori.gabime++;
    ctx.shtoGabim(`${dok.emri}: ${e.message}`);
  }
}

// ---------- pika kryesore e hyrjes ----------
// Kthen { perfunduar, kursori, numeratori, arsyet, gabimet, mostra }.
// perfunduar=false → thirre sërish me të njëjtin `kursori`.
async function ekzekutoImportin({
  db,
  klienti,
  crypto,
  kerkesa: kerkesaHyrje,
  kursori: kursoriHyrje = null,
  numeratori: numeratoriHyrje = null,
  buxhetiMs = BUXHETI_PARAZGJEDHUR_MS,
  autori = 'Importuesi masiv (Google Places)',
  uidPronari = 'sistemi',
  onProgres = null,
  indeksi: indeksiHyrje = null,
}) {
  const kerkesa = normalizoKerkesen(kerkesaHyrje);
  const taskat = ndertoPlanin(kerkesa);
  const numeratori = { ...numeratorBosh(), ...(numeratoriHyrje || {}) };
  const fillimi = Date.now();

  const arsyet = {};
  const gabimet = [];
  const mostra = [];

  const ctx = {
    db,
    klienti,
    crypto,
    kerkesa,
    numeratori,
    autori,
    uidPronari,
    indeksi: indeksiHyrje || (await ngarkoIndeksin(db)),
    buxhetiKaMbaruar: () => Date.now() - fillimi > buxhetiMs,
    shtoArsye: (arsyeja) => { arsyet[arsyeja] = (arsyet[arsyeja] || 0) + 1; },
    shtoGabim: (teksti) => { if (gabimet.length < 20) gabimet.push(teksti); },
    shtoMostren: (rreshti) => { if (mostra.length < 25) mostra.push(rreshti); },
  };

  let kursori = kursoriHyrje || { task: 0, qeliza: 0 };
  let perfunduar = true;
  let ndalesa = '';

  for (let i = Number(kursori.task || 0); i < taskat.length; i++) {
    // Tavani i kostos: mbrojtja kryesore kundër një faturë-surprizë.
    if (klienti.kerkesa >= kerkesa.maksKerkesaApi) {
      kursori = { task: i, qeliza: 0 };
      perfunduar = false;
      ndalesa = 'kufiri_kerkesave';
      break;
    }
    if (numeratori.teShtuara + numeratori.tePerditesuara >= kerkesa.maksBiznese) {
      kursori = { task: i, qeliza: 0 };
      perfunduar = false;
      ndalesa = 'kufiri_bizneseve';
      break;
    }
    if (ctx.buxhetiKaMbaruar()) {
      kursori = { task: i, qeliza: 0 };
      perfunduar = false;
      ndalesa = 'buxheti_kohes';
      break;
    }

    const task = taskat[i];
    const qelizaFillestare = i === Number(kursori.task || 0) ? Number(kursori.qeliza || 0) : 0;

    let rez;
    try {
      rez = await ekzekutoTaskun(ctx, task, { qeliza: qelizaFillestare });
    } catch (e) {
      numeratori.gabime++;
      ctx.shtoGabim(`${task.lloji}/${task.qyteti}/${task.kategoria}: ${e.message}`);
      // Kuota e mbushur ose çelës i pavlefshëm → ndalim i menjëhershëm; çdo
      // task tjetër do të dështonte njësoj dhe vetëm do të digjte kohë.
      if (['KUOTA_U_MBUSH', 'KEY_I_GABUAR', 'API_I_PAKTIVIZUAR', 'MUNGON_KEY'].includes(e.kodi)) {
        kursori = { task: i, qeliza: 0 };
        perfunduar = false;
        ndalesa = e.kodi;
        break;
      }
      continue; // gabim i izoluar → vazhdojmë me task-un tjetër
    }

    numeratori.vendeTeGjetura += rez.vendet.length;

    for (const place of rez.vendet) {
      await perpunoVendin(ctx, place, task);
    }

    numeratori.kerkesaApi = klienti.kerkesa;
    if (onProgres) await onProgres({ numeratori, kursori: { task: i, qeliza: rez.qelizaTjeter }, taskat: taskat.length });

    if (!rez.perfunduar) {
      kursori = { task: i, qeliza: rez.qelizaTjeter };
      perfunduar = false;
      ndalesa = 'buxheti_kohes';
      break;
    }

    kursori = { task: i + 1, qeliza: 0 };
  }

  numeratori.kerkesaApi = klienti.kerkesa;

  return {
    perfunduar,
    ndalesa,
    kursori,
    numeratori,
    arsyet,
    gabimet,
    mostra,
    taskatGjithsej: taskat.length,
    kerkesa,
  };
}

module.exports = {
  KOLEKSIONI_BIZNESET,
  KOLEKSIONI_INDEKSI,
  KOLEKSIONI_PUNET,
  BUXHETI_PARAZGJEDHUR_MS,
  GabimDublikat,
  numeratorBosh,
  ngarkoIndeksin,
  ruajMeDeduplikim,
  ekzekutoImportin,
  vleresoPlanin,
  idIndeksit,
};
