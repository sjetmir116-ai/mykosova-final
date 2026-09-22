import assert from 'assert';
import { beforeEach, describe, it } from 'node:test';
import {
  normalizoQytetin,
  MAP_CATEGORIES,
  GOOGLE_PLACES_AUTOCOMPLETE_DEBOUNCE_MS,
  GOOGLE_PLACES_AUTOCOMPLETE_FIELD_MASK,
  GOOGLE_PLACES_AUTOCOMPLETE_MIN_CHARS,
  GOOGLE_PLACES_DETAILS_FIELD_MASK,
  googlePlaceDocumentId,
  merrGooglePlacesApiKey,
  ruajGooglePlacesApiKey,
  fshiGooglePlacesApiKey,
  merrReferencenFotos,
  merrAtributinFotos,
  ndertoUrlMediaFotos,
  eSigurtPerRuajtje,
  merrUrlFotos,
  ngaGoogle,
  krijoGooglePlacesSessionToken,
  normalizoSugjerimetAutocomplete,
  kerkoAutocompleteGooglePlaces,
  merrDetajetGooglePlace,
} from '../src/googlePlaces.js';

// Imitimi i localStorage për mjedisin Node të testit.
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; },
};

describe('Google Places Suite e Plotë', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('duhet të menaxhojë saktë API Key në localStorage', () => {
    ruajGooglePlacesApiKey('test_key_123');
    assert.strictEqual(merrGooglePlacesApiKey(), 'test_key_123');
    fshiGooglePlacesApiKey();
    assert.strictEqual(merrGooglePlacesApiKey(), '');
  });

  it('duhet të gjenerojë ID deterministe të saktë', () => {
    assert.strictEqual(googlePlaceDocumentId('ChIJ38V7'), 'google_ChIJ38V7');
    assert.strictEqual(googlePlaceDocumentId(''), '');
  });

  it('duhet të normalizojë variantet e qyteteve', () => {
    assert.strictEqual(normalizoQytetin('Prishtina, Kosovë'), 'Prishtinë');
    assert.strictEqual(normalizoQytetin('Therandë'), 'Suharekë');
  });

  it('duhet të ketë hartëzimin e duhur të kategorive bazë', () => {
    assert.strictEqual(MAP_CATEGORIES.restaurant, 'Restorante');
    assert.strictEqual(MAP_CATEGORIES.cafe, 'Kafene');
    assert.strictEqual(MAP_CATEGORIES.hospital, 'Health');
  });
});

describe('Fotoja nga Google — referenca dhe siguria', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  const REF = 'places/ChIJ38V7/photos/AUacShh3';

  it('duhet të nxjerrë referencën e fotos së parë', () => {
    const place = { photos: [{ name: REF }, { name: 'places/x/photos/y' }] };
    assert.strictEqual(merrReferencenFotos(place), REF);
  });

  it('duhet të kthejë string bosh kur mungojnë fotot', () => {
    assert.strictEqual(merrReferencenFotos({}), '');
    assert.strictEqual(merrReferencenFotos({ photos: [] }), '');
    assert.strictEqual(merrReferencenFotos(null), '');
    // Element pa 'name' nuk duhet të shkaktojë përjashtim.
    assert.strictEqual(merrReferencenFotos({ photos: [{}] }), '');
  });

  it('duhet të nxjerrë atribuimin e autorit (kërkesë e Google)', () => {
    const place = { photos: [{ name: REF, authorAttributions: [{ displayName: 'Arben K.' }] }] };
    assert.strictEqual(merrAtributinFotos(place), 'Arben K.');
    assert.strictEqual(merrAtributinFotos({ photos: [{ name: REF }] }), '');
  });

  it('duhet të ndërtojë URL me skipHttpRedirect dhe PA çelës', () => {
    const url = ndertoUrlMediaFotos(REF, 900);
    assert.ok(url.startsWith('https://places.googleapis.com/v1/' + REF + '/media'));
    assert.ok(url.includes('skipHttpRedirect=true'));
    assert.ok(url.includes('maxWidthPx=900'));
    // Çelësi dërgohet si header, kurrë te URL-ja.
    assert.ok(!/[?&]key=/i.test(url));
  });

  it('duhet të kufizojë gjerësinë brenda kufirit të Google (maks. 4800)', () => {
    // Mbi kufirin → shtrëngohet, se Google kthen INVALID_ARGUMENT mbi 4800.
    assert.ok(ndertoUrlMediaFotos(REF, 99999).includes('maxWidthPx=4800'));
    // Vlerat e pavlefshme (≤0, NaN, mungesë) → parazgjedhja, jo një foto 1 px.
    assert.ok(ndertoUrlMediaFotos(REF, -5).includes('maxWidthPx=900'));
    assert.ok(ndertoUrlMediaFotos(REF, 0).includes('maxWidthPx=900'));
    assert.ok(ndertoUrlMediaFotos(REF, 'abc').includes('maxWidthPx=900'));
    assert.ok(ndertoUrlMediaFotos(REF).includes('maxWidthPx=900'));
    // Vlerat e vlefshme kalojnë siç janë.
    assert.ok(ndertoUrlMediaFotos(REF, 400).includes('maxWidthPx=400'));
    assert.strictEqual(ndertoUrlMediaFotos(''), '');
  });

  it('duhet të REFUZOJË çdo URL që mbart një çelës (mbrojtje kryesore)', () => {
    assert.strictEqual(eSigurtPerRuajtje('https://lh3.googleusercontent.com/abc'), true);
    assert.strictEqual(eSigurtPerRuajtje('https://places.googleapis.com/v1/x/media?key=SEKRET'), false);
    assert.strictEqual(eSigurtPerRuajtje('https://x.com/a?maxWidthPx=9&API_KEY=SEKRET'), false);
    assert.strictEqual(eSigurtPerRuajtje('https://x.com/a?api_key=SEKRET'), false);
    // Vetëm HTTPS pranohet.
    assert.strictEqual(eSigurtPerRuajtje('http://lh3.googleusercontent.com/abc'), false);
    assert.strictEqual(eSigurtPerRuajtje(''), false);
  });

  it('duhet të kërkojë API key para se të marrë foton', async () => {
    await assert.rejects(() => merrUrlFotos(REF), /MUNGON_KEY/);
  });

  it('duhet të kthejë photoUri dhe ta dërgojë çelësin vetëm si header', async () => {
    ruajGooglePlacesApiKey('key_sekret');
    let urlEThirrur = '';
    let opsionet = null;
    global.fetch = async (url, opts) => {
      urlEThirrur = url;
      opsionet = opts;
      return { ok: true, status: 200, json: async () => ({ photoUri: 'https://lh3.googleusercontent.com/foto' }) };
    };

    const url = await merrUrlFotos(REF);
    assert.strictEqual(url, 'https://lh3.googleusercontent.com/foto');
    assert.ok(!urlEThirrur.includes('key_sekret'), 'çelësi s’duhet të jetë te URL-ja');
    assert.strictEqual(opsionet.headers['X-Goog-Api-Key'], 'key_sekret');
    delete global.fetch;
  });

  it('duhet të përkthejë kodet e gabimeve të Google', async () => {
    ruajGooglePlacesApiKey('key_sekret');
    const rastet = [[400, 'KEY_I_GABUAR'], [403, 'API_I_PAKTIVIZUAR'], [404, 'GABIM_RRJETI'], [429, 'GABIM_RRJETI']];
    for (const [status, pritet] of rastet) {
      global.fetch = async () => ({ ok: false, status, json: async () => ({}) });
      await assert.rejects(() => merrUrlFotos(REF), new RegExp(pritet), `statusi ${status}`);
    }
    // Rrjeti i rënë nuk duhet të nxjerrë gabim të papritur.
    global.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(() => merrUrlFotos(REF), /GABIM_RRJETI/);
    // Përgjigje pa photoUri.
    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
    await assert.rejects(() => merrUrlFotos(REF), /GABIM_RRJETI/);
    delete global.fetch;
  });

  it('duhet të bllokojë një photoUri të pasigurt të kthyer nga serveri', async () => {
    ruajGooglePlacesApiKey('key_sekret');
    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ photoUri: 'https://x.com/a?key=SEKRET' }) });
    await assert.rejects(() => merrUrlFotos(REF), /FOTO_E_PASIGURT/);
    delete global.fetch;
  });
});

describe('Autocomplete me Places API (New)', () => {
  beforeEach(() => {
    global.localStorage.clear();
    delete global.fetch;
  });

  it('duhet të ketë prag dhe debounce të qëndrueshëm për UX', () => {
    assert.strictEqual(GOOGLE_PLACES_AUTOCOMPLETE_MIN_CHARS, 2);
    assert.strictEqual(GOOGLE_PLACES_AUTOCOMPLETE_DEBOUNCE_MS, 350);
  });

  it('duhet të krijojë session tokens unikë për faturim korrekt të Google', () => {
    const a = krijoGooglePlacesSessionToken();
    const b = krijoGooglePlacesSessionToken();
    assert.ok(a.length >= 10);
    assert.ok(b.length >= 10);
    assert.notStrictEqual(a, b);
  });

  it('duhet të normalizojë sugjerimet nga places:autocomplete', () => {
    const rezultatet = normalizoSugjerimetAutocomplete({
      suggestions: [{
        placePrediction: {
          place: 'places/ChIJ38V7',
          placeId: 'ChIJ38V7',
          text: { text: 'Restaurant Liburnia, Prishtinë' },
          structuredFormat: {
            mainText: { text: 'Restaurant Liburnia' },
            secondaryText: { text: 'Prishtinë, Kosovë' },
          },
          types: ['restaurant', 'food'],
        },
      }],
    });

    assert.strictEqual(rezultatet.length, 1);
    assert.deepStrictEqual(rezultatet[0], {
      placeId: 'ChIJ38V7',
      placeResource: 'places/ChIJ38V7',
      text: 'Restaurant Liburnia, Prishtinë',
      mainText: 'Restaurant Liburnia',
      secondaryText: 'Prishtinë, Kosovë',
      types: ['restaurant', 'food'],
    });
  });

  it('duhet të filtrojë sugjerimet pa placeId dhe të mbështesë place resource', () => {
    const rezultatet = normalizoSugjerimetAutocomplete({
      suggestions: [
        { placePrediction: { text: { text: 'Pa ID' } } },
        { placePrediction: { place: 'places/ABC123', text: { text: 'ABC Market' } } },
      ],
    });

    assert.strictEqual(rezultatet.length, 1);
    assert.strictEqual(rezultatet[0].placeId, 'ABC123');
    assert.strictEqual(rezultatet[0].mainText, 'ABC Market');
  });

  it('duhet të kthejë listë bosh për input shumë të shkurtër pa thirrur fetch', async () => {
    let uThirr = false;
    global.fetch = async () => { uThirr = true; };
    const rezultatet = await kerkoAutocompleteGooglePlaces('a', 'token-1');
    assert.deepStrictEqual(rezultatet, []);
    assert.strictEqual(uThirr, false);
  });

  it('duhet të kërkojë API key para autocomplete', async () => {
    await assert.rejects(() => kerkoAutocompleteGooglePlaces('Liburnia', 'token-1'), /MUNGON_KEY/);
  });

  it('duhet të thërrasë places:autocomplete me sessionToken, region XK dhe field mask', async () => {
    ruajGooglePlacesApiKey('key_sekret');
    let urlEThirrur = '';
    let opsionet = null;
    global.fetch = async (url, opts) => {
      urlEThirrur = url;
      opsionet = opts;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          suggestions: [{ placePrediction: { placeId: 'ChIJ1', text: { text: 'Kafene Prishtinë' } } }],
        }),
      };
    };

    const rezultatet = await kerkoAutocompleteGooglePlaces('Kafene', 'session-123');
    const body = JSON.parse(opsionet.body);

    assert.strictEqual(urlEThirrur, 'https://places.googleapis.com/v1/places:autocomplete');
    assert.strictEqual(opsionet.method, 'POST');
    assert.strictEqual(opsionet.headers['X-Goog-Api-Key'], 'key_sekret');
    assert.strictEqual(opsionet.headers['X-Goog-FieldMask'], GOOGLE_PLACES_AUTOCOMPLETE_FIELD_MASK);
    assert.deepStrictEqual(body, {
      input: 'Kafene',
      regionCode: 'XK',
      includedRegionCodes: ['XK'],
      languageCode: 'sq',
      sessionToken: 'session-123',
    });
    assert.strictEqual(rezultatet[0].placeId, 'ChIJ1');
  });

  it('duhet të përkthejë gabimet e autocomplete nga Google dhe rrjeti', async () => {
    ruajGooglePlacesApiKey('key_sekret');
    const rastet = [[400, 'KEY_I_GABUAR'], [403, 'API_I_PAKTIVIZUAR'], [500, 'GABIM_RRJETI']];
    for (const [status, pritet] of rastet) {
      global.fetch = async () => ({ ok: false, status, json: async () => ({}) });
      await assert.rejects(() => kerkoAutocompleteGooglePlaces('Liburnia', 'token-1'), new RegExp(pritet), `statusi ${status}`);
    }
    global.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(() => kerkoAutocompleteGooglePlaces('Liburnia', 'token-1'), /GABIM_RRJETI/);
  });

  it('duhet të marrë detajet e place me sessionToken dhe field mask', async () => {
    ruajGooglePlacesApiKey('key_sekret');
    let urlEThirrur = '';
    let opsionet = null;
    global.fetch = async (url, opts) => {
      urlEThirrur = url;
      opsionet = opts;
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'ChIJ38V7', displayName: { text: 'Liburnia' } }),
      };
    };

    const place = await merrDetajetGooglePlace('ChIJ38V7', 'session-123');

    assert.strictEqual(urlEThirrur, 'https://places.googleapis.com/v1/places/ChIJ38V7?sessionToken=session-123');
    assert.strictEqual(opsionet.method, 'GET');
    assert.strictEqual(opsionet.headers['X-Goog-Api-Key'], 'key_sekret');
    assert.strictEqual(opsionet.headers['X-Goog-FieldMask'], GOOGLE_PLACES_DETAILS_FIELD_MASK);
    assert.strictEqual(place.displayName.text, 'Liburnia');
  });

  it('duhet të pranojë place resource dhe të përkthejë gabimet e detajeve', async () => {
    ruajGooglePlacesApiKey('key_sekret');
    let urlEThirrur = '';
    global.fetch = async (url) => {
      urlEThirrur = url;
      return { ok: true, status: 200, json: async () => ({ id: 'ABC123' }) };
    };
    const place = await merrDetajetGooglePlace('places/ABC123');
    assert.strictEqual(urlEThirrur, 'https://places.googleapis.com/v1/places/ABC123');
    assert.strictEqual(place.id, 'ABC123');

    const rastet = [[400, 'KEY_I_GABUAR'], [403, 'API_I_PAKTIVIZUAR'], [404, 'GABIM_RRJETI']];
    for (const [status, pritet] of rastet) {
      global.fetch = async () => ({ ok: false, status, json: async () => ({}) });
      await assert.rejects(() => merrDetajetGooglePlace('ABC123'), new RegExp(pritet), `statusi ${status}`);
    }
    global.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(() => merrDetajetGooglePlace('ABC123'), /GABIM_RRJETI/);
  });
});

describe('Badge-i "nga Google" te paneli i adminit', () => {
  it('duhet të njohë bizneset e importuara nga Google', () => {
    assert.strictEqual(ngaGoogle({ googlePlaceId: 'ChIJ38V7' }), true);
    assert.strictEqual(ngaGoogle({ googleFotoRef: 'places/x/photos/y' }), true);
    assert.strictEqual(ngaGoogle({ id: 'google_ChIJ38V7' }), true);
  });

  it('duhet t’i lërë pa badge bizneset manuale', () => {
    assert.strictEqual(ngaGoogle({ emri: 'Kafe Central' }), false);
    assert.strictEqual(ngaGoogle({ googlePlaceId: '' }), false);
    assert.strictEqual(ngaGoogle({ googlePlaceId: null }), false);
    // Fusha bosh me hapësira s'duhet ta aktivizojë badge-in.
    assert.strictEqual(ngaGoogle({ googlePlaceId: '   ' }), false);
    assert.strictEqual(ngaGoogle(null), false);
    assert.strictEqual(ngaGoogle(undefined), false);
  });
});
