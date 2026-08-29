// ===== DISTANCA GPS (Haversine) =====
// Përdoret për "Afër meje" + renditjen sipas distancës (spec U8, U21)

const RRAZEA_DJETE = 6371; // km

// Distanca në km midis dy pike (lat/lng)
export function distancaKm(lat1, lng1, lat2, lng2) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * RRAZEA_DJETE * Math.asin(Math.sqrt(a));
}

// Formaton distancën në mënyrë të lexueshme: "850 m" / "3.4 km"
export function formatoDistancm(km) {
  if (km == null || isNaN(km)) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Shton distancën te një biznes nëse ka GPS + ka përdoruesi pozicion
export function meDistanca(biznesi, perezioni) {
  if (
    perezon.lat != null && perezon.lng != null &&
    biznesi.lat != null && biznesi.lng != null
  ) {
    return { ...biznesi, distanca: distancaKm(perezon.lat, perezon.lng, Number(biznesi.lat), Number(biznesi.lng)) };
  }
  return { ...biznesi, distanca: null };
}
