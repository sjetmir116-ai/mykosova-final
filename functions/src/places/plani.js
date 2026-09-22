// ===== PLANIFIKUESI I IMPORTIT =====
// Përkthen një kërkesë ("Restorante + Kafene në Prishtinë, strategjia plote")
// në një listë TASK-esh të renditura e deterministe.
//
// KUSHT KYÇ: i njëjti input jep GJITHMONË të njëjtin plan, në të njëjtin rend.
// Kjo e bën resume-n (vazhdimin pas timeout-it) të thjeshtë: ruajmë vetëm
// indeksin e task-ut, jo gjithë planin — dokumenti i punës mbetet i vogël.

const { gjejQytetin, emratEQyteteve } = require('./qytetet');
const { gjejKategorine, emratEKategorive, pyetjetPerKategori, tipatPerNearby } = require('./kategorite');
const { rrjetaEQytetit } = require('./rrjeta');

const STRATEGJITE = ['shpejt', 'rrjete', 'plote'];
const STATUSET = ['auto', 'aprovar', 'pendshe'];

const PARAZGJEDHJET = {
  strategjia: 'shpejt',
  statusi: 'auto',
  qelizaKm: 2.5,
  maksFaqe: 3,          // Text Search: maksimum 3 faqe × 20 = 60 rezultate
  maksKerkesaApi: 400,
  maksBiznese: 1000,
  merrFotot: true,
  perditeso: false,     // rifreskon dokumentet ekzistuese në vend që t'i kapërcejë
  prove: false,         // dry-run: tërheq nga Google, s'shkruan asgjë
};

function pastroListen(vlera, teGjitha) {
  if (vlera === undefined || vlera === null || vlera === '' || vlera === 'te_gjitha') return teGjitha;
  const lista = Array.isArray(vlera) ? vlera : String(vlera).split(',');
  return lista.map((v) => String(v).trim()).filter(Boolean);
}

function numerNeKufi(vlera, parazgjedhja, min, maks) {
  const n = Number(vlera);
  if (!Number.isFinite(n)) return parazgjedhja;
  return Math.min(maks, Math.max(min, n));
}

class GabimPlani extends Error {
  constructor(mesazhi, kodi = 'invalid-argument') {
    super(mesazhi);
    this.name = 'GabimPlani';
    this.kodi = kodi;
  }
}

// Normalizon + validon kërkesën. Hidhet GabimPlani për çdo input të papranueshëm,
// që callable-i ta kthejë si 'invalid-argument' dhe CLI-ja si mesazh të qartë.
function normalizoKerkesen(hyrja = {}) {
  const qytetetHyrje = pastroListen(hyrja.qytetet ?? hyrja.qyteti, emratEQyteteve());
  const kategoriteHyrje = pastroListen(hyrja.kategorite ?? hyrja.kategoria, emratEKategorive());

  const qytetet = [];
  for (const emri of qytetetHyrje) {
    const q = gjejQytetin(emri);
    if (!q) throw new GabimPlani(`Qytet i panjohur: "${emri}". Të njohura: ${emratEQyteteve().join(', ')}`);
    if (!qytetet.includes(q.emri)) qytetet.push(q.emri);
  }

  const kategorite = [];
  for (const emri of kategoriteHyrje) {
    const k = gjejKategorine(emri);
    if (!k) throw new GabimPlani(`Kategori e panjohur: "${emri}". Të njohura: ${emratEKategorive().join(', ')}`);
    if (!kategorite.includes(k.emri)) kategorite.push(k.emri);
  }

  if (!qytetet.length) throw new GabimPlani('Duhet të paktën një qytet.');
  if (!kategorite.length) throw new GabimPlani('Duhet të paktën një kategori.');

  const strategjia = String(hyrja.strategjia || PARAZGJEDHJET.strategjia).trim();
  if (!STRATEGJITE.includes(strategjia)) {
    throw new GabimPlani(`Strategji e panjohur: "${strategjia}". Të lejuara: ${STRATEGJITE.join(', ')}`);
  }

  const statusi = String(hyrja.statusi || PARAZGJEDHJET.statusi).trim();
  if (!STATUSET.includes(statusi)) {
    throw new GabimPlani(`Status i panjohur: "${statusi}". Të lejuara: ${STATUSET.join(', ')}`);
  }

  return {
    qytetet,
    kategorite,
    strategjia,
    statusi,
    qelizaKm: numerNeKufi(hyrja.qelizaKm, PARAZGJEDHJET.qelizaKm, 0.5, 25),
    maksFaqe: Math.round(numerNeKufi(hyrja.maksFaqe, PARAZGJEDHJET.maksFaqe, 1, 3)),
    maksKerkesaApi: Math.round(numerNeKufi(hyrja.maksKerkesaApi, PARAZGJEDHJET.maksKerkesaApi, 1, 20000)),
    maksBiznese: Math.round(numerNeKufi(hyrja.maksBiznese, PARAZGJEDHJET.maksBiznese, 1, 20000)),
    merrFotot: hyrja.merrFotot === undefined ? PARAZGJEDHJET.merrFotot : Boolean(hyrja.merrFotot),
    perditeso: Boolean(hyrja.perditeso),
    prove: Boolean(hyrja.prove),
  };
}

// Ndërton listën e task-eve. Rendi: qytet → kategori → (text, pastaj nearby).
// Text-i vjen i pari sepse jep bizneset më të njohura me më pak thirrje.
function ndertoPlanin(kerkesa) {
  const k = kerkesa.qytetet ? kerkesa : normalizoKerkesen(kerkesa);
  const taskat = [];

  for (const qyteti of k.qytetet) {
    for (const kategoria of k.kategorite) {
      if (k.strategjia === 'shpejt' || k.strategjia === 'plote') {
        for (const pyetja of pyetjetPerKategori(kategoria, qyteti)) {
          taskat.push({ lloji: 'text', qyteti, kategoria, pyetja });
        }
      }
      if (k.strategjia === 'rrjete' || k.strategjia === 'plote') {
        const qelizat = rrjetaEQytetit(qyteti, k.qelizaKm);
        taskat.push({
          lloji: 'nearby',
          qyteti,
          kategoria,
          qelizat,
          tipat: tipatPerNearby(kategoria),
        });
      }
    }
  }

  return taskat;
}

// Vlerësim i kostos PARA se të nisë importi (shfaqet te paneli dhe te CLI).
function vleresoPlanin(kerkesa) {
  const k = kerkesa.qytetet ? kerkesa : normalizoKerkesen(kerkesa);
  const taskat = ndertoPlanin(k);

  let kerkesaText = 0;
  let kerkesaNearby = 0;
  for (const t of taskat) {
    if (t.lloji === 'text') kerkesaText += k.maksFaqe;
    else kerkesaNearby += t.qelizat.length;
  }

  const kerkesaKerkimi = kerkesaText + kerkesaNearby;
  return {
    taskat: taskat.length,
    kerkesaText,
    kerkesaNearby,
    kerkesaKerkimi,
    // Fotot janë +1 thirrje media për biznes të ri (vetëm kur merrFotot = true).
    kerkesaMaksimaleMeFoto: kerkesaKerkimi + (k.merrFotot ? k.maksBiznese : 0),
    brendaKufirit: kerkesaKerkimi <= k.maksKerkesaApi,
  };
}

module.exports = {
  PARAZGJEDHJET,
  STRATEGJITE,
  STATUSET,
  GabimPlani,
  normalizoKerkesen,
  ndertoPlanin,
  vleresoPlanin,
};
