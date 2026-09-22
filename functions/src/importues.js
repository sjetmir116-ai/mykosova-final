// ===== CALLABLES: IMPORTIMI MASIV NGA GOOGLE PLACES =====
// Siguria: roli verifikohet SERVER-SIDE nga koleksioni përdoruesit/{uid}
// (i njëjti pattern si te subscriptions.js) — kurrë nga custom claims të klientit.
//
// API key-i vjen nga Firebase Secrets (GOOGLE_PLACES_API_KEY) — kurrë nga klienti,
// kurrë nga Firestore.
//
// Sepse Cloud Functions ka timeout, puna ndahet në copa: callable-i kthen
// `perfunduar: false` + `jobId`, dhe UI-ja e thërret sërish me { jobId, vazhdo: true }.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const crypto = require('crypto');

const getAdmin = require('./admin-lazy');
const { regjistroAudit } = require('./audit');
const { PlacesClient } = require('./places/client');
const { normalizoKerkesen, vleresoPlanin, GabimPlani } = require('./places/plani');
const { emratEQyteteve } = require('./places/qytetet');
const { emratEKategorive } = require('./places/kategorite');
const { ekzekutoImportin, KOLEKSIONI_PUNET, numeratorBosh } = require('./bulkImport');

const GOOGLE_PLACES_API_KEY = defineSecret('GOOGLE_PLACES_API_KEY');

const OPSIONET = {
  region: 'europe-west1',
  timeoutSeconds: 540,
  memory: '512MiB',
  secrets: [GOOGLE_PLACES_API_KEY],
};

// Buxheti i punës brenda një thirrjeje: 300s nga 540s — lë hapësirë për
// shkrimin e fundit të dokumentit të punës dhe për audit-in.
const BUXHETI_MS = 300000;

const ROLET_E_LEJUARA = ['admin', 'super_admin'];

async function verifikoAdminin(e) {
  if (!e.auth) throw new HttpsError('unauthenticated', 'Duhet të jeni i loguar.');
  const snap = await getAdmin().firestore().collection('përdoruesit').doc(e.auth.uid).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'Profili nuk u gjet.');
  const profili = snap.data();
  if (!ROLET_E_LEJUARA.includes(profili.roli)) {
    throw new HttpsError('permission-denied', 'Vetëm admini mund të bëjë importim masiv.');
  }
  return { uid: e.auth.uid, email: e.auth.token?.email || profili.email || '', emri: profili.emri || '' };
}

function perktheGabimin(err) {
  if (err instanceof HttpsError) return err;
  if (err instanceof GabimPlani) return new HttpsError('invalid-argument', err.message);
  if (err?.kodi === 'MUNGON_KEY') {
    return new HttpsError('failed-precondition', 'Mungon GOOGLE_PLACES_API_KEY — vendose me: firebase functions:secrets:set GOOGLE_PLACES_API_KEY');
  }
  if (err?.kodi === 'API_I_PAKTIVIZUAR') {
    return new HttpsError('failed-precondition', 'Places API (New) s\u2019është aktivizuar ose çelësi s\u2019ka leje.');
  }
  if (err?.kodi === 'KEY_I_GABUAR') {
    return new HttpsError('failed-precondition', 'Google e refuzoi kërkesën (çelës i pavlefshëm ose parametra të gabuar).');
  }
  if (err?.kodi === 'KUOTA_U_MBUSH') {
    return new HttpsError('resource-exhausted', 'Kuota e Google Places u mbush. Provoni më vonë.');
  }
  return new HttpsError('internal', err?.message || 'Gabim i papritur gjatë importit.');
}

// ===== 1. KATALOGU — çfarë mund të importohet (e mbush formën e panelit) =====
exports.katalogImportimi = onCall({ region: OPSIONET.region }, async (e) => {
  await verifikoAdminin(e);
  return {
    qytetet: emratEQyteteve(),
    kategorite: emratEKategorive(),
    strategjite: ['shpejt', 'rrjete', 'plote'],
    statuset: ['auto', 'aprovar', 'pendshe'],
  };
});

// ===== 2. VLERËSIMI — sa do të kushtojë, PA prekur asgjë =====
exports.vleresoImportin = onCall({ region: OPSIONET.region }, async (e) => {
  await verifikoAdminin(e);
  try {
    const kerkesa = normalizoKerkesen(e.data || {});
    return { kerkesa, vleresimi: vleresoPlanin(kerkesa) };
  } catch (err) {
    throw perktheGabimin(err);
  }
});

// ===== 3. IMPORTI MASIV =====
// Thirrja e parë : { qytetet, kategorite, strategjia, ... } → krijon punën
// Thirrjet pasuese: { jobId, vazhdo: true }                 → vazhdon nga kursori
exports.importoMasiv = onCall(OPSIONET, async (e) => {
  const admini = await verifikoAdminin(e);
  const db = getAdmin().firestore();
  const hyrja = e.data || {};

  let jobRef;
  let kerkesa;
  let kursori;
  let numeratori;

  try {
    if (hyrja.vazhdo && hyrja.jobId) {
      jobRef = db.collection(KOLEKSIONI_PUNET).doc(String(hyrja.jobId));
      const snap = await jobRef.get();
      if (!snap.exists) throw new HttpsError('not-found', 'Puna e importit nuk u gjet.');
      const puna = snap.data();
      if (puna.statusi === 'perfunduar') {
        return { jobId: jobRef.id, perfunduar: true, numeratori: puna.numeratori, statusi: puna.statusi };
      }
      if (puna.statusi === 'anuluar') {
        return { jobId: jobRef.id, perfunduar: true, anuluar: true, numeratori: puna.numeratori, statusi: puna.statusi };
      }
      kerkesa = puna.kerkesa;
      kursori = puna.kursori || { task: 0, qeliza: 0 };
      numeratori = puna.numeratori || numeratorBosh();
    } else {
      kerkesa = normalizoKerkesen(hyrja);
      const vleresimi = vleresoPlanin(kerkesa);
      jobRef = db.collection(KOLEKSIONI_PUNET).doc();
      kursori = { task: 0, qeliza: 0 };
      numeratori = numeratorBosh();
      await jobRef.set({
        kerkesa,
        vleresimi,
        kursori,
        numeratori,
        statusi: 'duke_punuar',
        nisurNga: { uid: admini.uid, email: admini.email },
        nisurM: new Date().toISOString(),
        perditesuarM: new Date().toISOString(),
      });
      await regjistroAudit(admini.uid, admini.email, 'import_masiv_nisur', {
        jobId: jobRef.id,
        qytetet: kerkesa.qytetet,
        kategorite: kerkesa.kategorite,
        strategjia: kerkesa.strategjia,
        prove: kerkesa.prove,
      });
    }
  } catch (err) {
    throw perktheGabimin(err);
  }

  const apiKey = GOOGLE_PLACES_API_KEY.value() || process.env.GOOGLE_PLACES_API_KEY || '';
  if (!apiKey) {
    await jobRef.update({ statusi: 'deshtoi', gabimi: 'Mungon GOOGLE_PLACES_API_KEY', perditesuarM: new Date().toISOString() });
    throw new HttpsError('failed-precondition', 'Mungon GOOGLE_PLACES_API_KEY — vendose me: firebase functions:secrets:set GOOGLE_PLACES_API_KEY');
  }

  try {
    const klienti = new PlacesClient({ apiKey });
    // Numëruesi i thirrjeve vazhdon nga copa e mëparshme, që tavani
    // maksKerkesaApi të vlejë për GJITHË punën, jo për një copë të vetme.
    klienti.kerkesa = Number(numeratori.kerkesaApi || 0);

    const rez = await ekzekutoImportin({
      db,
      klienti,
      crypto,
      kerkesa,
      kursori,
      numeratori,
      buxhetiMs: BUXHETI_MS,
      autori: `Import masiv (${admini.email || admini.uid})`,
      uidPronari: 'sistemi',
      onProgres: async ({ numeratori: n, kursori: k }) => {
        // Progres live për panelin (onSnapshot). Dështimi këtu s'e ndalon importin.
        await jobRef.update({ numeratori: n, kursori: k, perditesuarM: new Date().toISOString() }).catch(() => {});
      },
    });

    await jobRef.update({
      kursori: rez.kursori,
      numeratori: rez.numeratori,
      arsyet: rez.arsyet,
      gabimet: rez.gabimet,
      mostra: rez.mostra,
      taskatGjithsej: rez.taskatGjithsej,
      ndalesa: rez.ndalesa || '',
      statusi: rez.perfunduar ? 'perfunduar' : 'duke_punuar',
      perditesuarM: new Date().toISOString(),
      ...(rez.perfunduar ? { perfunduarM: new Date().toISOString() } : {}),
    });

    if (rez.perfunduar) {
      await regjistroAudit(admini.uid, admini.email, 'import_masiv_perfundoi', {
        jobId: jobRef.id,
        teShtuara: rez.numeratori.teShtuara,
        teAprovuara: rez.numeratori.teAprovuara,
        tePendshe: rez.numeratori.tePendshe,
        kerkesaApi: rez.numeratori.kerkesaApi,
      });
    }

    return {
      jobId: jobRef.id,
      perfunduar: rez.perfunduar,
      ndalesa: rez.ndalesa || '',
      kursori: rez.kursori,
      numeratori: rez.numeratori,
      arsyet: rez.arsyet,
      gabimet: rez.gabimet,
      mostra: rez.mostra,
      taskatGjithsej: rez.taskatGjithsej,
      prove: Boolean(kerkesa.prove),
    };
  } catch (err) {
    await jobRef
      .update({ statusi: 'deshtoi', gabimi: err?.message || String(err), perditesuarM: new Date().toISOString() })
      .catch(() => {});
    throw perktheGabimin(err);
  }
});

// ===== 4. ANULIMI — ndal një punë në vazhdim =====
exports.anuloImportin = onCall({ region: OPSIONET.region }, async (e) => {
  const admini = await verifikoAdminin(e);
  const jobId = String(e.data?.jobId || '');
  if (!jobId) throw new HttpsError('invalid-argument', 'Mungon jobId.');

  const db = getAdmin().firestore();
  const ref = db.collection(KOLEKSIONI_PUNET).doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Puna e importit nuk u gjet.');

  await ref.update({ statusi: 'anuluar', perditesuarM: new Date().toISOString() });
  await regjistroAudit(admini.uid, admini.email, 'import_masiv_anuluar', { jobId });
  return { mire: true, jobId };
});
