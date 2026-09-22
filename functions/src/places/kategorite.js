// ===== KATALOGU I KATEGORIVE (kategoritë tona ⇄ tipat e Google) =====
// Emrat e kategorive JANË SAKTËSISHT ata të useKontenti.js (KATEGORITE_LOKALE),
// që importi masiv të mos krijojë kategori "fantazmë" që s'i njeh asnjë filtër i app-it.
//
// Për secilën kategori:
//  - googleTypes : tipat e Places API (New) — përdoren te searchNearby.includedTypes
//                  dhe për të njohur kategorinë nga primaryType.
//  - pyetjet     : variantet e Text Search (shqip + anglisht). Google kthen maks 60
//                  rezultate për query, prandaj disa pyetje = mbulim shumë më i gjerë.
//  - ikona       : e njëjta si te useKontenti.js.

const KATEGORITE = [
  {
    emri: 'Restorante',
    ikona: '🍽️',
    googleTypes: [
      'restaurant', 'pizza_restaurant', 'italian_restaurant', 'fast_food_restaurant',
      'hamburger_restaurant', 'barbecue_restaurant', 'seafood_restaurant',
      'steak_house', 'sushi_restaurant', 'turkish_restaurant', 'mediterranean_restaurant',
      'meal_takeaway', 'meal_delivery',
    ],
    pyetjet: ['restorant', 'restaurant', 'pizzeri', 'fast food', 'ushqim tradicional', 'qebaptore', 'byrektore'],
  },
  {
    emri: 'Kafene',
    ikona: '☕',
    googleTypes: ['cafe', 'coffee_shop', 'bakery', 'bar', 'pub', 'tea_house', 'ice_cream_shop', 'dessert_shop'],
    pyetjet: ['kafene', 'coffee shop', 'bar', 'pastiçeri', 'akullore', 'furrë buke'],
  },
  {
    emri: 'Hotele',
    ikona: '🏨',
    googleTypes: ['hotel', 'lodging', 'motel', 'guest_house', 'hostel', 'bed_and_breakfast', 'resort_hotel', 'apartment_complex'],
    pyetjet: ['hotel', 'motel', 'bujtinë', 'apartamente me qira', 'guest house', 'hostel'],
  },
  {
    emri: 'Pika Karburanti',
    ikona: '⛽',
    googleTypes: ['gas_station', 'electric_vehicle_charging_station', 'rest_stop'],
    pyetjet: ['pikë karburanti', 'gas station', 'benzinë', 'naftë'],
  },
  {
    emri: 'Health',
    ikona: '🏥',
    googleTypes: [
      'hospital', 'pharmacy', 'doctor', 'dentist', 'medical_lab', 'physiotherapist',
      'drugstore', 'veterinary_care', 'wellness_center', 'chiropractor', 'skin_care_clinic',
    ],
    pyetjet: ['spital', 'barnatore', 'farmaci', 'ordinancë', 'klinikë dentare', 'laborator mjekësor', 'poliklinikë'],
  },
  {
    emri: 'Automotive',
    ikona: '🚗',
    googleTypes: [
      'car_repair', 'car_dealer', 'car_wash', 'car_rental', 'auto_parts_store',
      'tire_shop', 'parking', 'truck_stop', 'motorcycle_dealer',
    ],
    pyetjet: ['servis veturash', 'autoservis', 'lavazh', 'rent a car', 'pjesë këmbimi', 'gomeri', 'autosallon'],
  },
  {
    emri: 'Shopping',
    ikona: '🛍️',
    googleTypes: [
      'shopping_mall', 'supermarket', 'grocery_store', 'clothing_store', 'shoe_store',
      'electronics_store', 'furniture_store', 'department_store', 'hardware_store',
      'book_store', 'jewelry_store', 'sporting_goods_store', 'convenience_store',
      'home_goods_store', 'gift_shop', 'market',
    ],
    pyetjet: ['market', 'supermarket', 'qendër tregtare', 'dyqan rrobash', 'elektroshtëpiake', 'mobileri', 'librari'],
  },
  {
    emri: 'Services',
    ikona: '🔧',
    googleTypes: [
      'beauty_salon', 'hair_salon', 'barber_shop', 'laundry', 'locksmith', 'plumber',
      'electrician', 'moving_company', 'storage', 'travel_agency', 'courier_service',
      'real_estate_agency', 'insurance_agency', 'tailor', 'spa', 'nail_salon',
    ],
    pyetjet: ['sallon bukurie', 'berber', 'agjenci udhëtimi', 'agjenci patundshmërish', 'pastrim kimik', 'hidraulik', 'elektricist'],
  },
  {
    emri: 'Business',
    ikona: '🏢',
    googleTypes: [
      'bank', 'atm', 'accounting', 'lawyer', 'corporate_office', 'consultant',
      'post_office', 'printing_service', 'telecommunications_service_provider',
    ],
    pyetjet: ['bankë', 'zyre avokatie', 'kontabilitet', 'noter', 'posta', 'shtypshkronjë'],
  },
  {
    emri: 'Turizëm',
    ikona: '🏔️',
    googleTypes: [
      'tourist_attraction', 'museum', 'park', 'national_park', 'art_gallery',
      'historical_landmark', 'hiking_area', 'campground', 'ski_resort', 'zoo',
      'cultural_landmark', 'monument', 'observation_deck',
    ],
    pyetjet: ['atraksion turistik', 'muze', 'park', 'monument', 'shteg malor', 'kamp'],
  },
  {
    emri: 'Hospitality',
    ikona: '🛏️',
    googleTypes: ['event_venue', 'banquet_hall', 'wedding_venue', 'convention_center', 'night_club', 'casino'],
    pyetjet: ['sallë dasmash', 'event venue', 'klub nate', 'sallë konferencash'],
  },
  {
    emri: 'Food',
    ikona: '🍔',
    googleTypes: ['food_store', 'butcher_shop', 'candy_store', 'deli', 'wholesaler', 'liquor_store', 'wine_store'],
    pyetjet: ['mishtore', 'njësi ushqimore', 'depo ushqimore', 'bulmet'],
  },
  {
    emri: 'Emergjenca',
    ikona: '🚑',
    googleTypes: ['police', 'fire_station', 'emergency_room', 'ambulance_service'],
    pyetjet: ['stacion policie', 'zjarrfikës', 'urgjenca', 'emergjenca'],
  },
];

const { normalizo } = require('./qytetet');

const SIPAS_EMRIT = new Map(KATEGORITE.map((k) => [normalizo(k.emri), k]));

// Tip i Google → kategoria jonë. Tipi i parë që e deklaron fiton (rendi i KATEGORITE
// është rendi i prioritetit: 'bakery' shkon te Kafene, jo te Food).
const SIPAS_TIPIT = new Map();
for (const k of KATEGORITE) {
  for (const t of k.googleTypes) {
    if (!SIPAS_TIPIT.has(t)) SIPAS_TIPIT.set(t, k.emri);
  }
}

function gjejKategorine(emri) {
  return SIPAS_EMRIT.get(normalizo(emri)) || null;
}

function emratEKategorive() {
  return KATEGORITE.map((k) => k.emri);
}

// Kategoria jonë nga një vend i Google.
//   besueshmeria 'e_larte' → nga primaryType (Google e quan tipin KRYESOR)
//   besueshmeria 'e_ulet'  → nga një tip dytësor
//   besueshmeria 'asnje'   → s'u njoh; thirrësi përdor kategorinë e kërkuar
function kategoriaNgaTipi(primaryType, types = []) {
  const kryesor = String(primaryType || '').trim();
  if (kryesor && SIPAS_TIPIT.has(kryesor)) {
    return { emri: SIPAS_TIPIT.get(kryesor), besueshmeria: 'e_larte' };
  }
  for (const t of Array.isArray(types) ? types : []) {
    const tipi = String(t || '').trim();
    if (SIPAS_TIPIT.has(tipi)) {
      return { emri: SIPAS_TIPIT.get(tipi), besueshmeria: 'e_ulet' };
    }
  }
  return { emri: '', besueshmeria: 'asnje' };
}

// searchNearby pranon maksimum 50 tipa për kërkesë.
const MAKS_TIPA_NEARBY = 50;

function tipatPerNearby(emriKategorise) {
  const k = gjejKategorine(emriKategorise);
  if (!k) return [];
  return k.googleTypes.slice(0, MAKS_TIPA_NEARBY);
}

// Pyetjet e Text Search për (kategori × qytet). Shtohet edhe vetë emri i
// kategorisë, sepse shpesh është termi që përdorin vetë bizneset.
function pyetjetPerKategori(emriKategorise, emriQytetit) {
  const k = gjejKategorine(emriKategorise);
  if (!k) return [];
  const qyteti = String(emriQytetit || '').trim();
  const bazat = [...new Set([...k.pyetjet, k.emri.toLowerCase()])];
  return bazat.map((p) => (qyteti ? `${p} ${qyteti} Kosovë` : `${p} Kosovë`));
}

module.exports = {
  KATEGORITE,
  MAKS_TIPA_NEARBY,
  gjejKategorine,
  emratEKategorive,
  kategoriaNgaTipi,
  tipatPerNearby,
  pyetjetPerKategori,
};
