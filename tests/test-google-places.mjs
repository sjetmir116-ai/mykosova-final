import assert from 'assert';
import { beforeEach, describe, it } from 'node:test';
import {
  normalizoQytetin,
  MAP_CATEGORIES,
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
