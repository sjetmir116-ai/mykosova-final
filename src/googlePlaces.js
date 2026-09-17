// ===== GOOGLE PLACES API (NEW) — KËRKIM DIREKT NGA BROWSERI =====
// API key vendoset nga vetë përdoruesi dhe ruhet vetëm në localStorage.
// Nuk dërgohet në Firebase ose në serverët e MyKosova.

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
  'Prishtinë',
  'Prizren',
  'Pejë',
  'Gjakovë',
  'Ferizaj',
  'Mitrovicë',
  'Suharekë',
  'Kamenicë',
];

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

  const apiKey = typeof localStorage !== 'undefined'
    ? localStorage.getItem('GOOGLE_PLACES_API_KEY')
    : null;
  if (!apiKey) throw new Error('MUNGON_KEY');

  // Endpoint-i zyrtar i Places API (New): Text Search.
  const url = 'https://places.googleapis.com/v1/places:searchText';

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

  if (response.status === 403) throw new Error('API_I_PAKTIVIZUAR');
  if (response.status === 400) throw new Error('KEY_I_GABUAR');
  if (!response.ok) throw new Error('GABIM_RRJETI');

  const data = await response.json();
  return data.places || [];
}
