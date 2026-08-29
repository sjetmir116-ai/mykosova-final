// ===== HAP LINKUN me 3 SHTESE (Navigo, Google Maps, etj.) =====
// 1. Tab i ri (rasti normal — kur browser-i e lejon)
// 2. Embed (p.sh. Google Maps "output=embed" — LEJOHET edhe brenda panelit/iframe,
//    sepse Google refuzon veten brenda iframe pa qenë embed: "refused to connect")
// 3. Tab-i aktual (mjekimi i fundit për link-e të tjera)
export function hapLinkun(url, embedUrl = null) {
  let ndihmësja = null;
  try {
    ndihmësja = window.open(url, '_blank');
  } catch (e) {
    ndihmësja = null;
  }
  if (ndihmësja) return 'tab-i-ri';

  // Shtesa 2: versioni embed (mushkullon "refused to connect" te paneli)
  if (embedUrl) {
    try {
      window.location.href = embedUrl;
      return 'embed';
    } catch (e) {
      // shko te shtesa 3
    }
  }

  // Shtesa 3: tab-i aktual
  try {
    window.location.href = url;
    return 'tabi-aktual';
  } catch (e) {
    console.error('S\u2019u hapur linku:', url, e);
    return 'gabim';
  }
}
