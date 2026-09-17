import assert from 'assert';
import { beforeEach, describe, it } from 'node:test';
import {
  normalizoQytetin,
  MAP_CATEGORIES,
  googlePlaceDocumentId,
  merrGooglePlacesApiKey,
  ruajGooglePlacesApiKey,
  fshiGooglePlacesApiKey,
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
