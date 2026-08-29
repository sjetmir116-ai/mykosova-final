// ===== TESTET E UNITARE: TURIZMI (atraksionet + qytetet) =====
// attraksionet.js importon firebase — e mbajmë me stub (Node s\u2019e mban importet pa extension)
import fs from 'fs';
import path from 'path';

const burimi = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'attraksionet.js'), 'utf8');
const stub = burimi
  .replace("import { useEffect, useState } from 'react';", 'const useEffect = () => {}; const useState = (v) => [v, () => {}];')
  .replace("import { db } from './firebase';", 'const db = {};')
  .replace("import { collection, onSnapshot } from 'firebase/firestore';", 'const collection = () => []; const onSnapshot = () => () => {};')
  .replace('export function useAttraksioneve', 'export const __lokal = ATRAKSIONET_LOKALE;\nexport function useAttraksioneve');
const tmp = path.join(import.meta.dirname, '..', 'src', '__attraksionet-stub-tmp.mjs');
fs.writeFileSync(tmp, stub);

let mire = 0, gabim = 0;
const test = (emri, kushti) => { kushti ? mire++ : gabim++; console.log((kushti ? '✅' : '❌ GABIM') + ' ' + emri); };
try {
  const { QYTETET_E_KOSOVES, __lokal: ATRAKSIONET_LOKALE } = await import('../src/__attraksionet-stub-tmp.mjs');
  const d = (a, b, c, e2) => 2 * 6371 * Math.asin(Math.sqrt(Math.sin((c - a) * Math.PI / 360) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin((e2 - b) * Math.PI / 360) ** 2));

  test('Kan ' + ATRAKSIONET_LOKALE.length + ' atraksione (>= 10)', ATRAKSIONET_LOKALE.length >= 10);
  test('Te gjitha kane lat/lng', ATRAKSIONET_LOKALE.every((a) => Number.isFinite(a.lat) && Number.isFinite(a.lng)));
  test('Te gjitha kane foto+pershkrimi+qytet+kategoria', ATRAKSIONET_LOKALE.every((a) => a.foto && a.pershkrimi && a.qyteti && a.kategoria));
  test('Koordinata brenda rajonit (lat 41.8-43.3, lng 19.5-21.9)', ATRAKSIONET_LOKALE.every((a) => a.lat > 41.8 && a.lat < 43.3 && a.lng > 19.5 && a.lng < 21.9));

  // Verifikim gjeografik i rregullimeve te 29.08 (8 gabime u rregulluan)
  const kala = ATRAKSIONET_LOKALE.find((a) => a.emri === 'Kalaja e Prizrenit');
  test('Kalaja e Prizrenit brenda Prizrenit (< 1 km nga qendra)', d(kala.lat, kala.lng, 42.682, 20.7968) < 1);
  const kalaGj = ATRAKSIONET_LOKALE.find((a) => a.emri === 'Kalaja e Gjakovës');
  test('Kalaja e Gjakoves te Gjakove, JO Prizren (< 1 km nga qendra)', d(kalaGj.lat, kalaGj.lng, 42.3237, 20.3374) < 1);
  const rugova = ATRAKSIONET_LOKALE.find((a) => a.emri === 'Gryka e Rugovës');
  test('Rugova afre Pejes (< 1 km)', d(rugova.lat, rugova.lng, 42.6627, 20.4342) < 1);
  test('Shadrvani + Muzeu i Prizrenit afre njere-tjetrit (< 0.3 km)', (() => {
    const sh = ATRAKSIONET_LOKALE.find((a) => a.emri === 'Shadrvani i Prizrenit');
    const mu = ATRAKSIONET_LOKALE.find((a) => a.emri === 'Muzeu Historik i Prizrenit');
    return d(sh.lat, sh.lng, mu.lat, mu.lng) < 0.3;
  })());

  test('Ullërimi ka ' + QYTETET_E_KOSOVES.length + ' qytete me pershkrim (>= 10)', QYTETET_E_KOSOVES.length >= 10 && QYTETET_E_KOSOVES.every((q) => q.pershkrimi));
} finally {
  fs.unlinkSync(tmp);
}

console.log('=== turizmi: ' + mire + ' te kaluara, ' + gabim + ' GABIME ' + (gabim ? '⚠️' : '✅') + ' ===');
process.exit(gabim ? 1 : 0);
