// ===== MAPIMI: Google Place → dokument biznesi i MyKosova =====
// Pure: pa rrjet, pa Firebase. Këtu jetojnë të gjitha vendimet:
//   kategoria · qyteti · cilësia · statusi (aprovar/pendshe) · siguria e fotos
//
// KUJDES ME FJALËT KYÇE: repo-ja përdor 'aprovar' dhe 'pendshe'
// (shih useBizneset.js, MenaxhoBizneset.jsx, firestore.rules). Çdo fjalë tjetër
// ("approved", "pending", "aprovuar") do ta fshihte biznesin nga app-i.

const { gjejQytetinNeTekst, qytetiMeIAfert, gjejQytetin } = require('./qytetet');
const { kategoriaNgaTipi } = require('./kategorite');

const STATUS_APROVUAR = 'aprovar';
const STATUS_PENDSHE = 'pendshe';

// Pragu i kalimit automatik në 'aprovar'. Shih llogaritSkorin() për pikët.
const PRAGU_APROVIMIT = 8;

// ---------- ndihmësa ----------

function tekst(vlera) {
  if (vlera === null || vlera === undefined) return '';
  if (typeof vlera === 'string') return vlera.trim();
  if (typeof vlera.text === 'string') return vlera.text.trim();
  return '';
}

function pastroPlaceId(placeId) {
  const v = String(placeId || '').trim();
  return v.startsWith('places/') ? v.slice('places/'.length) : v;
}

// I NJËJTI kontrat si te frontend-i (src/googlePlaces.js): i njëjti Place ID
// prodhon gjithmonë të njëjtin dokument → importi masiv dhe wizard-i individual
// nuk mund të krijojnë kurrë dublikatë mes tyre.
function googlePlaceDocumentId(placeId) {
  const id = pastroPlaceId(placeId);
  if (!id) return '';
  return `google_${encodeURIComponent(id)}`;
}

// MBROJTJE SIGURIE: fusha 'foto' lexohet publikisht (firestore.rules: allow get/list if true),
// prandaj asnjë URL që mbart një çelës nuk guxon të ruhet. Kopje besnike e
// eSigurtPerRuajtje() të frontend-it.
function eSigurtPerRuajtje(url) {
  const u = String(url || '');
  if (!u.startsWith('https://')) return false;
  return !/[?&](key|api_?key)=/i.test(u);
}

// Normalizim i telefonit për deduplikim: vetëm shifrat, me prefiksin kombëtar
// të hequr, që "+383 44 123 456", "044 123 456" dhe "44123456" të jenë i njëjti numër.
function normalizoTelefonin(telefoni) {
  let shifrat = String(telefoni || '').replace(/\D/g, '');
  if (!shifrat) return '';
  if (shifrat.startsWith('00')) shifrat = shifrat.slice(2);
  if (shifrat.startsWith('383')) shifrat = shifrat.slice(3);
  else if (shifrat.startsWith('377')) shifrat = shifrat.slice(3); // Monaco-range i përdorur në Kosovë
  else if (shifrat.startsWith('386')) shifrat = shifrat.slice(3);
  shifrat = shifrat.replace(/^0+/, '');
  return shifrat;
}

// Çelës i qëndrueshëm emër+qytet për rezervimin e deduplikimit.
function celesiEmriQyteti(emri, qyteti) {
  const n = (v) =>
    String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const e = n(emri);
  const q = n(qyteti);
  if (!e) return '';
  return `${e}|${q}`;
}

function merrReferencenFotos(place) {
  const foto = place && Array.isArray(place.photos) ? place.photos[0] : null;
  return foto && foto.name ? String(foto.name) : '';
}

function merrAtributinFotos(place) {
  const foto = place && Array.isArray(place.photos) ? place.photos[0] : null;
  const autori = foto && Array.isArray(foto.authorAttributions) ? foto.authorAttributions[0] : null;
  return autori && autori.displayName ? String(autori.displayName) : '';
}

// ---------- qyteti: 4 shtresa ----------
// Adresat e Google në Kosovë janë shpesh të paplota ose në serbisht, prandaj
// koordinatat (shtresa 3) janë më të besueshme se teksti.
function zgjidhQytetin(place, qytetiIKerkuar) {
  const komponentet = Array.isArray(place?.addressComponents) ? place.addressComponents : [];

  // 1) addressComponents — burimi më i strukturuar
  for (const lloji of ['locality', 'postal_town', 'administrative_area_level_2']) {
    const komp = komponentet.find((c) => Array.isArray(c?.types) && c.types.includes(lloji));
    const emri = tekst(komp?.longText) || tekst(komp?.shortText);
    const gjetur = emri && gjejQytetinNeTekst(emri);
    if (gjetur) return { qyteti: gjetur.emri, burimi: 'addressComponents' };
  }

  // 2) formattedAddress — alias-et (Priština, Therandë, Uroševac...)
  const ngaAdresa = gjejQytetinNeTekst(tekst(place?.formattedAddress));
  if (ngaAdresa) return { qyteti: ngaAdresa.emri, burimi: 'adresa' };

  // 3) koordinatat — më e besueshmja për Kosovën
  const lat = place?.location?.latitude;
  const lng = place?.location?.longitude;
  const ngaGps = qytetiMeIAfert(lat, lng, 25);
  if (ngaGps) return { qyteti: ngaGps.emri, burimi: 'gps', distancaKm: ngaGps.distancaKm };

  // 4) qyteti që e nisi kërkimin
  const iKerkuar = gjejQytetin(qytetiIKerkuar);
  if (iKerkuar) return { qyteti: iKerkuar.emri, burimi: 'kerkesa' };

  return { qyteti: String(qytetiIKerkuar || '').trim(), burimi: 'asnje' };
}

// ---------- kategoria ----------
function zgjidhKategorine(place, kategoriaEKerkuar) {
  const njohur = kategoriaNgaTipi(place?.primaryType, place?.types);
  if (njohur.emri) return { kategoria: njohur.emri, besueshmeria: njohur.besueshmeria };
  return { kategoria: String(kategoriaEKerkuar || '').trim(), besueshmeria: 'kerkesa' };
}

// ---------- skori i cilësisë ----------
// Vendos nëse biznesi publikohet drejtpërdrejt apo shkon në radhën e moderimit.
function llogaritSkorin(dok, konteksti = {}) {
  let pike = 0;
  const arsye = [];

  if (dok.emri && dok.emri.length > 1) { pike += 2; } else { arsye.push('pa emër të vlefshëm'); }
  if (Number.isFinite(dok.lat) && Number.isFinite(dok.lng)) { pike += 2; } else { arsye.push('pa koordinata'); }

  if (konteksti.besueshmeriaKategorise === 'e_larte') pike += 2;
  else if (konteksti.besueshmeriaKategorise === 'e_ulet') { pike += 1; arsye.push('kategoria nga tip dytësor'); }
  else arsye.push('kategoria nga kërkesa (e pakonfirmuar)');

  // Zero vlerësime në Google është sinjal i fortë se listimi s'është i verifikuar
  // (ose është i vjetruar), prandaj penalizohet — jo thjesht "pa pikë".
  const numriVleresimeve = Number(konteksti.numriVleresimeve || 0);
  if (numriVleresimeve >= 5) pike += 2;
  else if (numriVleresimeve >= 1) { pike += 1; arsye.push('pak vlerësime në Google'); }
  else { pike -= 1; arsye.push('asnjë vlerësim në Google'); }

  if (dok.adresa) pike += 1; else arsye.push('pa adresë');
  if (dok.telefoni) pike += 1; else arsye.push('pa telefon');
  if (dok.website) pike += 1;
  if (Number(dok.vleresimi || 0) >= 3.5) pike += 1;
  if (konteksti.burimiQytetit && konteksti.burimiQytetit !== 'asnje' && konteksti.burimiQytetit !== 'kerkesa') pike += 1;
  else arsye.push('qyteti i pakonfirmuar');

  if (konteksti.telefonDublikat) { pike -= 4; arsye.push('telefon i njëjtë me një biznes ekzistues'); }

  const statusiBiznesit = String(konteksti.businessStatus || '').toUpperCase();
  if (statusiBiznesit && statusiBiznesit !== 'OPERATIONAL') {
    pike -= 6;
    arsye.push(`statusi në Google: ${statusiBiznesit}`);
  }

  return { skori: Math.max(0, pike), arsye };
}

function vendosStatusin(skori, statusiIKerkuar = 'auto') {
  if (statusiIKerkuar === STATUS_APROVUAR) return STATUS_APROVUAR;
  if (statusiIKerkuar === STATUS_PENDSHE) return STATUS_PENDSHE;
  return skori >= PRAGU_APROVIMIT ? STATUS_APROVUAR : STATUS_PENDSHE;
}

// ---------- orari ----------
// Ruhet si string i thjeshtë, sepse frontend-i (BiznesiPanel) e trajton fushën
// 'orari' si tekst të lirë. Marrim 'weekdayDescriptions' të Google.
function formatoOrarin(place) {
  const orari = place?.regularOpeningHours || place?.currentOpeningHours;
  const rreshtat = Array.isArray(orari?.weekdayDescriptions) ? orari.weekdayDescriptions : [];
  if (!rreshtat.length) return '';
  return rreshtat.map((r) => String(r).trim()).filter(Boolean).join(' · ').slice(0, 500);
}

// ---------- mapimi kryesor ----------
// Kthen { ok, arsyeja?, dok?, meta? }. Mospranimi është informacion, jo përjashtim:
// orkestratori i numëron arsyet dhe i raporton te dokumenti i punës.
function mapoPlace(place, opsionet = {}) {
  const {
    kategoriaEKerkuar = '',
    qytetiIKerkuar = '',
    statusi = 'auto',
    telefonDublikat = false,
    autori = 'Importuesi masiv (Google Places)',
    uidPronari = 'sistemi',
  } = opsionet;

  const placeId = pastroPlaceId(place?.id || place?.name);
  if (!placeId) return { ok: false, arsyeja: 'pa_place_id' };

  const emri = tekst(place?.displayName);
  if (!emri) return { ok: false, arsyeja: 'pa_emer' };

  const businessStatus = String(place?.businessStatus || '').toUpperCase();
  // Vendet e mbyllura përgjithmonë s'kanë pse të hyjnë fare në bazë.
  if (businessStatus === 'CLOSED_PERMANENTLY') {
    return { ok: false, arsyeja: 'i_mbyllur_perfundimisht' };
  }

  const { kategoria, besueshmeria } = zgjidhKategorine(place, kategoriaEKerkuar);
  const { qyteti, burimi: burimiQytetit } = zgjidhQytetin(place, qytetiIKerkuar);

  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  const telefoni = tekst(place?.internationalPhoneNumber) || tekst(place?.nationalPhoneNumber);
  const website = tekst(place?.websiteUri);
  const adresa = tekst(place?.formattedAddress);
  const vleresimi = Number(place?.rating);
  const numriVleresimeve = Number(place?.userRatingCount || 0);
  const fotoRef = merrReferencenFotos(place);

  const dok = {
    emri,
    pershkrimi: tekst(place?.editorialSummary) || '',
    kategoria,
    qyteti,
    adresa,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    foto: '', // mbushet nga orkestratori vetëm nëse URL-ja është e sigurt
    oferta: '',
    telefoni,
    whatsapp: telefoni,
    website,
    orari: formatoOrarin(place),
    vleresimi: Number.isFinite(vleresimi) ? Math.round(vleresimi * 10) / 10 : 0,
    // Fushat e gjurmës së Google — të njëjtat emra si te wizard-i individual.
    googlePlaceId: placeId,
    googleFotoRef: fotoRef,
    googleFotoAutori: merrAtributinFotos(place),
    googleNumriVleresimeve: numriVleresimeve,
    googleTipi: tekst(place?.primaryType),
    // Gjurma e importit — e dukshme te paneli, e dobishme për rollback.
    burimiImportit: 'google_places_bulk',
    shtuarMNga: autori,
    uidPronari,
    krijuarM: new Date().toISOString(),
  };

  const { skori, arsye } = llogaritSkorin(dok, {
    besueshmeriaKategorise: besueshmeria,
    burimiQytetit,
    numriVleresimeve,
    telefonDublikat,
    businessStatus,
  });

  dok.status = vendosStatusin(skori, statusi);
  dok.cilesiaSkori = skori;

  return {
    ok: true,
    dok,
    meta: {
      placeId,
      docId: googlePlaceDocumentId(placeId),
      celesiEmriQyteti: celesiEmriQyteti(emri, qyteti),
      telefoniNormalizuar: normalizoTelefonin(telefoni),
      fotoRef,
      skori,
      arsye,
      burimiQytetit,
      besueshmeriaKategorise: besueshmeria,
      businessStatus,
    },
  };
}

module.exports = {
  STATUS_APROVUAR,
  STATUS_PENDSHE,
  PRAGU_APROVIMIT,
  googlePlaceDocumentId,
  eSigurtPerRuajtje,
  normalizoTelefonin,
  celesiEmriQyteti,
  merrReferencenFotos,
  merrAtributinFotos,
  zgjidhQytetin,
  zgjidhKategorine,
  llogaritSkorin,
  vendosStatusin,
  formatoOrarin,
  mapoPlace,
};
