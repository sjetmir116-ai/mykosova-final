import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../AppContext';
import { db, fcn, auth } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import {
  eSigurtPerRuajtje,
  fshiGooglePlacesApiKey,
  googlePlaceDocumentId,
  merrAtributinFotos,
  merrGooglePlacesApiKey,
  merrReferencenFotos,
  merrUrlFotos,
  ruajGooglePlacesApiKey,
} from '../googlePlaces';

// ===== IMPORT MASIV — Google Places → Firestore =====
// Paneli thërret VETËM callable-in; asnjë API key nuk kalon nga browser-i.
// Çelësi jeton te Firebase Secrets (GOOGLE_PLACES_API_KEY) dhe përdoret
// server-side nga Admin SDK-ja, e cila mund të shkruajë direkt 'aprovar'
// (rules-i s'e lejon këtë nga klienti — shih firestore.rules §3).
//
// Puna ndahet në copa: callable-i kthen perfunduar=false dhe ne e rithërrasim
// me { jobId, vazhdo: true } derisa të mbarojë. Progresi vjen live nga
// onSnapshot te importJobs/{jobId}.

// Fallback nëse katalogu s'merret dot nga serveri (p.sh. functions pa deploy).
const QYTETET_FALLBACK = [
  'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë',
  'Podujevë', 'Vushtrri', 'Suharekë', 'Rahovec', 'Drenas', 'Lipjan', 'Malishevë',
  'Kamenicë', 'Viti', 'Deçan', 'Istog', 'Klinë', 'Skenderaj', 'Fushë Kosovë',
  'Obiliq', 'Kaçanik', 'Shtime', 'Dragash', 'Graçanicë',
];
const KATEGORITE_FALLBACK = [
  'Restorante', 'Kafene', 'Hotele', 'Pika Karburanti', 'Health', 'Automotive',
  'Shopping', 'Services', 'Business', 'Turizëm', 'Hospitality', 'Food', 'Emergjenca',
];

const QYTETET_KRYESORE = ['Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë'];

const STRATEGJITE = [
  { id: 'shpejt', emri: '⚡ Shpejt', pershkrimi: 'Text Search me pyetje sinonime — i shpejtë, ~100–300 vende për qytet.' },
  { id: 'rrjete', emri: '🕸️ Rrjetë', pershkrimi: 'Nearby mbi rrjetë qelizash — shterrues, kap edhe bizneset e vogla.' },
  { id: 'plote', emri: '🎯 E plotë', pershkrimi: 'Të dyja bashkë — mbulimi maksimal (rekomandohet për qytetet kryesore).' },
];

const STATUSET = [
  { id: 'auto', emri: '🤖 Auto (skor cilësie)', pershkrimi: 'Bizneset cilësore → aprovar; të tjerat → pendshe për moderim.' },
  { id: 'aprovar', emri: '✅ Të gjitha aprovar', pershkrimi: 'Publikohen të gjitha menjëherë — përdore vetëm kur i beson burimit.' },
  { id: 'pendshe', emri: '⏳ Të gjitha pendshe', pershkrimi: 'Asgjë s\u2019publikohet pa e parë ti te Menaxho Bizneset.' },
];

// ============================================================================
// ⚠️ ZGJIDHJE E PËRKOHSHME — IMPORTI DIREKT NGA BROWSERI (pa Cloud Functions)
// ----------------------------------------------------------------------------
// Pse ekziston: derisa Service Account JSON / deploy-i i Functions të jetë gati,
// mbushja e parë masive e tregut bëhet direkt nga paneli i adminit. Këtu
// riprodhohet, në klient, e njëjta zinxhir pune e serverit:
//   Google Places (New) → mapim qyteti/kategorie → skor cilësie → Firestore
// me ID deterministe google_{placeId} (I NJËJTI kontrat me wizard-in dhe me
// importuesin server-side → asnjë dublikatë mes tyre).
//
// KUFIZIMET (të ndërgjegjshme, prandaj kjo është e përkohshme):
//  1. Çelësi i Google merret nga localStorage → duhet çelës me RESTRIKSION referrer-i.
//  2. firestore.rules e lejon 'create' nga klienti VETËM me status 'pendshe' dhe
//     uidPronari == uid-i im; prandaj 'aprovar' vendoset me një update të dytë,
//     i cili kalon vetëm nëse je admin/moderator.
//  3. Rezervimi atomik te 'biznesetIndeks' s'shkruhet dot nga klienti — deduplikimi
//     këtu bëhet me indeks në memorie + getDoc para shkrimit (jo transaksional).
// Kur Functions të jetë live, ky seksion HIQET dhe mbetet vetëm rruga callable.
// ============================================================================

// Qendrat e komunave + aliaset (shqip/serbisht/anglisht) — kopje e reduktuar e
// functions/src/places/qytetet.js, sepse Functions-i është CommonJS dhe s'importohet dot.
const QYTETET_GEO = [
  { emri: 'Prishtinë', lat: 42.6629, lng: 21.1655, rrezjaKm: 9, alias: ['prishtina', 'pristina', 'pristina', 'prishtine'] },
  { emri: 'Prizren', lat: 42.2139, lng: 20.7397, rrezjaKm: 7, alias: ['prizreni'] },
  { emri: 'Pejë', lat: 42.6593, lng: 20.2887, rrezjaKm: 7, alias: ['peja', 'pec', 'peje', 'ipek'] },
  { emri: 'Gjakovë', lat: 42.3803, lng: 20.4308, rrezjaKm: 6, alias: ['gjakova', 'djakovica', 'gjakove'] },
  { emri: 'Ferizaj', lat: 42.3706, lng: 21.1483, rrezjaKm: 6, alias: ['ferizaji', 'urosevac'] },
  { emri: 'Gjilan', lat: 42.4635, lng: 21.4694, rrezjaKm: 6, alias: ['gjilani', 'gnjilane'] },
  { emri: 'Mitrovicë', lat: 42.8914, lng: 20.8660, rrezjaKm: 7, alias: ['mitrovica', 'kosovska mitrovica', 'mitrovice'] },
  { emri: 'Podujevë', lat: 42.9106, lng: 21.1933, rrezjaKm: 5, alias: ['podujeva', 'besiana', 'podujevo'] },
  { emri: 'Vushtrri', lat: 42.8231, lng: 20.9675, rrezjaKm: 5, alias: ['vushtrria', 'vucitrn'] },
  { emri: 'Suharekë', lat: 42.3589, lng: 20.8253, rrezjaKm: 5, alias: ['suhareka', 'therande', 'theranda', 'suva reka'] },
  { emri: 'Rahovec', lat: 42.3994, lng: 20.6547, rrezjaKm: 5, alias: ['rahoveci', 'orahovac'] },
  { emri: 'Drenas', lat: 42.6250, lng: 20.8931, rrezjaKm: 5, alias: ['gllogoc', 'glogovac', 'gllogovc'] },
  { emri: 'Lipjan', lat: 42.5219, lng: 21.1258, rrezjaKm: 5, alias: ['lipjani', 'lipljan'] },
  { emri: 'Malishevë', lat: 42.4822, lng: 20.7458, rrezjaKm: 5, alias: ['malisheva', 'malisevo'] },
  { emri: 'Kamenicë', lat: 42.5781, lng: 21.5794, rrezjaKm: 5, alias: ['kamenica', 'dardane', 'dardana'] },
  { emri: 'Viti', lat: 42.3214, lng: 21.3578, rrezjaKm: 4, alias: ['vitia', 'vitina'] },
  { emri: 'Deçan', lat: 42.5403, lng: 20.2886, rrezjaKm: 5, alias: ['decan', 'decani'] },
  { emri: 'Istog', lat: 42.7806, lng: 20.4856, rrezjaKm: 5, alias: ['istogu', 'burim', 'istok'] },
  { emri: 'Klinë', lat: 42.6217, lng: 20.5772, rrezjaKm: 5, alias: ['klina', 'kline'] },
  { emri: 'Skenderaj', lat: 42.7469, lng: 20.7889, rrezjaKm: 5, alias: ['skenderaji', 'srbica'] },
  { emri: 'Fushë Kosovë', lat: 42.6392, lng: 21.0961, rrezjaKm: 4, alias: ['fushe kosove', 'kosovo polje'] },
  { emri: 'Obiliq', lat: 42.6867, lng: 21.0703, rrezjaKm: 4, alias: ['obiliqi', 'kastriot', 'obilic'] },
  { emri: 'Kaçanik', lat: 42.2314, lng: 21.2597, rrezjaKm: 4, alias: ['kacanik', 'kacaniku'] },
  { emri: 'Shtime', lat: 42.4331, lng: 21.0397, rrezjaKm: 4, alias: ['shtimja', 'stimlje'] },
  { emri: 'Dragash', lat: 42.0619, lng: 20.6531, rrezjaKm: 5, alias: ['dragashi', 'sharr'] },
  { emri: 'Graçanicë', lat: 42.5992, lng: 21.1936, rrezjaKm: 4, alias: ['gracanice', 'gracanica'] },
];

// Kategoritë tona ⇄ tipat/pyetjet e Google — kopje e reduktuar e
// functions/src/places/kategorite.js. Emrat JANË ata të useKontenti.js.
const KATEGORITE_GOOGLE = {
  'Restorante': {
    tipat: ['restaurant', 'pizza_restaurant', 'fast_food_restaurant', 'hamburger_restaurant', 'meal_takeaway', 'meal_delivery', 'steak_house', 'seafood_restaurant', 'italian_restaurant', 'turkish_restaurant'],
    pyetjet: ['restorant', 'pizzeri', 'fast food', 'qebaptore'],
  },
  'Kafene': {
    tipat: ['cafe', 'coffee_shop', 'bakery', 'bar', 'pub', 'ice_cream_shop', 'dessert_shop'],
    pyetjet: ['kafene', 'coffee shop', 'bar', 'pastiçeri'],
  },
  'Hotele': {
    tipat: ['hotel', 'lodging', 'motel', 'guest_house', 'hostel', 'bed_and_breakfast', 'resort_hotel'],
    pyetjet: ['hotel', 'motel', 'bujtinë', 'guest house'],
  },
  'Pika Karburanti': {
    tipat: ['gas_station', 'electric_vehicle_charging_station'],
    pyetjet: ['pikë karburanti', 'gas station', 'benzinë'],
  },
  'Health': {
    tipat: ['hospital', 'pharmacy', 'doctor', 'dentist', 'medical_lab', 'drugstore', 'veterinary_care', 'physiotherapist'],
    pyetjet: ['spital', 'barnatore', 'ordinancë', 'klinikë dentare'],
  },
  'Automotive': {
    tipat: ['car_repair', 'car_dealer', 'car_wash', 'car_rental', 'auto_parts_store', 'tire_shop'],
    pyetjet: ['autoservis', 'lavazh', 'rent a car', 'gomeri'],
  },
  'Shopping': {
    tipat: ['shopping_mall', 'supermarket', 'grocery_store', 'clothing_store', 'shoe_store', 'electronics_store', 'furniture_store', 'convenience_store', 'book_store'],
    pyetjet: ['market', 'supermarket', 'qendër tregtare', 'dyqan rrobash'],
  },
  'Services': {
    tipat: ['beauty_salon', 'hair_salon', 'barber_shop', 'laundry', 'travel_agency', 'real_estate_agency', 'insurance_agency', 'spa'],
    pyetjet: ['sallon bukurie', 'berber', 'agjenci udhëtimi', 'agjenci patundshmërish'],
  },
  'Business': {
    tipat: ['bank', 'atm', 'accounting', 'lawyer', 'corporate_office', 'post_office', 'printing_service'],
    pyetjet: ['bankë', 'zyre avokatie', 'kontabilitet', 'posta'],
  },
  'Turizëm': {
    tipat: ['tourist_attraction', 'museum', 'park', 'national_park', 'art_gallery', 'historical_landmark', 'hiking_area', 'campground'],
    pyetjet: ['atraksion turistik', 'muze', 'park', 'monument'],
  },
  'Hospitality': {
    tipat: ['event_venue', 'banquet_hall', 'wedding_venue', 'night_club', 'convention_center'],
    pyetjet: ['sallë dasmash', 'event venue', 'klub nate'],
  },
  'Food': {
    tipat: ['food_store', 'butcher_shop', 'candy_store', 'deli', 'liquor_store', 'wine_store'],
    pyetjet: ['mishtore', 'depo ushqimore', 'bulmet'],
  },
  'Emergjenca': {
    tipat: ['police', 'fire_station', 'emergency_room', 'ambulance_service'],
    pyetjet: ['stacion policie', 'zjarrfikës', 'urgjenca'],
  },
};

// Field mask i pasur: telefoni/website/orari vijnë BRENDA kërkimit → pa thirrje Details.
const FUSHAT_E_VENDIT_DIREKT = [
  'id', 'displayName', 'formattedAddress', 'addressComponents', 'location', 'rating',
  'userRatingCount', 'primaryType', 'types', 'businessStatus', 'internationalPhoneNumber',
  'nationalPhoneNumber', 'websiteUri', 'regularOpeningHours', 'editorialSummary', 'photos',
];
const MASKA_TEXT_DIREKT = ['nextPageToken', ...FUSHAT_E_VENDIT_DIREKT.map((f) => `places.${f}`)].join(',');
const URL_TEXT_SEARCH = 'https://places.googleapis.com/v1/places:searchText';
const PRAGU_APROVIMIT_DIREKT = 8;
const KOLEKSIONI_BIZNESET = 'bizneset';

const normalizoDirekt = (v) => String(v || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const INDEKSI_QYTETEVE = new Map();
for (const q of QYTETET_GEO) {
  INDEKSI_QYTETEVE.set(normalizoDirekt(q.emri), q);
  for (const a of q.alias) INDEKSI_QYTETEVE.set(normalizoDirekt(a), q);
}

function gjejQytetinDirekt(emri) {
  return INDEKSI_QYTETEVE.get(normalizoDirekt(emri)) || null;
}

// Kërkon çdo alias brenda një teksti të lirë; preferon përputhjen më të gjatë,
// që "Fushë Kosovë" të mos humbasë nga "Kosovë".
function gjejQytetinNeTekstDirekt(teksti) {
  const n = normalizoDirekt(teksti);
  if (!n) return null;
  let gjetur = null;
  let gjatesiaMax = 0;
  for (const [celesi, qyteti] of INDEKSI_QYTETEVE) {
    if (celesi.length <= gjatesiaMax) continue;
    const re = new RegExp(`(^|[^a-z0-9])${celesi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);
    if (re.test(n)) {
      gjetur = qyteti;
      gjatesiaMax = celesi.length;
    }
  }
  return gjetur;
}

const RREZJA_TOKES_KM = 6371;

function haversineKmDirekt(lat1, lng1, lat2, lng2) {
  const rad = (x) => (Number(x) * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RREZJA_TOKES_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Koordinatat janë shtresa më e besueshme për Kosovën (adresat e Google shpesh
// janë të paplota ose në serbisht).
function qytetiMeIAfertDirekt(lat, lng, maksKm = 25) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  let iAferti = null;
  let dMin = Infinity;
  for (const q of QYTETET_GEO) {
    const d = haversineKmDirekt(lat, lng, q.lat, q.lng);
    if (d < dMin) { dMin = d; iAferti = q; }
  }
  return iAferti && dMin <= maksKm ? iAferti : null;
}

// Kutia kufitare e qytetit — pa të, Text Search rrjedh te Shkupi/Tirana.
function kutiaEQytetitDirekt(emriQytetit) {
  const q = gjejQytetinDirekt(emriQytetit);
  if (!q) return null;
  const dLat = q.rrezjaKm / 111.32;
  const dLng = q.rrezjaKm / (111.32 * Math.cos((q.lat * Math.PI) / 180));
  return {
    low: { latitude: q.lat - dLat, longitude: q.lng - dLng },
    high: { latitude: q.lat + dLat, longitude: q.lng + dLng },
  };
}

function kategoriaNgaTipiDirekt(primaryType, types = []) {
  const kryesori = String(primaryType || '').trim();
  if (kryesori) {
    for (const [emri, def] of Object.entries(KATEGORITE_GOOGLE)) {
      if (def.tipat.includes(kryesori)) return { emri, besueshmeria: 'e_larte' };
    }
  }
  for (const tipi of Array.isArray(types) ? types : []) {
    for (const [emri, def] of Object.entries(KATEGORITE_GOOGLE)) {
      if (def.tipat.includes(String(tipi))) return { emri, besueshmeria: 'e_ulet' };
    }
  }
  return { emri: '', besueshmeria: 'kerkesa' };
}

function tekstiGoogle(vlera) {
  if (vlera === null || vlera === undefined) return '';
  if (typeof vlera === 'string') return vlera.trim();
  if (typeof vlera.text === 'string') return vlera.text.trim();
  return '';
}

function normalizoTelefoninDirekt(telefoni) {
  let shifrat = String(telefoni || '').replace(/\D/g, '');
  if (!shifrat) return '';
  if (shifrat.startsWith('00')) shifrat = shifrat.slice(2);
  if (shifrat.startsWith('383') || shifrat.startsWith('377') || shifrat.startsWith('386')) shifrat = shifrat.slice(3);
  return shifrat.replace(/^0+/, '');
}

function celesiEmriQytetiDirekt(emri, qyteti) {
  const n = (v) => String(v || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const e = n(emri);
  return e ? `${e}|${n(qyteti)}` : '';
}

// Skori i cilësisë — i njëjti kontrat me functions/src/places/mapping.js.
function llogaritSkorinDirekt(dok, konteksti = {}) {
  let pike = 0;
  if (dok.emri && dok.emri.length > 1) pike += 2;
  if (Number.isFinite(dok.lat) && Number.isFinite(dok.lng)) pike += 2;
  if (konteksti.besueshmeriaKategorise === 'e_larte') pike += 2;
  else if (konteksti.besueshmeriaKategorise === 'e_ulet') pike += 1;

  const vleresime = Number(konteksti.numriVleresimeve || 0);
  if (vleresime >= 5) pike += 2;
  else if (vleresime >= 1) pike += 1;
  else pike -= 1;

  if (dok.adresa) pike += 1;
  if (dok.telefoni) pike += 1;
  if (dok.website) pike += 1;
  if (Number(dok.vleresimi || 0) >= 3.5) pike += 1;
  if (konteksti.burimiQytetit && konteksti.burimiQytetit !== 'asnje' && konteksti.burimiQytetit !== 'kerkesa') pike += 1;
  if (String(konteksti.businessStatus || '').toUpperCase() === 'CLOSED_TEMPORARILY') pike -= 6;
  return Math.max(0, pike);
}

function formatoOrarinDirekt(place) {
  const orari = place?.regularOpeningHours || place?.currentOpeningHours;
  const rreshtat = Array.isArray(orari?.weekdayDescriptions) ? orari.weekdayDescriptions : [];
  return rreshtat.map((r) => String(r).trim()).filter(Boolean).join(' · ').slice(0, 500);
}

// Google Place → dokument biznesi. Kthen { ok, arsyeja } ose { ok, dok, meta }.
function mapoPlaceDirekt(place, { kategoriaEKerkuar = '', qytetiIKerkuar = '', statusi = 'auto', autori = '', uidPronari = '' } = {}) {
  const placeIdBruto = String(place?.id || place?.name || '').trim();
  const placeId = placeIdBruto.startsWith('places/') ? placeIdBruto.slice('places/'.length) : placeIdBruto;
  if (!placeId) return { ok: false, arsyeja: 'pa_place_id' };

  const emri = tekstiGoogle(place?.displayName);
  if (!emri) return { ok: false, arsyeja: 'pa_emer' };

  const businessStatus = String(place?.businessStatus || '').toUpperCase();
  if (businessStatus === 'CLOSED_PERMANENTLY') return { ok: false, arsyeja: 'i_mbyllur_perfundimisht' };

  const { emri: kategoriaNjohur, besueshmeria } = kategoriaNgaTipiDirekt(place?.primaryType, place?.types);
  const kategoria = kategoriaNjohur || String(kategoriaEKerkuar || '').trim();

  // Qyteti: 1) addressComponents 2) adresa 3) koordinatat 4) qyteti i kërkuar
  let qyteti = '';
  let burimiQytetit = 'asnje';
  const komponentet = Array.isArray(place?.addressComponents) ? place.addressComponents : [];
  for (const lloji of ['locality', 'postal_town', 'administrative_area_level_2']) {
    const komp = komponentet.find((c) => Array.isArray(c?.types) && c.types.includes(lloji));
    const gjetur = komp && gjejQytetinNeTekstDirekt(tekstiGoogle(komp.longText) || tekstiGoogle(komp.shortText));
    if (gjetur) { qyteti = gjetur.emri; burimiQytetit = 'addressComponents'; break; }
  }
  if (!qyteti) {
    const ngaAdresa = gjejQytetinNeTekstDirekt(tekstiGoogle(place?.formattedAddress));
    if (ngaAdresa) { qyteti = ngaAdresa.emri; burimiQytetit = 'adresa'; }
  }
  if (!qyteti) {
    const ngaGps = qytetiMeIAfertDirekt(place?.location?.latitude, place?.location?.longitude, 25);
    if (ngaGps) { qyteti = ngaGps.emri; burimiQytetit = 'gps'; }
  }
  if (!qyteti) {
    const iKerkuar = gjejQytetinDirekt(qytetiIKerkuar);
    qyteti = iKerkuar ? iKerkuar.emri : String(qytetiIKerkuar || '').trim();
    burimiQytetit = iKerkuar ? 'kerkesa' : 'asnje';
  }

  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  const telefoni = tekstiGoogle(place?.internationalPhoneNumber) || tekstiGoogle(place?.nationalPhoneNumber);
  const vleresimi = Number(place?.rating);
  const numriVleresimeve = Number(place?.userRatingCount || 0);
  const fotoRef = merrReferencenFotos(place);

  const dok = {
    emri,
    pershkrimi: tekstiGoogle(place?.editorialSummary) || '',
    kategoria,
    qyteti,
    adresa: tekstiGoogle(place?.formattedAddress),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    foto: '',
    oferta: '',
    telefoni,
    whatsapp: telefoni,
    website: tekstiGoogle(place?.websiteUri),
    orari: formatoOrarinDirekt(place),
    vleresimi: Number.isFinite(vleresimi) ? Math.round(vleresimi * 10) / 10 : 0,
    googlePlaceId: placeId,
    googleFotoRef: fotoRef,
    googleFotoAutori: merrAtributinFotos(place),
    googleNumriVleresimeve: numriVleresimeve,
    googleTipi: tekstiGoogle(place?.primaryType),
    burimiImportit: 'google_places_browser',
    shtuarMNga: autori || 'Importi direkt nga browseri',
    uidPronari,
    krijuarM: new Date().toISOString(),
  };

  const skori = llogaritSkorinDirekt(dok, {
    besueshmeriaKategorise: besueshmeria,
    burimiQytetit,
    numriVleresimeve,
    businessStatus,
  });

  let statusiFinal = 'pendshe';
  if (statusi === 'aprovar') statusiFinal = 'aprovar';
  else if (statusi === 'auto' && skori >= PRAGU_APROVIMIT_DIREKT) statusiFinal = 'aprovar';

  dok.cilesiaSkori = skori;
  dok.status = statusiFinal;

  return {
    ok: true,
    dok,
    meta: {
      placeId,
      docId: googlePlaceDocumentId(placeId),
      celesiEmriQyteti: celesiEmriQytetiDirekt(emri, qyteti),
      telefoniNormalizuar: normalizoTelefoninDirekt(telefoni),
      fotoRef,
      skori,
    },
  };
}

// Text Search me paginim, direkt nga browser-i. Çelësi shkon VETËM si header.
async function kerkoTekstDirekt({ apiKey, pyetja, kutia, maksFaqe = 3, onThirrje = null }) {
  const vendet = [];
  let pageToken = null;

  for (let faqja = 0; faqja < maksFaqe; faqja++) {
    const trupi = {
      textQuery: pyetja,
      languageCode: 'sq',
      regionCode: 'XK',
      pageSize: 20,
    };
    if (kutia) trupi.locationRestriction = { rectangle: kutia };
    if (pageToken) trupi.pageToken = pageToken;

    if (onThirrje) onThirrje();
    const pergjigja = await fetch(URL_TEXT_SEARCH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': MASKA_TEXT_DIREKT,
      },
      body: JSON.stringify(trupi),
    });

    if (pergjigja.status === 400) throw new Error('KEY_I_GABUAR');
    if (pergjigja.status === 401 || pergjigja.status === 403) throw new Error('API_I_PAKTIVIZUAR');
    if (pergjigja.status === 429) throw new Error('KUOTA_U_MBUSH');
    if (!pergjigja.ok) throw new Error('GABIM_RRJETI');

    const data = await pergjigja.json();
    vendet.push(...(Array.isArray(data?.places) ? data.places : []));
    pageToken = data?.nextPageToken || null;
    if (!pageToken) break;
  }

  return vendet;
}

// Një lexim i vetëm i 'bizneset' (publik sipas rules) → dedup pa kosto për çdo vend.
async function ngarkoIndeksinDirekt() {
  const indeksi = { placeIds: new Set(), emraQytete: new Set() };
  const snap = await getDocs(collection(db, KOLEKSIONI_BIZNESET));
  snap.forEach((d) => {
    const data = d.data() || {};
    const placeId = String(data.googlePlaceId || '').trim();
    if (placeId) indeksi.placeIds.add(placeId);
    if (d.id.startsWith('google_')) {
      try { indeksi.placeIds.add(decodeURIComponent(d.id.slice('google_'.length))); } catch { /* ID e keqformuar */ }
    }
    const celesi = celesiEmriQytetiDirekt(data.emri, data.qyteti);
    if (celesi) indeksi.emraQytete.add(celesi);
  });
  return indeksi;
}

// Shkrimi te Firestore me ID deterministe google_{placeId}.
// firestore.rules §3: 'create' nga klienti lejohet VETËM me status 'pendshe'
// dhe uidPronari == uid-i im → 'aprovar' vendoset me një update të dytë
// (kalon vetëm nëse llogaria është admin/moderator).
async function ruajBiznesinDirekt({ dok, meta, perditeso }) {
  const ref = doc(db, KOLEKSIONI_BIZNESET, meta.docId);
  const ekzistuesi = await getDoc(ref);

  if (ekzistuesi.exists()) {
    if (!perditeso) return { veprimi: 'dublikat' };
    const teFreskuara = { ...dok };
    // Fushat që i prek njeriu/biznesi nuk mbishkruhen kurrë nga importi.
    delete teFreskuara.status;
    delete teFreskuara.uidPronari;
    delete teFreskuara.krijuarM;
    delete teFreskuara.oferta;
    await updateDoc(ref, { ...teFreskuara, perditesuarM: new Date().toISOString() });
    return { veprimi: 'perditesuar' };
  }

  const statusiIDeshiruar = dok.status;
  await setDoc(ref, { ...dok, status: 'pendshe' });
  if (statusiIDeshiruar === 'aprovar') {
    try {
      await updateDoc(ref, { status: 'aprovar' });
    } catch {
      // S'ka të drejta admin → biznesi mbetet 'pendshe' dhe pritet moderimi.
      return { veprimi: 'shtuar', statusi: 'pendshe' };
    }
  }
  return { veprimi: 'shtuar', statusi: statusiIDeshiruar };
}

function numeratorBoshDirekt() {
  return {
    vendeTeGjetura: 0, vendeUnike: 0, teShtuara: 0, tePerditesuara: 0,
    teAprovuara: 0, tePendshe: 0, dublikateGoogle: 0, dublikateEmri: 0,
    teAnashkaluara: 0, gabime: 0, kerkesaApi: 0, fotoTeMarra: 0,
  };
}

// ===== ORKESTRATORI DIREKT (browser → Google → Firestore) =====
// Kthen të njëjtën formë rezultati si callable-i, që UI-ja të mbetet e njëjtë.
async function importoDirektNgaBrowseri({
  apiKey,
  qytetet,
  kategorite,
  statusi = 'auto',
  merrFotot = true,
  perditeso = false,
  prove = false,
  maksBiznese = 1000,
  maksKerkesaApi = 400,
  maksFaqe = 3,
  autori = '',
  uidPronari = '',
  duhetNdaluar = () => false,
  onProgres = null,
}) {
  if (!apiKey) throw new Error('MUNGON_KEY');
  if (!qytetet.length || !kategorite.length) throw new Error('PA_ZGJEDHJE');

  const numeratori = numeratorBoshDirekt();
  const arsyet = {};
  const gabimet = [];
  const mostra = [];
  const indeksi = await ngarkoIndeksinDirekt();
  const pare = new Set();

  let ndalesa = '';
  const shtoArsye = (a) => { arsyet[a] = (arsyet[a] || 0) + 1; };
  const raporto = () => { if (onProgres) onProgres({ ...numeratori }); };

  // Plani rrafshohet në një listë të vetme task-esh (qytet × kategori × pyetje),
  // që ndalimi (anulim/kufij) të mos ketë nevojë për etiketa mbi cikle të ndërthurura.
  const taskat = [];
  for (const qyteti of qytetet) {
    const kutia = kutiaEQytetitDirekt(qyteti);
    for (const kategoria of kategorite) {
      const def = KATEGORITE_GOOGLE[kategoria];
      const pyetjet = def ? def.pyetjet : [String(kategoria)];
      for (const pyetja of pyetjet) taskat.push({ qyteti, kategoria, pyetja, kutia });
    }
  }

  // Arsyeja e ndalimit, ose '' nëse mund të vazhdohet.
  const kontrolloNdalimin = () => {
    if (duhetNdaluar()) return 'anuluar';
    if (numeratori.kerkesaApi >= maksKerkesaApi) return 'kufiri i thirrjeve';
    if (numeratori.vendeUnike >= maksBiznese) return 'kufiri i bizneseve';
    return '';
  };

  for (const task of taskat) {
    ndalesa = kontrolloNdalimin();
    if (ndalesa) break;

    let vendet = [];
    try {
      vendet = await kerkoTekstDirekt({
        apiKey,
        pyetja: `${task.pyetja} ${task.qyteti}`,
        kutia: task.kutia,
        maksFaqe,
        onThirrje: () => { numeratori.kerkesaApi++; },
      });
    } catch (err) {
      numeratori.gabime++;
      gabimet.push(`${task.qyteti}/${task.pyetja}: ${err.message}`);
      // Gabimet e çelësit/kuotës s'kanë kuptim të riprovohen për çdo task.
      if (['MUNGON_KEY', 'KEY_I_GABUAR', 'API_I_PAKTIVIZUAR', 'KUOTA_U_MBUSH'].includes(err.message)) {
        ndalesa = err.message;
        break;
      }
      continue;
    }

    numeratori.vendeTeGjetura += vendet.length;
    raporto();

    for (const place of vendet) {
      ndalesa = kontrolloNdalimin();
      if (ndalesa === 'anuluar' || ndalesa === 'kufiri i bizneseve') break;
      ndalesa = '';

      const rezultati = mapoPlaceDirekt(place, {
        kategoriaEKerkuar: task.kategoria,
        qytetiIKerkuar: task.qyteti,
        statusi,
        autori,
        uidPronari,
      });

      if (!rezultati.ok) {
        numeratori.teAnashkaluara++;
        shtoArsye(rezultati.arsyeja);
        continue;
      }

      const { dok, meta } = rezultati;
      if (pare.has(meta.placeId)) continue;
      pare.add(meta.placeId);

      if (indeksi.placeIds.has(meta.placeId) && !perditeso) { numeratori.dublikateGoogle++; continue; }
      if (indeksi.emraQytete.has(meta.celesiEmriQyteti) && !indeksi.placeIds.has(meta.placeId)) {
        numeratori.dublikateEmri++;
        continue;
      }

      if (prove) {
        numeratori.vendeUnike++;
        if (dok.status === 'aprovar') numeratori.teAprovuara++; else numeratori.tePendshe++;
        if (mostra.length < 40) mostra.push({ emri: dok.emri, qyteti: dok.qyteti, kategoria: dok.kategoria, status: dok.status, skori: meta.skori });
        indeksi.placeIds.add(meta.placeId);
        indeksi.emraQytete.add(meta.celesiEmriQyteti);
        raporto();
        continue;
      }

      // Fotoja: +1 thirrje API. Dështimi s'e bllokon kurrë importin
      // (<Foto> bie te gjetja automatike).
      if (merrFotot && meta.fotoRef && numeratori.kerkesaApi < maksKerkesaApi) {
        try {
          numeratori.kerkesaApi++;
          const url = await merrUrlFotos(meta.fotoRef);
          if (url && eSigurtPerRuajtje(url)) { dok.foto = url; numeratori.fotoTeMarra++; }
        } catch { /* pa foto — biznesi ruhet gjithsesi */ }
      }

      try {
        const { veprimi, statusi: statusiRuajtur } = await ruajBiznesinDirekt({ dok, meta, perditeso });
        if (veprimi === 'dublikat') { numeratori.dublikateGoogle++; continue; }
        numeratori.vendeUnike++;
        if (veprimi === 'perditesuar') {
          numeratori.tePerditesuara++;
        } else {
          numeratori.teShtuara++;
          if (statusiRuajtur === 'aprovar') numeratori.teAprovuara++; else numeratori.tePendshe++;
        }
        indeksi.placeIds.add(meta.placeId);
        indeksi.emraQytete.add(meta.celesiEmriQyteti);
        if (mostra.length < 40) mostra.push({ emri: dok.emri, qyteti: dok.qyteti, kategoria: dok.kategoria, status: statusiRuajtur || dok.status, skori: meta.skori });
      } catch (err) {
        numeratori.gabime++;
        gabimet.push(`${dok.emri}: ${err?.message || 'shkrimi dështoi'}`);
      }
      raporto();
    }

    if (ndalesa) break;
  }

  raporto();
  return {
    perfunduar: !ndalesa,
    ndalesa,
    prove,
    numeratori,
    arsyet,
    gabimet: gabimet.slice(0, 20),
    mostra,
  };
}

const MESAZHET_GABIMIT = {
  'functions/unauthenticated': 'Duhet të jeni i loguar si admin.',
  'functions/permission-denied': 'Vetëm admini mund të bëjë importim masiv.',
  'functions/failed-precondition': 'Mungon konfigurimi — vendos GOOGLE_PLACES_API_KEY te Firebase Secrets.',
  'functions/resource-exhausted': 'Kuota e Google Places u mbush. Provoni më vonë.',
  'functions/not-found': 'Funksioni s\u2019është deploy-uar ende (firebase deploy --only functions).',
  'functions/internal': 'Gabim i brendshëm te serveri — shih logjet e Functions.',
};

// Gabimet e rrugës direkte (browser → Google → Firestore).
const MESAZHET_DIREKT = {
  'MUNGON_KEY': 'Mungon çelësi i Google Places — ruaje te fusha më sipër.',
  'KEY_I_GABUAR': 'Google e refuzoi çelësin ose kërkesën (400). Kontrollo çelësin dhe restriksionet e referrer-it.',
  'API_I_PAKTIVIZUAR': 'Places API (New) s\u2019është aktivizuar ose çelësi s\u2019ka leje për këtë domen.',
  'KUOTA_U_MBUSH': 'Kuota e Google Places u mbush. Provoni më vonë.',
  'GABIM_RRJETI': 'Lidhja me Google dështoi. Kontrollo rrjetin dhe provo sërish.',
  'PA_ZGJEDHJE': 'Zgjidh të paktën një qytet dhe një kategori.',
};

function ImportMasiv() {
  const { darkMode } = useContext(AppContext);

  const [katalogu, setKatalogu] = useState({ qytetet: QYTETET_FALLBACK, kategorite: KATEGORITE_FALLBACK });
  const [qytetet, setQytetet] = useState(['Prishtinë']);
  const [kategorite, setKategorite] = useState(['Restorante']);
  const [strategjia, setStrategjia] = useState('shpejt');
  const [statusi, setStatusi] = useState('auto');
  const [merrFotot, setMerrFotot] = useState(true);
  const [perditeso, setPerditeso] = useState(false);
  const [maksBiznese, setMaksBiznese] = useState(1000);
  const [maksKerkesa, setMaksKerkesa] = useState(400);

  const [vleresimi, setVleresimi] = useState(null);
  const [duke, setDuke] = useState('');          // '' | 'vleresim' | 'prove' | 'import' | 'direkt'
  const [jobId, setJobId] = useState('');
  const [puna, setPuna] = useState(null);        // gjendja live nga Firestore
  const [rezultati, setRezultati] = useState(null);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });

  // Anulimi kërkohet nga përdoruesi ndërsa një copë është në fluturim; e lexojmë
  // përmes ref-it, sepse cikli i vazhdimit nuk e sheh state-in e ri.
  const anulimiKerkuar = useRef(false);

  // ⚠️ E PËRKOHSHME — gjendja e importit direkt nga browseri (pa Cloud Functions).
  const [googleKey, setGoogleKey] = useState(() => merrGooglePlacesApiKey());
  const [keyRuajtur, setKeyRuajtur] = useState(() => Boolean(merrGooglePlacesApiKey()));
  const [progresiDirekt, setProgresiDirekt] = useState(null);

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const punon = duke !== '';

  // Katalogu nga serveri (burimi i vërtetë). Dështimi s'është fatal — mbeten fallback-et.
  useEffect(() => {
    let gjallë = true;
    httpsCallable(fcn, 'katalogImportimi')({})
      .then((res) => {
        if (!gjallë || !res?.data) return;
        const d = res.data;
        if (Array.isArray(d.qytetet) && d.qytetet.length) {
          setKatalogu({ qytetet: d.qytetet, kategorite: d.kategorite || KATEGORITE_FALLBACK });
        }
      })
      .catch(() => { /* fallback-et lokale mjaftojnë */ });
    return () => { gjallë = false; };
  }, []);

  // Progres live nga dokumenti i punës.
  useEffect(() => {
    if (!jobId) return undefined;
    const unsub = onSnapshot(
      doc(db, 'importJobs', jobId),
      (snap) => { if (snap.exists()) setPuna({ id: snap.id, ...snap.data() }); },
      () => { /* rules ende jo të publikuara — numëruesit vijnë nga përgjigjja e callable-it */ }
    );
    return () => unsub();
  }, [jobId]);

  const kthejGabimin = (err) => {
    const kodi = err?.code || '';
    return MESAZHET_GABIMIT[kodi] || err?.message || 'Gabim i papritur.';
  };

  const ndertoKerkesen = (shtese = {}) => ({
    qytetet,
    kategorite,
    strategjia,
    statusi,
    merrFotot,
    perditeso,
    maksBiznese: Number(maksBiznese) || 1000,
    maksKerkesaApi: Number(maksKerkesa) || 400,
    ...shtese,
  });

  const perzgjidh = (lista, vlera, setter) => {
    setter(lista.includes(vlera) ? lista.filter((x) => x !== vlera) : [...lista, vlera]);
    setVleresimi(null);
  };

  const vlereso = async () => {
    if (!qytetet.length || !kategorite.length) {
      setMesazhi({ tekst: 'Zgjidh të paktën një qytet dhe një kategori.', gabim: true });
      return;
    }
    setDuke('vleresim');
    setMesazhi({ tekst: '', gabim: false });
    try {
      const res = await httpsCallable(fcn, 'vleresoImportin')(ndertoKerkesen());
      setVleresimi(res.data.vleresimi);
    } catch (err) {
      setMesazhi({ tekst: '❌ ' + kthejGabimin(err), gabim: true });
    } finally {
      setDuke('');
    }
  };

  // Cikli i copave: thirr → nëse perfunduar=false, thirr sërish me jobId.
  const nis = async (prove) => {
    if (!qytetet.length || !kategorite.length) {
      setMesazhi({ tekst: 'Zgjidh të paktën një qytet dhe një kategori.', gabim: true });
      return;
    }
    anulimiKerkuar.current = false;
    setDuke(prove ? 'prove' : 'import');
    setMesazhi({ tekst: '', gabim: false });
    setRezultati(null);
    setPuna(null);
    setJobId('');

    try {
      let res = await httpsCallable(fcn, 'importoMasiv')(ndertoKerkesen({ prove }));
      let data = res.data;
      setJobId(data.jobId);

      // Tavan i fortë: mbron nga një lak i pafund nëse serveri s'përparon dot.
      let copa = 0;
      while (!data.perfunduar && copa < 60 && !anulimiKerkuar.current) {
        copa++;
        res = await httpsCallable(fcn, 'importoMasiv')({ jobId: data.jobId, vazhdo: true });
        data = res.data;
      }

      setRezultati(data);
      if (anulimiKerkuar.current) {
        setMesazhi({ tekst: '⏹️ Importi u ndal nga ju. Rinise kur të duash — dublikatat kapërcehen automatikisht.', gabim: false });
      } else if (!data.perfunduar) {
        setMesazhi({ tekst: `⏸️ Importi u ndal (${data.ndalesa || 'kufi'}). Shtyp "Nis importin" për të vazhduar.`, gabim: false });
      } else if (prove) {
        setMesazhi({ tekst: `🧪 Prova përfundoi — ${data.numeratori.vendeUnike} vende u gjetën. Asgjë NUK u shkrua.`, gabim: false });
      } else {
        setMesazhi({ tekst: `✅ Importi përfundoi — ${data.numeratori.teShtuara} biznese u shtuan.`, gabim: false });
      }
    } catch (err) {
      setMesazhi({ tekst: '❌ ' + kthejGabimin(err), gabim: true });
    } finally {
      setDuke('');
    }
  };

  const anulo = async () => {
    anulimiKerkuar.current = true;
    setMesazhi({ tekst: '⏹️ Duke ndaluar pas copës aktuale…', gabim: false });
    if (jobId) {
      try { await httpsCallable(fcn, 'anuloImportin')({ jobId }); } catch { /* ndalimi lokal mjafton */ }
    }
  };

  // ---------- ⚠️ E PËRKOHSHME: importi direkt nga browseri ----------
  const ruajKeyn = () => {
    const key = googleKey.trim();
    if (!key) {
      fshiGooglePlacesApiKey();
      setKeyRuajtur(false);
      setMesazhi({ tekst: 'Shkruani çelësin e Google Places para se ta ruani.', gabim: true });
      return;
    }
    ruajGooglePlacesApiKey(key);
    setGoogleKey(key);
    setKeyRuajtur(true);
    setMesazhi({ tekst: '🔑 Çelësi u ruajt te localStorage i këtij browseri.', gabim: false });
  };

  const fshiKeyn = () => {
    fshiGooglePlacesApiKey();
    setGoogleKey('');
    setKeyRuajtur(false);
    setMesazhi({ tekst: '🔑 Çelësi u fshi nga ky browser.', gabim: false });
  };

  const nisDirekt = async () => {
    if (!qytetet.length || !kategorite.length) {
      setMesazhi({ tekst: 'Zgjidh të paktën një qytet dhe një kategori.', gabim: true });
      return;
    }
    const apiKey = merrGooglePlacesApiKey();
    if (!apiKey) {
      setMesazhi({ tekst: '❌ Mungon GOOGLE_PLACES_API_KEY te localStorage — ruaje më sipër.', gabim: true });
      return;
    }
    const perdoruesi = auth.currentUser;
    if (!perdoruesi) {
      setMesazhi({ tekst: '❌ Duhet të jeni i loguar si admin për të shkruar te Firestore.', gabim: true });
      return;
    }

    anulimiKerkuar.current = false;
    setDuke('direkt');
    setMesazhi({ tekst: '', gabim: false });
    setRezultati(null);
    setPuna(null);
    setJobId('');
    setProgresiDirekt(null);

    try {
      const rez = await importoDirektNgaBrowseri({
        apiKey,
        qytetet,
        kategorite,
        statusi,
        merrFotot,
        perditeso,
        prove: false,
        maksBiznese: Number(maksBiznese) || 1000,
        maksKerkesaApi: Number(maksKerkesa) || 400,
        autori: `Importi direkt nga browseri (${perdoruesi.email || perdoruesi.uid})`,
        uidPronari: perdoruesi.uid,
        duhetNdaluar: () => anulimiKerkuar.current,
        onProgres: (n2) => setProgresiDirekt(n2),
      });

      setRezultati(rez);
      setProgresiDirekt(rez.numeratori);
      const n2 = rez.numeratori;
      if (rez.ndalesa === 'anuluar') {
        setMesazhi({ tekst: `⏹️ Importi direkt u ndal nga ju — ${n2.teShtuara} biznese u shkruan. Rinise kur të duash, dublikatat kapërcehen.`, gabim: false });
      } else if (rez.ndalesa) {
        setMesazhi({ tekst: `⏸️ Importi direkt u ndal (${rez.ndalesa}) — ${n2.teShtuara} biznese u shkruan. Shtyp sërish për të vazhduar.`, gabim: false });
      } else {
        setMesazhi({ tekst: `✅ Importi direkt përfundoi — ${n2.teShtuara} biznese u shkruan direkt nga browseri (${n2.tePendshe} presin moderim).`, gabim: false });
      }
    } catch (err) {
      const kodi = String(err?.message || '');
      setMesazhi({ tekst: '❌ ' + (MESAZHET_DIREKT[kodi] || kodi || 'Gabim i papritur gjatë importit direkt.'), gabim: true });
    } finally {
      setDuke('');
    }
  };

  // ---------- pjesët e UI-së ----------
  const kartela = { backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '18px' };

  const shenja = (teksti, aktive, onClick, celesi) => (
    <button key={celesi || teksti} type="button" onClick={onClick} disabled={punon}
      style={{
        padding: '7px 13px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700',
        cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1,
        border: `1px solid ${aktive ? '#3b82f6' : korniza}`,
        backgroundColor: aktive ? '#3b82f6' : 'transparent',
        color: aktive ? '#fff' : stiliTekstit,
      }}>
      {teksti}
    </button>
  );

  const numri = (etiketa, vlera, setter, min, maks) => (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>{etiketa}</label>
      <input type="number" min={min} max={maks} value={vlera} disabled={punon}
        onChange={(e) => { setter(e.target.value); setVleresimi(null); }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  // Progresi i rrugës direkte vjen nga state-i lokal (s'ka dokument pune te Firestore).
  const n = progresiDirekt || puna?.numeratori || rezultati?.numeratori || null;
  const perqindja = puna?.taskatGjithsej && puna?.kursori
    ? Math.min(100, Math.round((Number(puna.kursori.task || 0) / puna.taskatGjithsej) * 100))
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Import Masiv 🚀</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          Tërheq qindra biznese nga Google Places njëherësh — me mapim kategorish/qytetesh,
          deduplikim atomik dhe status automatik.
        </p>
      </div>

      {mesazhi.tekst && (
        <div style={{ padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700',
          backgroundColor: mesazhi.gabim ? '#ff3b3015' : '#16a34a15',
          color: mesazhi.gabim ? '#ef4444' : '#16a34a',
          border: `1px solid ${mesazhi.gabim ? '#ff3b3040' : '#16a34a40'}` }}>
          {mesazhi.tekst}
        </div>
      )}

      {/* QYTETET */}
      <div style={kartela}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>
            🏙️ Qytetet <span style={{ color: '#8e8e93', fontWeight: '600' }}>({qytetet.length})</span>
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {shenja('7 kryesoret', false, () => { setQytetet(QYTETET_KRYESORE); setVleresimi(null); }, 'k7')}
            {shenja('Të gjitha', false, () => { setQytetet(katalogu.qytetet); setVleresimi(null); }, 'kg')}
            {shenja('Pastro', false, () => { setQytetet([]); setVleresimi(null); }, 'kp')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {katalogu.qytetet.map((q) => shenja(q, qytetet.includes(q), () => perzgjidh(qytetet, q, setQytetet)))}
        </div>
      </div>

      {/* KATEGORITË */}
      <div style={kartela}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>
            🗂️ Kategoritë <span style={{ color: '#8e8e93', fontWeight: '600' }}>({kategorite.length})</span>
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {shenja('Të gjitha', false, () => { setKategorite(katalogu.kategorite); setVleresimi(null); }, 'ag')}
            {shenja('Pastro', false, () => { setKategorite([]); setVleresimi(null); }, 'ap')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {katalogu.kategorite.map((k) => shenja(k, kategorite.includes(k), () => perzgjidh(kategorite, k, setKategorite)))}
        </div>
      </div>

      {/* STRATEGJIA + STATUSI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={kartela}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>🔍 Strategjia</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STRATEGJITE.map((s) => (
              <button key={s.id} type="button" disabled={punon} onClick={() => { setStrategjia(s.id); setVleresimi(null); }}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '12px', cursor: punon ? 'not-allowed' : 'pointer',
                  border: `1px solid ${strategjia === s.id ? '#3b82f6' : korniza}`,
                  backgroundColor: strategjia === s.id ? '#3b82f612' : 'transparent', opacity: punon ? 0.6 : 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: strategjia === s.id ? '#3b82f6' : stiliTekstit }}>{s.emri}</div>
                <div style={{ fontSize: '11.5px', color: '#8e8e93', marginTop: '2px', lineHeight: 1.4 }}>{s.pershkrimi}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={kartela}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>🏷️ Statusi i ruajtjes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STATUSET.map((s) => (
              <button key={s.id} type="button" disabled={punon} onClick={() => setStatusi(s.id)}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '12px', cursor: punon ? 'not-allowed' : 'pointer',
                  border: `1px solid ${statusi === s.id ? '#3b82f6' : korniza}`,
                  backgroundColor: statusi === s.id ? '#3b82f612' : 'transparent', opacity: punon ? 0.6 : 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: statusi === s.id ? '#3b82f6' : stiliTekstit }}>{s.emri}</div>
                <div style={{ fontSize: '11.5px', color: '#8e8e93', marginTop: '2px', lineHeight: 1.4 }}>{s.pershkrimi}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OPSIONET */}
      <div style={kartela}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>⚙️ Opsionet</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {numri('Maks. biznese', maksBiznese, setMaksBiznese, 1, 20000)}
          {numri('Maks. thirrje Google', maksKerkesa, setMaksKerkesa, 1, 20000)}
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', color: stiliTekstit, cursor: 'pointer' }}>
            <input type="checkbox" checked={merrFotot} disabled={punon} onChange={(e) => setMerrFotot(e.target.checked)} />
            📷 Merr fotot <span style={{ color: '#8e8e93', fontWeight: '600' }}>(+1 thirrje/biznes)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', color: stiliTekstit, cursor: 'pointer' }}>
            <input type="checkbox" checked={perditeso} disabled={punon} onChange={(e) => setPerditeso(e.target.checked)} />
            🔄 Përditëso ekzistueset <span style={{ color: '#8e8e93', fontWeight: '600' }}>(s\u2019prek statusin)</span>
          </label>
        </div>
      </div>

      {/* VLERËSIMI */}
      {vleresimi && (
        <div style={{ ...kartela, borderColor: vleresimi.brendaKufirit ? '#16a34a40' : '#f59e0b40', backgroundColor: vleresimi.brendaKufirit ? '#16a34a08' : '#f59e0b08' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '800', color: stiliTekstit }}>💸 Vlerësimi i kostos</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: stiliTekstit }}>
            <span><b>{vleresimi.taskat}</b> taskа</span>
            <span><b>~{vleresimi.kerkesaKerkimi}</b> thirrje kërkimi</span>
            <span style={{ color: '#8e8e93' }}>text: {vleresimi.kerkesaText} · nearby: {vleresimi.kerkesaNearby}</span>
          </div>
          {!vleresimi.brendaKufirit && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>
              ⚠️ Plani e kalon tavanin prej {maksKerkesa} thirrjesh — importi do të ndalet aty dhe mund të vazhdohet më pas.
            </p>
          )}
        </div>
      )}

      {/* ⚠️ E PËRKOHSHME — IMPORTI DIREKT NGA BROWSERI (pa Cloud Functions) */}
      <div style={{ ...kartela, borderColor: '#f59e0b55', backgroundColor: '#f59e0b0a' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>
          ⚠️ Rrugë e përkohshme — Import direkt nga browseri
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#8e8e93', lineHeight: 1.6 }}>
          Anashkalon plotësisht Cloud Functions: browser-i thërret vetë Google Places (New),
          aplikon të njëjtin mapim qyteti/kategorie dhe i shkruan bizneset te Firestore me
          ID deterministe <code>google_&#123;placeId&#125;</code>. Çelësi lexohet nga
          <b> localStorage → GOOGLE_PLACES_API_KEY</b> dhe s’del kurrë nga ky browser —
          përdor çelës me restriksion referrer-i dhe hiqe këtë panel sapo Functions të jetë live.
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <input
            type="password"
            value={googleKey}
            disabled={punon}
            placeholder="GOOGLE_PLACES_API_KEY"
            onChange={(e) => setGoogleKey(e.target.value)}
            style={{ flex: '1 1 260px', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
          <button type="button" onClick={ruajKeyn} disabled={punon}
            style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
            🔑 Ruaj çelësin
          </button>
          {keyRuajtur && (
            <button type="button" onClick={fshiKeyn} disabled={punon}
              style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '13px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
              🗑️ Fshi
            </button>
          )}
          <span style={{ fontSize: '12px', fontWeight: '700', color: keyRuajtur ? '#16a34a' : '#8e8e93' }}>
            {keyRuajtur ? '✅ Çelësi është i ruajtur' : '⚪ Pa çelës të ruajtur'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" onClick={nisDirekt} disabled={punon}
            style={{ padding: '12px 22px', borderRadius: '12px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
            {duke === 'direkt' ? '⏳ Duke importuar nga browseri…' : '🚀 Ekzekuto Importin direkt nga Browseri'}
          </button>
          {duke === 'direkt' && (
            <button type="button" onClick={() => { anulimiKerkuar.current = true; setMesazhi({ tekst: '⏹️ Duke ndaluar pas kërkimit aktual…', gabim: false }); }}
              style={{ padding: '12px 18px', borderRadius: '12px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>
              ⏹️ Ndal
            </button>
          )}
        </div>
      </div>

      {/* BUTONAT */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" onClick={vlereso} disabled={punon}
          style={{ padding: '12px 18px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontWeight: '700', fontSize: '13.5px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
          {duke === 'vleresim' ? '⏳ Duke llogaritur…' : '💸 Llogarit koston'}
        </button>
        <button type="button" onClick={() => nis(true)} disabled={punon}
          style={{ padding: '12px 18px', borderRadius: '12px', border: 'none', backgroundColor: '#8e8e93', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
          {duke === 'prove' ? '⏳ Duke provuar…' : '🧪 Provë (s\u2019shkruan asgjë)'}
        </button>
        <button type="button" onClick={() => nis(false)} disabled={punon}
          style={{ padding: '12px 22px', borderRadius: '12px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
          {duke === 'import' ? '⏳ Duke importuar…' : '🚀 Nis importin'}
        </button>
        {punon && duke === 'import' && (
          <button type="button" onClick={anulo}
            style={{ padding: '12px 18px', borderRadius: '12px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>
            ⏹️ Ndal
          </button>
        )}
      </div>

      {/* PROGRESI + REZULTATI */}
      {n && (
        <div style={kartela}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>
              {punon ? '⏳ Duke punuar…' : rezultati?.prove ? '🧪 Rezultati i provës' : '📊 Rezultati'}
            </h3>
            {jobId && <span style={{ fontSize: '11px', color: '#8e8e93', fontFamily: 'monospace' }}>job: {jobId.slice(0, 10)}…</span>}
          </div>

          {perqindja !== null && punon && (
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: korniza, marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${perqindja}%`, backgroundColor: '#3b82f6', transition: 'width .4s' }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
            {[
              ['✅ Të shtuara', n.teShtuara, '#16a34a'],
              ['🟢 Aprovar', n.teAprovuara, '#16a34a'],
              ['⏳ Pendshe', n.tePendshe, '#f59e0b'],
              ['🔄 Përditësuar', n.tePerditesuara, '#3b82f6'],
              ['⏭️ Dublikatë', (n.dublikateGoogle || 0) + (n.dublikateEmri || 0), '#8e8e93'],
              ['🔍 Gjetur', n.vendeTeGjetura, '#8e8e93'],
              ['📷 Foto', n.fotoTeMarra, '#8e8e93'],
              ['💸 Thirrje API', n.kerkesaApi, '#7c3aed'],
              ['❌ Gabime', n.gabime, n.gabime > 0 ? '#ef4444' : '#8e8e93'],
            ].map(([etiketa, vlera, ngjyra]) => (
              <div key={etiketa} style={{ padding: '10px 12px', borderRadius: '12px', border: `1px solid ${korniza}` }}>
                <div style={{ fontSize: '21px', fontWeight: '800', color: ngjyra }}>{vlera ?? 0}</div>
                <div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '700', marginTop: '2px' }}>{etiketa}</div>
              </div>
            ))}
          </div>

          {rezultati?.mostra?.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: `1px solid ${korniza}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8e8e93', marginBottom: '8px' }}>MOSTRA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto' }}>
                {rezultati.mostra.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'center', fontSize: '12.5px', color: stiliTekstit }}>
                    <span>{m.status === 'aprovar' ? '✅' : '⏳'}</span>
                    <span style={{ fontWeight: '700' }}>{m.emri}</span>
                    <span style={{ color: '#8e8e93' }}>{m.kategoria} · {m.qyteti} · skor {m.skori}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rezultati?.arsyet && Object.keys(rezultati.arsyet).length > 0 && (
            <div style={{ marginTop: '14px', borderTop: `1px solid ${korniza}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8e8e93', marginBottom: '6px' }}>ARSYET E ANASHKALIMIT</div>
              {Object.entries(rezultati.arsyet).sort((a, b) => b[1] - a[1]).map(([a, v]) => (
                <div key={a} style={{ fontSize: '12px', color: '#8e8e93' }}>· {a}: <b>{v}</b></div>
              ))}
            </div>
          )}

          {rezultati?.gabimet?.length > 0 && (
            <div style={{ marginTop: '14px', borderTop: `1px solid ${korniza}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#ef4444', marginBottom: '6px' }}>GABIME</div>
              {rezultati.gabimet.map((g, i) => (
                <div key={i} style={{ fontSize: '11.5px', color: '#ef4444' }}>· {g}</div>
              ))}
            </div>
          )}

          {!punon && !rezultati?.prove && n.tePendshe > 0 && (
            <p style={{ margin: '14px 0 0 0', fontSize: '12.5px', color: '#f59e0b', fontWeight: '700' }}>
              👉 {n.tePendshe} biznese presin miratim te <b>Menaxho Bizneset</b> (filtri ⏳ Pendshe).
            </p>
          )}
        </div>
      )}

      <p style={{ margin: 0, fontSize: '11.5px', color: '#8e8e93', lineHeight: 1.6 }}>
        ℹ️ Çelësi i Google Places qëndron te Firebase Secrets — kurrë te browser-i.
        Deduplikimi është atomik (Google Place ID + emër&nbsp;+&nbsp;qytet), prandaj rinisja e
        importit s\u2019krijon kurrë dublikatë. Për importe shumë të mëdha përdor
        CLI-në: <code>node functions/scripts/importo-masiv.js --ndihme</code>
      </p>
    </div>
  );
}

export default ImportMasiv;
