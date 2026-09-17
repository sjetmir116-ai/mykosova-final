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
