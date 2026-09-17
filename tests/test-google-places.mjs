import assert from 'assert';
import { describe, it } from 'node:test';
import { normalizoQytetin, MAP_CATEGORIES } from '../src/googlePlaces.js';

describe('Google Places Integration Tests', () => {
  it('duhet të normalizojë saktë variantet e emrave të qyteteve', () => {
    assert.strictEqual(normalizoQytetin('Rruga Nëna Terezë, Prishtinë, Kosovë'), 'Prishtinë');
    assert.strictEqual(normalizoQytetin('Prishtina, 10000'), 'Prishtinë');
    assert.strictEqual(normalizoQytetin('Therandë, Kosovë'), 'Suharekë');
    assert.strictEqual(normalizoQytetin('Suhareka, Rruga pa emër'), 'Suharekë');
    assert.strictEqual(normalizoQytetin('Ndonjë qytet tjetër random'), '');
  });

  it('duhet të ketë hartëzimin e duhur të kategorive bazë', () => {
    assert.strictEqual(MAP_CATEGORIES['restaurant'], 'Restorante');
    assert.strictEqual(MAP_CATEGORIES['cafe'], 'Kafene');
    assert.strictEqual(MAP_CATEGORIES['hospital'], 'Health');
  });
});
