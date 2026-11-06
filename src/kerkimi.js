// ============================================================
// KËRKIMI — normalizimi i tekstit + fusha 'emriKerkim' (v1.0.17)
// ------------------------------------------------------------
// PSE NJË FUSHË E RE?
// Firestore nuk bën kërkim "case-insensitive" dhe as pa diakritika.
// Duke ruajtur emrin e normalizuar TEK dokumenti (emriKerkim), kërkimi:
//   1. nuk e normalizon emrin për çdo biznes në çdo shkronjë të shtypur
//   2. gjen "Suhareke" edhe kur dokumenti ka "Suharekë"
//   3. lejon kërkim PREFIX në server (where('emriKerkim', '>=', q) ...)
//      pa shkarkuar të gjithë koleksionin
// Dokumentet e vjetra (pa emriKerkim) vazhdojnë të punojnë — ndertohet
// në fluturim nga ndertoEmrinKerkim().
// ============================================================

// ë → e, ç → c, shkronja të vogla, hapësira të vetme
export function normalizo(v) {
  return String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vlera që ruhet në fushën 'emriKerkim' të dokumentit të biznesit
export function ndertoEmrinKerkim(biznesi = {}) {
  const emri = normalizo(biznesi && biznesi.emri);
  const qyteti = normalizo(biznesi && biznesi.qyteti);
  return qyteti ? `${emri} ${qyteti}` : emri;
}

// Teksti i kërkueshëm i një biznesi (me fallback për dokumentet e vjetra)
export function tekstiKerkimit(biznesi = {}) {
  return biznesi.emriKerkim || ndertoEmrinKerkim(biznesi);
}

// A përputhet biznesi me pyetjen? Kontrollon emriKerkim (i shpejtë),
// pastaj emrin, qytetin, kategorinë, adresën dhe përshkrimin.
export function perputhetKerkimi(biznesi = {}, pyetja = '') {
  const fjala = normalizo(pyetja);
  if (!fjala) return true;
  const burimet = [
    tekstiKerkimit(biznesi),
    biznesi.emri,
    biznesi.qyteti,
    biznesi.kategoria,
    biznesi.adresa,
    biznesi.pershkrimi,
  ];
  return burimet.some((v) => normalizo(v).includes(fjala));
}

// Kufijtë për kërkim PREFIX në server:
//   where('emriKerkim', '>=', kufijteKerkimit(q).nga)
//   where('emriKerkim', '<=', kufijteKerkimit(q).deri)
// '\uf8ff' është karakteri më i lartë në Unicode që Firestore pranon.
export function kufijteKerkimit(pyetja) {
  const fjala = normalizo(pyetja);
  return {
    nga: fjala,
    deri: fjala ? `${fjala}\uf8ff` : fjala,
  };
}
