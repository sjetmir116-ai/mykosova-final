// ===== GOOGLE PLACES API (NEW) =====
// API key vendoset nga përdoruesi dhe ruhet vetëm te localStorage i browser-it.
// Nuk ruhet në Firestore, nuk dërgohet në Firebase dhe nuk përfshihet në repo.

export const MAP_CATEGORIES = {
  restaurant: 'Restorante',
  cafe: 'Kafene',
  gas_station: 'Pika Karburanti',
  hotel: 'Hotele',
  hospital: 'Health',
  medical_clinic: 'Health',
  pharmacy: 'Health',
};

export const CITIES_LIST = [
  'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Mitrovicë', 'Suharekë', 'Kamenicë',
];

// Guard-i e mban modulin të sigurt edhe gjatë SSR/testeve, ku localStorage mund të mungojë.
function kaLocalStorage() {
  return typeof localStorage !== 'undefined';
}

export function merrGooglePlacesApiKey() {
  return kaLocalStorage() ? localStorage.getItem('GOOGLE_PLACES_API_KEY') || '' : '';
}

export function ruajGooglePlacesApiKey(key) {
  const keyPastruar = String(key || '').trim();
  if (kaLocalStorage() && keyPastruar) {
    localStorage.setItem('GOOGLE_PLACES_API_KEY', keyPastruar);
  }
}

export function fshiGooglePlacesApiKey() {
  if (kaLocalStorage()) {
    localStorage.removeItem('GOOGLE_PLACES_API_KEY');
  }
}

// I njëjti Google Place ID prodhon gjithmonë të njëjtin dokument Firestore.
// encodeURIComponent shmang karakteret që nuk mund të përdoren në një document path.
export function googlePlaceDocumentId(placeId) {
  if (!placeId) return '';
  return `google_${encodeURIComponent(placeId)}`;
}

// A ka ardhur ky biznes nga Google? 'googlePlaceId' vendoset nga wizard-i gjatë
// importimit; kontrollohen edhe 'googleFotoRef' e prefiksi i ID-së deterministe,
// që të njihen si regjistrimet e reja ashtu edhe ato të mëparshme.
export function ngaGoogle(biznesi) {
  if (!biznesi) return false;
  return Boolean(
    String(biznesi.googlePlaceId || '').trim() ||
    String(biznesi.googleFotoRef || '').trim() ||
    String(biznesi.id || '').startsWith('google_')
  );
}

export function normalizoQytetin(address) {
  if (!address) return '';
  const addrLower = address.toLowerCase();
  const mapping = {
    prishtin: 'Prishtinë',
    prizren: 'Prizren',
    pej: 'Pejë',
    gjakov: 'Gjakovë',
    ferizaj: 'Ferizaj',
    mitrovic: 'Mitrovicë',
    suharek: 'Suharekë',
    therand: 'Suharekë',
    kamenic: 'Kamenicë',
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (addrLower.includes(key)) return value;
  }
  return '';
}

// ===== FOTOJA E VENDIT (Place Photos — New) =====
// Places API (New) NUK kthen një URL fotoje. Kthen një "resource name" të formës
//   places/{placeId}/photos/{photoRef}
// Kjo referencë është E QËNDRUESHME (nuk skadon) — prandaj ruhet te Firestore.
// URL-ja e imazhit (photoUri) merret veçmas dhe është JETËSHKURTËR, ndaj ajo
// shërben për shfaqje, kurse referenca mundëson rigjenerimin më vonë.
export const FOTO_GJERESIA_PARAZGJEDHUR = 900;

export function merrReferencenFotos(place) {
  const foto = place && Array.isArray(place.photos) ? place.photos[0] : null;
  return foto && foto.name ? String(foto.name) : '';
}

// Google kërkon që atribuimi i autorit të shfaqet aty ku shfaqet fotoja.
export function merrAtributinFotos(place) {
  const foto = place && Array.isArray(place.photos) ? place.photos[0] : null;
  const autori = foto && Array.isArray(foto.authorAttributions) ? foto.authorAttributions[0] : null;
  return autori && autori.displayName ? String(autori.displayName) : '';
}

export function ndertoUrlMediaFotos(ref, maxWidthPx = FOTO_GJERESIA_PARAZGJEDHUR) {
  if (!ref) return '';
  // Google pranon vetëm 1–4800 px; vlerat jashtë kufirit japin INVALID_ARGUMENT.
  const numri = Number(maxWidthPx);
  const gjeresia = Math.min(4800, Math.max(1, Math.round(Number.isFinite(numri) && numri > 0 ? numri : FOTO_GJERESIA_PARAZGJEDHUR)));
  // skipHttpRedirect=true → përgjigje JSON me 'photoUri', në vend të redirect-it te imazhi.
  return `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${gjeresia}&skipHttpRedirect=true`;
}

// MBROJTJE SIGURIE: asnjë URL që mbart API key-in nuk guxon të ruhet te Firestore,
// sepse fusha 'foto' lexohet publikisht nga çdo vizitor (firestore.rules: allow get/list if true).
export function eSigurtPerRuajtje(url) {
  const u = String(url || '');
  if (!u.startsWith('https://')) return false;
  return !/[?&](key|api_?key)=/i.test(u);
}

// Kthen një URL të shfaqshme për referencën e dhënë. Key-i dërgohet vetëm si header,
// kurrë si pjesë e URL-së që përfundon te baza e të dhënave.
export async function merrUrlFotos(ref, maxWidthPx = FOTO_GJERESIA_PARAZGJEDHUR) {
  if (!ref) return '';

  const apiKey = merrGooglePlacesApiKey();
  if (!apiKey) throw new Error('MUNGON_KEY');

  let response;
  try {
    response = await fetch(ndertoUrlMediaFotos(ref, maxWidthPx), {
      method: 'GET',
      headers: { 'X-Goog-Api-Key': apiKey },
    });
  } catch {
    throw new Error('GABIM_RRJETI');
  }

  if (response.status === 400) throw new Error('KEY_I_GABUAR');
  if (response.status === 403) throw new Error('API_I_PAKTIVIZUAR');
  if (!response.ok) throw new Error('GABIM_RRJETI');

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('GABIM_RRJETI');
  }

  const photoUri = data && data.photoUri ? String(data.photoUri) : '';
  if (!photoUri) throw new Error('GABIM_RRJETI');
  if (!eSigurtPerRuajtje(photoUri)) throw new Error('FOTO_E_PASIGURT');
  return photoUri;
}

export async function kerkoNeGooglePlaces(query) {
  const kerkimi = String(query || '').trim();
  if (!kerkimi) return [];

  const apiKey = merrGooglePlacesApiKey();
  if (!apiKey) throw new Error('MUNGON_KEY');

  // Endpoint-i zyrtar i Places API (New): Text Search.
  // "https://googleapis.com" nuk është endpoint i vlefshëm për këtë API.
  const url = 'https://places.googleapis.com/v1/places:searchText';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.primaryType,places.internationalPhoneNumber,places.websiteUri,places.location,places.photos',
      },
      body: JSON.stringify({
        textQuery: kerkimi,
        regionCode: 'XK',
        languageCode: 'sq',
      }),
    });

    if (response.status === 400) throw new Error('KEY_I_GABUAR');
    if (response.status === 403) throw new Error('API_I_PAKTIVIZUAR');
    if (!response.ok) throw new Error('GABIM_RRJETI');

    const data = await response.json();
    return data.places || [];
  } catch (error) {
    if (error.message === 'KEY_I_GABUAR' || error.message === 'API_I_PAKTIVIZUAR') {
      throw error;
    }
    throw new Error('GABIM_RRJETI');
  }
}
