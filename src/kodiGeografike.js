import { CITET_GPS } from './qyteteGPS';
import { distancaKm } from './distanca';

// ===== KODIMI GEOGRAFIK — "ku jam?" me emër njerëzor (jo koordinata) =====
// Strategjia me 2 shtesa:
//  1. Qyteti më i afërt nga lista jonë (33 qytete) — I SHPEJTË, pa internet
//  2. Nominatim (OpenStreetMap) — EMRI REAL i vendit (qytet/fshat), FALAS, pa key
// Nëse s'ka internet, mbetet shtesa 1 — përdoruesi gjithmonë sheh NËNËR, jo numra.

// Qyteti më i afërt nga pozicioni (offline, i shpejtë)
export function qytetiMeIAferi(lat, lng) {
  let iAferi = null;
  let dMin = Infinity;
  for (const c of CITET_GPS) {
    const d = distancaKm(lat, lng, c.lat, c.lng);
    if (d < dMin) {
      dMin = d;
      iAferi = c;
    }
  }
  return iAferi ? { ...iAferi, distanca: dMin } : null;
}

// Emri real i vendit nga Nominatim (OSM) — p.sh. "Suharekë, Kosovë"
export async function kthePershkrimi(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=13&accept-language=sq,al,en`;
    const r = await fetch(url, { headers: { 'Accept-Language': 'sq,al,en' } });
    if (!r.ok) return null;
    const d = await r.json();
    const a = d.address || {};
    const emri = a.city || a.town || a.municipality || a.village || a.suburb || a.county || d.name;
    if (!emri) return null;
    const shteti = a.state || '';
    return shteti && shteti.toLowerCase() !== emri.toLowerCase() ? `${emri}, ${shteti}` : String(emri);
  } catch (e) {
    return null; // pa internet → thjesht null (thërretësi mban qytetin e afërt)
  }
}
