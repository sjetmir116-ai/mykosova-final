// ===== KATALOGU I QYTETEVE (bërthama e importuesit masiv) =====
// I pavarur nga Firebase dhe nga rrjeti — pra 100% i testueshëm.
//
// Pse ekziston veçmas nga src/qyteteGPS.js i frontend-it?
//  - Functions-i është CommonJS, frontend-i ESM (s'ndahet dot moduli pa build).
//  - Këtu duhen edhe RREZJA (për rrjetën) edhe ALIASET (serbisht/anglisht), që
//    frontend-i s'i ka.
// Burimi i koordinatave: qendrat e komunave; rrezja = mbulimi i zonës urbane + periferi.

const QYTETET = [
  { emri: 'Prishtinë', lat: 42.6629, lng: 21.1655, rrezjaKm: 9, alias: ['prishtina', 'pristina', 'priština', 'prishtine'] },
  { emri: 'Prizren', lat: 42.2139, lng: 20.7397, rrezjaKm: 7, alias: ['prizreni', 'prizren'] },
  { emri: 'Pejë', lat: 42.6593, lng: 20.2887, rrezjaKm: 7, alias: ['peja', 'pec', 'peć', 'peje', 'ipek'] },
  { emri: 'Gjakovë', lat: 42.3803, lng: 20.4308, rrezjaKm: 6, alias: ['gjakova', 'djakovica', 'đakovica', 'gjakove'] },
  { emri: 'Ferizaj', lat: 42.3706, lng: 21.1483, rrezjaKm: 6, alias: ['ferizaji', 'urosevac', 'uroševac'] },
  { emri: 'Gjilan', lat: 42.4635, lng: 21.4694, rrezjaKm: 6, alias: ['gjilani', 'gnjilane'] },
  { emri: 'Mitrovicë', lat: 42.8914, lng: 20.8660, rrezjaKm: 7, alias: ['mitrovica', 'kosovska mitrovica', 'mitrovice', 'mitrovicë e jugut'] },
  { emri: 'Podujevë', lat: 42.9106, lng: 21.1933, rrezjaKm: 5, alias: ['podujeva', 'besiana', 'podujevo'] },
  { emri: 'Vushtrri', lat: 42.8231, lng: 20.9675, rrezjaKm: 5, alias: ['vushtrria', 'vucitrn', 'vučitrn'] },
  { emri: 'Suharekë', lat: 42.3589, lng: 20.8253, rrezjaKm: 5, alias: ['suhareka', 'therandë', 'theranda', 'therande', 'suva reka'] },
  { emri: 'Rahovec', lat: 42.3994, lng: 20.6547, rrezjaKm: 5, alias: ['rahoveci', 'orahovac'] },
  { emri: 'Drenas', lat: 42.6250, lng: 20.8931, rrezjaKm: 5, alias: ['gllogoc', 'glogovac', 'gllogovc'] },
  { emri: 'Lipjan', lat: 42.5219, lng: 21.1258, rrezjaKm: 5, alias: ['lipjani', 'lipljan'] },
  { emri: 'Malishevë', lat: 42.4822, lng: 20.7458, rrezjaKm: 5, alias: ['malisheva', 'mališevo', 'malisevo'] },
  { emri: 'Kamenicë', lat: 42.5781, lng: 21.5794, rrezjaKm: 5, alias: ['kamenica', 'dardanë', 'dardana', 'kosovska kamenica'] },
  { emri: 'Viti', lat: 42.3214, lng: 21.3578, rrezjaKm: 4, alias: ['vitia', 'vitina'] },
  { emri: 'Deçan', lat: 42.5403, lng: 20.2886, rrezjaKm: 5, alias: ['decan', 'deçani', 'dečani', 'decani'] },
  { emri: 'Istog', lat: 42.7806, lng: 20.4856, rrezjaKm: 5, alias: ['istogu', 'burim', 'istok'] },
  { emri: 'Klinë', lat: 42.6217, lng: 20.5772, rrezjaKm: 5, alias: ['klina', 'kline'] },
  { emri: 'Skenderaj', lat: 42.7469, lng: 20.7889, rrezjaKm: 5, alias: ['skenderaji', 'srbica', 'skënderaj'] },
  { emri: 'Fushë Kosovë', lat: 42.6392, lng: 21.0961, rrezjaKm: 4, alias: ['fushe kosove', 'kosovo polje', 'fushkosove'] },
  { emri: 'Obiliq', lat: 42.6867, lng: 21.0703, rrezjaKm: 4, alias: ['obiliqi', 'kastriot', 'obilic', 'obilić'] },
  { emri: 'Kaçanik', lat: 42.2314, lng: 21.2597, rrezjaKm: 4, alias: ['kacanik', 'kaçaniku', 'kačanik'] },
  { emri: 'Shtime', lat: 42.4331, lng: 21.0397, rrezjaKm: 4, alias: ['shtimja', 'stimlje', 'štimlje'] },
  { emri: 'Dragash', lat: 42.0619, lng: 20.6531, rrezjaKm: 5, alias: ['dragashi', 'sharr', 'dragaš'] },
  { emri: 'Graçanicë', lat: 42.5992, lng: 21.1936, rrezjaKm: 4, alias: ['gracanice', 'gracanica', 'gračanica'] },
  { emri: 'Novobërdë', lat: 42.6100, lng: 21.4356, rrezjaKm: 4, alias: ['novoberde', 'novo brdo', 'artanë', 'artana'] },
  { emri: 'Shtërpcë', lat: 42.2394, lng: 21.0264, rrezjaKm: 5, alias: ['shterpce', 'strpce', 'štrpce'] },
  { emri: 'Han i Elezit', lat: 42.1508, lng: 21.2969, rrezjaKm: 3, alias: ['hani i elezit', 'elez han', 'đeneral janković'] },
  { emri: 'Junik', lat: 42.4767, lng: 20.2769, rrezjaKm: 3, alias: ['juniku'] },
  { emri: 'Mamushë', lat: 42.3253, lng: 20.7247, rrezjaKm: 3, alias: ['mamusha', 'mamuša'] },
  { emri: 'Kllokot', lat: 42.3689, lng: 21.3789, rrezjaKm: 3, alias: ['klokot'] },
  { emri: 'Partesh', lat: 42.4014, lng: 21.4267, rrezjaKm: 3, alias: ['parteš'] },
  { emri: 'Ranillug', lat: 42.5172, lng: 21.5528, rrezjaKm: 3, alias: ['ranilug'] },
  { emri: 'Zubin Potok', lat: 42.9147, lng: 20.6903, rrezjaKm: 4, alias: ['zubinpotok'] },
  { emri: 'Zveçan', lat: 42.9086, lng: 20.8394, rrezjaKm: 4, alias: ['zvecan', 'zvečan'] },
  { emri: 'Leposaviq', lat: 43.1036, lng: 20.8028, rrezjaKm: 4, alias: ['leposavic', 'leposavić', 'albanik'] },
  { emri: 'Kllokot-Vërbovc', lat: 42.3689, lng: 21.3789, rrezjaKm: 3, alias: ['verbovc', 'vrbovac'] },
];

// Normalizim pa akcente — i njëjti kontrat si te frontend-i (useKontenti.js).
function normalizo(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INDEKSI = new Map();
for (const q of QYTETET) {
  INDEKSI.set(normalizo(q.emri), q);
  for (const a of q.alias) INDEKSI.set(normalizo(a), q);
}

// Emri kanonik i qytetit nga çdo variant (shqip/serbisht/anglisht, me ose pa akcente).
function gjejQytetin(emri) {
  const n = normalizo(emri);
  if (!n) return null;
  return INDEKSI.get(n) || null;
}

// Kërkon çdo alias brenda një teksti të lirë (p.sh. formattedAddress).
// Preferon përputhjen më të gjatë: "Fushë Kosovë" s'duhet të humbasë nga "Kosovë".
function gjejQytetinNeTekst(teksti) {
  const n = normalizo(teksti);
  if (!n) return null;

  let mePerputhje = null;
  let gjatesiaMax = 0;
  for (const [celesi, qyteti] of INDEKSI) {
    if (celesi.length <= gjatesiaMax) continue;
    // Kufij fjale, që "viti" të mos përputhet brenda "vitiligo".
    const re = new RegExp(`(^|[^a-z0-9])${celesi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);
    if (re.test(n)) {
      mePerputhje = qyteti;
      gjatesiaMax = celesi.length;
    }
  }
  return mePerputhje;
}

const RREZJA_TOKES_KM = 6371;

function haversineKm(lat1, lng1, lat2, lng2) {
  const rad = (x) => (Number(x) * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RREZJA_TOKES_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Qyteti më i afërt brenda një kufiri. Kjo është shtresa MË E BESUESHME për
// Kosovën, ku adresat e Google shpesh janë të paplota ose në serbisht.
function qytetiMeIAfert(lat, lng, maksKm = 25) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  let iAferti = null;
  let dMin = Infinity;
  for (const q of QYTETET) {
    const d = haversineKm(lat, lng, q.lat, q.lng);
    if (d < dMin) {
      dMin = d;
      iAferti = q;
    }
  }
  if (!iAferti || dMin > maksKm) return null;
  return { ...iAferti, distancaKm: dMin };
}

// Kutia kufitare (viewport) e qytetit — përdoret te locationRestriction i Text Search,
// që rezultatet të mos rrjedhin nga Shkupi/Tirana.
function kutiaEQytetit(qyteti, shtesaKm = 0) {
  const q = typeof qyteti === 'string' ? gjejQytetin(qyteti) : qyteti;
  if (!q) return null;
  const rrezja = Number(q.rrezjaKm || 5) + Number(shtesaKm || 0);
  const dLat = rrezja / 111.32;
  const dLng = rrezja / (111.32 * Math.cos((q.lat * Math.PI) / 180));
  return {
    low: { latitude: q.lat - dLat, longitude: q.lng - dLng },
    high: { latitude: q.lat + dLat, longitude: q.lng + dLng },
  };
}

function emratEQyteteve() {
  return QYTETET.map((q) => q.emri);
}

module.exports = {
  QYTETET,
  normalizo,
  gjejQytetin,
  gjejQytetinNeTekst,
  qytetiMeIAfert,
  kutiaEQytetit,
  haversineKm,
  emratEQyteteve,
};
