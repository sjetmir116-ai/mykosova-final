// ===== KLIENTI I GOOGLE PLACES API (New) =====
// I vetmi skedar që prek rrjetin e Google. Përgjegjësitë:
//   field mask · paginim · retry me backoff · numërim i thirrjeve (kostoja)
//
// SIGURIA: API key-i dërgohet VETËM si header 'X-Goog-Api-Key', kurrë te URL-ja
// (URL-të përfundojnë te logjet; çelësat jo).

const BAZA = 'https://places.googleapis.com/v1';

// Field mask i pasur: telefoni/website/orari merren BRENDA kërkimit, pra s'na
// duhet një thirrje Place Details veç e veç për çdo biznes — gjysma e kostos.
const FUSHAT_E_VENDIT = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location',
  'rating',
  'userRatingCount',
  'primaryType',
  'types',
  'businessStatus',
  'internationalPhoneNumber',
  'nationalPhoneNumber',
  'websiteUri',
  'regularOpeningHours',
  'editorialSummary',
  'photos',
];

const MASKA_TEXT = ['nextPageToken', ...FUSHAT_E_VENDIT.map((f) => `places.${f}`)].join(',');
const MASKA_NEARBY = FUSHAT_E_VENDIT.map((f) => `places.${f}`).join(',');

class GabimPlaces extends Error {
  constructor(kodi, mesazhi, statusi = 0) {
    super(mesazhi || kodi);
    this.name = 'GabimPlaces';
    this.kodi = kodi;
    this.statusi = statusi;
  }
}

function kodiNgaStatusi(statusi) {
  if (statusi === 400) return 'KEY_I_GABUAR';
  if (statusi === 401 || statusi === 403) return 'API_I_PAKTIVIZUAR';
  if (statusi === 429) return 'KUOTA_U_MBUSH';
  if (statusi >= 500) return 'GABIM_SERVERI';
  return 'GABIM_RRJETI';
}

const fle = (ms) => new Promise((zgjidh) => setTimeout(zgjidh, ms));

class PlacesClient {
  constructor({ apiKey, gjuha = 'sq', rajoni = 'XK', maksRiprovime = 3, fetchImpl = null } = {}) {
    if (!apiKey) throw new GabimPlaces('MUNGON_KEY', 'Mungon GOOGLE_PLACES_API_KEY.');
    this.apiKey = apiKey;
    this.gjuha = gjuha;
    this.rajoni = rajoni;
    this.maksRiprovime = maksRiprovime;
    // Node 20+ e ka fetch global; injektimi lejon testim pa rrjet.
    this.fetchImpl = fetchImpl || globalThis.fetch;
    if (typeof this.fetchImpl !== 'function') {
      throw new GabimPlaces('PA_FETCH', 'Mjedisi s\u2019ka fetch — kërkohet Node 18+.');
    }
    this.kerkesa = 0; // numëruesi i kostos
  }

  async thirr(rruga, trupi, fieldMask) {
    let vonesa = 500;

    for (let perpjekja = 0; perpjekja <= this.maksRiprovime; perpjekja++) {
      this.kerkesa++;
      let pergjigja;
      try {
        pergjigja = await this.fetchImpl(`${BAZA}/${rruga}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify(trupi),
        });
      } catch (e) {
        // Dështim rrjeti → riprovë; përndryshe dorëzohemi.
        if (perpjekja < this.maksRiprovime) {
          await fle(vonesa);
          vonesa *= 2;
          continue;
        }
        throw new GabimPlaces('GABIM_RRJETI', e.message);
      }

      if (pergjigja.ok) return pergjigja.json();

      const kodi = kodiNgaStatusi(pergjigja.status);
      // 429/5xx janë kalimtare — vlejnë riprovat me backoff eksponencial.
      if ((kodi === 'KUOTA_U_MBUSH' || kodi === 'GABIM_SERVERI') && perpjekja < this.maksRiprovime) {
        await fle(vonesa);
        vonesa *= 2;
        continue;
      }

      let detaji = '';
      try {
        const trupiGabimit = await pergjigja.json();
        detaji = trupiGabimit?.error?.message || '';
      } catch {
        detaji = '';
      }
      throw new GabimPlaces(kodi, detaji || `HTTP ${pergjigja.status}`, pergjigja.status);
    }

    throw new GabimPlaces('GABIM_RRJETI', 'Të gjitha riprovat dështuan.');
  }

  // Text Search me paginim. Google kthen maks 20/faqe dhe 3 faqe (60 rezultate).
  // KUJDES: gjatë paginimit çdo parametër tjetër veç pageToken DUHET të mbetet
  // i njëjtë, përndryshe kthehet INVALID_ARGUMENT.
  async kerkoTekst({ pyetja, kutia = null, maksFaqe = 3, pageToken = null, tipi = '' }) {
    const trupiBaze = {
      textQuery: pyetja,
      languageCode: this.gjuha,
      regionCode: this.rajoni,
      pageSize: 20,
    };
    if (kutia) trupiBaze.locationRestriction = { rectangle: kutia };
    if (tipi) trupiBaze.includedType = tipi;

    const vendet = [];
    let token = pageToken;

    for (let faqja = 0; faqja < maksFaqe; faqja++) {
      const trupi = token ? { ...trupiBaze, pageToken: token } : trupiBaze;
      const data = await this.thirr('places:searchText', trupi, MASKA_TEXT);
      const faqjaVendeve = Array.isArray(data?.places) ? data.places : [];
      vendet.push(...faqjaVendeve);
      token = data?.nextPageToken || null;
      if (!token) break;
    }

    return { vendet, pageToken: token };
  }

  // Nearby Search: 20 rezultate për rreth, pa paginim. Mbulimi shterrues arrihet
  // duke e ndarë qytetin në shumë rrathë (shih rrjeta.js).
  async kerkoAfer({ lat, lng, rrezjaKm, tipat = [] }) {
    const trupi = {
      languageCode: this.gjuha,
      regionCode: this.rajoni,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: Number(lat), longitude: Number(lng) },
          // Google pranon maksimum 50 000 m.
          radius: Math.min(50000, Math.max(1, Number(rrezjaKm) * 1000)),
        },
      },
    };
    if (tipat.length) trupi.includedTypes = tipat;

    const data = await this.thirr('places:searchNearby', trupi, MASKA_NEARBY);
    return { vendet: Array.isArray(data?.places) ? data.places : [] };
  }

  // URL-ja e fotos. Google NUK e kthen URL-në te kërkimi — duhet një thirrje
  // media për referencë. skipHttpRedirect=true → JSON me 'photoUri' në vend të redirect-it.
  async merrUrlFotos(ref, maksGjeresia = 900) {
    if (!ref) return '';
    const gjeresia = Math.min(4800, Math.max(1, Math.round(Number(maksGjeresia) || 900)));
    const url = `${BAZA}/${ref}/media?maxWidthPx=${gjeresia}&skipHttpRedirect=true`;

    this.kerkesa++;
    let pergjigja;
    try {
      pergjigja = await this.fetchImpl(url, {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': this.apiKey },
      });
    } catch (e) {
      throw new GabimPlaces('GABIM_RRJETI', e.message);
    }

    if (!pergjigja.ok) throw new GabimPlaces(kodiNgaStatusi(pergjigja.status), `HTTP ${pergjigja.status}`, pergjigja.status);

    const data = await pergjigja.json();
    return data?.photoUri ? String(data.photoUri) : '';
  }
}

module.exports = { PlacesClient, GabimPlaces, FUSHAT_E_VENDIT, MASKA_TEXT, MASKA_NEARBY };
