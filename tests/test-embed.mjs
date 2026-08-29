// ===== TESTET E UNITARE: LINK-ET GOOGLE MAPS (normal + embed) =====
// Embed-i (output=embed) lejohet edhe brenda panelit/iframe — zgjidh
// "Google refused to connect" kur paneli bllokon tab-et e reja.
import fs from 'fs';
import path from 'path';

const burimi = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'useBizneset.js'), 'utf8');
const stub = burimi
  .replace("import { useEffect, useState } from 'react';", 'const useEffect = () => {}; const useState = (v) => [v, () => {}];')
  .replace("import { db } from './firebase';", 'const db = {};')
  .replace("import { collection, onSnapshot } from 'firebase/firestore';", 'const collection = () => []; const onSnapshot = () => () => {};')
  .replace("import { biznesetFillestare } from './teDhenat';", 'const biznesetFillestare = [];');
const tmp = path.join(import.meta.dirname, '..', 'src', '__useBizneset-stub-tmp.mjs');
fs.writeFileSync(tmp, stub);

let mire = 0, gabim = 0;
const test = (emri, kushti) => { kushti ? mire++ : gabim++; console.log((kushti ? '✅' : '❌ GABIM') + ' ' + emri); };
try {
  const { merrMapsUrl, merrMapsUrlEmbed } = await import('../src/__useBizneset-stub-tmp.mjs');
  const meGPS = { emri: 'Kala Prizren', qyteti: 'Prizren', lat: 42.6844, lng: 20.8034 };
  const paGPS = { emri: 'Kafe Central', qyteti: 'Suharekë' };
  const e1 = merrMapsUrlEmbed(meGPS);
  const e2 = merrMapsUrlEmbed(paGPS);
  test('embed me GPS: q= + z=15 + output=embed', e1.includes('q=42.6844,20.8034') && e1.includes('z=15') && e1.includes('output=embed'));
  test('embed pa GPS: pyetja e koduar + output=embed', e2.includes('output=embed') && e2.includes(encodeURIComponent('Kafe Central, Suharekë, Kosovë')));
  test('Embed fillon me https://www.google.com/maps', e1.startsWith('https://www.google.com/maps') && e2.startsWith('https://www.google.com/maps'));
  test('Versioni normal (pa embed) mbaqet i pandryshuar', merrMapsUrl(meGPS) === 'https://www.google.com/maps?q=42.6844,20.8034');
} finally {
  fs.unlinkSync(tmp);
}

console.log('=== embed: ' + mire + ' te kaluara, ' + gabim + ' GABIME ' + (gabim ? '⚠️' : '✅') + ' ===');
process.exit(gabim ? 1 : 0);
