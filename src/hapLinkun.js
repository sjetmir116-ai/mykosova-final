// ===== HAP LINKUN ME FALLBACK (Navigo, Google Maps, etj.) =====
// Problemi që zgjidh: paneli i preview-s (iframe) blokon shpesh hapjen e tab-ve
// të rinj — window.open kthen null dhe butoni duket "i vdekur".
// Zgjidhje: nëse tab-i i ri bllokohet, linku hapet NË TAB-IN E NJEJTË
// (përdoruesi kthehet me butonin "Back" të browser-it).
export function hapLinkun(url) {
  let ndihmësja = null;
  try {
    ndihmësja = window.open(url, '_blank');
  } catch (e) {
    ndihmësja = null;
  }
  if (ndihmësja) return true; // hapet si tab i ri (rasti normal)
  // Fallback: hapet te tab-i aktual
  try {
    window.location.href = url;
    return false;
  } catch (e) {
    // Mjekimi i fundit: tregoj linkun që përdoruesi ta kopjojë
    console.error('S\u2019u hapur linku:', url, e);
    return false;
  }
}
