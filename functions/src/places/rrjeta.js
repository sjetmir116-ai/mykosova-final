// ===== RRJETA GJEOGRAFIKE (tiling) =====
// Problemi: Google Places kthen MAKSIMUM 20 rezultate për një searchNearby dhe
// maksimum 60 (3 faqe) për një searchText. Një kërkim i vetëm "restorante në
// Prishtinë" NUK i jep dot të gjitha.
//
// Zgjidhja: qyteti ndahet në qeliza të vogla dhe secila kërkohet veç. Sa më e
// vogël qeliza, aq më i plotë mbulimi — dhe aq më shumë thirrje API.
//
// Moduli është pure (pa rrjet, pa Firebase) → i testueshëm plotësisht.

const { gjejQytetin, haversineKm } = require('./qytetet');

const KM_PER_SHKALLE_LAT = 111.32;

// Rrezja e rrethit që mbulon plotësisht një qelizë katrore me brinjë `brinjaKm`.
// Gjysma e diagonales = (brinja/2) * √2. Rrathët mbivendosen pak — më mirë
// rezultate të dyfishta (dedup-i i heq) sesa vrima në mbulim.
function rrezjaEQelizes(brinjaKm) {
  return (Number(brinjaKm) / 2) * Math.SQRT2;
}

// Ndan një rreth (qendër + rreze) në qeliza katrore me brinjë `qelizaKm`.
// Kthen qendrat e qelizave që bien brenda rrethit.
function ndajNeQeliza({ lat, lng, rrezjaKm, qelizaKm = 2.5 }) {
  const qendra = { lat: Number(lat), lng: Number(lng) };
  const R = Number(rrezjaKm);
  const brinja = Math.max(0.25, Number(qelizaKm));

  if (!Number.isFinite(qendra.lat) || !Number.isFinite(qendra.lng) || !Number.isFinite(R) || R <= 0) {
    return [];
  }

  // Një qelizë e vetme mjafton nëse rrethi është më i vogël se qeliza.
  if (R * 2 <= brinja) {
    return [{ lat: qendra.lat, lng: qendra.lng, rrezjaKm: R }];
  }

  const hapiLat = brinja / KM_PER_SHKALLE_LAT;
  const kmPerShkalleLng = KM_PER_SHKALLE_LAT * Math.cos((qendra.lat * Math.PI) / 180);
  const hapiLng = brinja / Math.max(1e-6, kmPerShkalleLng);

  // Numri i hapave nga qendra deri te buza (rrumbullakim lart → pa vrima në cep).
  const nLat = Math.ceil(R / brinja);
  const nLng = Math.ceil(R / brinja);
  const rrezjaQelizes = rrezjaEQelizes(brinja);

  const qelizat = [];
  for (let i = -nLat; i <= nLat; i++) {
    for (let j = -nLng; j <= nLng; j++) {
      const qLat = qendra.lat + i * hapiLat;
      const qLng = qendra.lng + j * hapiLng;
      // Toleranca gjysmë-diagonale: mban qelizat që e prekin rrethin qoftë edhe pjesërisht.
      if (haversineKm(qendra.lat, qendra.lng, qLat, qLng) <= R + rrezjaQelizes) {
        qelizat.push({ lat: qLat, lng: qLng, rrezjaKm: rrezjaQelizes });
      }
    }
  }

  // Renditje nga qendra nga jashtë: bizneset më relevante importohen të parat,
  // kështu që edhe importi i ndërprerë nga buxheti jep rezultatin më të mirë.
  qelizat.sort(
    (a, b) =>
      haversineKm(qendra.lat, qendra.lng, a.lat, a.lng) -
      haversineKm(qendra.lat, qendra.lng, b.lat, b.lng)
  );

  return qelizat;
}

// Rrjeta për një qytet nga katalogu.
function rrjetaEQytetit(emriQytetit, qelizaKm = 2.5) {
  const q = gjejQytetin(emriQytetit);
  if (!q) return [];
  return ndajNeQeliza({ lat: q.lat, lng: q.lng, rrezjaKm: q.rrezjaKm, qelizaKm });
}

// Sa thirrje API do të kushtojë kjo rrjetë (1 kërkesë për qelizë te searchNearby).
function vleresoKerkesat(qytetet, qelizaKm = 2.5) {
  return (Array.isArray(qytetet) ? qytetet : [qytetet]).reduce(
    (shuma, qyteti) => shuma + rrjetaEQytetit(qyteti, qelizaKm).length,
    0
  );
}

module.exports = { ndajNeQeliza, rrjetaEQytetit, rrezjaEQelizes, vleresoKerkesat };
