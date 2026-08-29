// ===== TESTET E UNITARE: OFERTAT (logjika e skadencës) =====
import fs from 'fs';
import path from 'path';

const burimi = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'useOfertat.js'), 'utf8');
const stub = burimi
  .replace("import { useEffect, useState } from 'react';", 'const useEffect = () => {}; const useState = (v) => [v, () => {}];')
  .replace("import { db } from './firebase';", 'const db = {};')
  .replace("import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';",
    'const collection = () => []; const query = () => {}; const where = () => {}; const onSnapshot = () => () => {}; const addDoc = async () => {}; const deleteDoc = async () => {}; const doc = () => {}; const serverTimestamp = () => ({});');
const tmp = path.join(import.meta.dirname, '..', 'src', '__useOfertat-stub-tmp.mjs');
fs.writeFileSync(tmp, stub);

let mire = 0, gabim = 0;
const test = (emri, kushti) => { kushti ? mire++ : gabim++; console.log((kushti ? '✅' : '❌ GABIM') + ' ' + emri); };
try {
  const { esOfertaAktive } = await import('../src/__useOfertat-stub-tmp.mjs');
  const sot = new Date().toISOString().split('T')[0];
  const neshta = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
  const kaluar = new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0];
  test('Pa skadencë → aktive (e përhershme)', esOfertaAktive({ teksti: 'x' }) === true);
  test('vlenDeri = sot → aktive (kufi)', esOfertaAktive({ vlenDeri: sot }) === true);
  test('vlenDeri = +30 ditë → aktive', esOfertaAktive({ vlenDeri: neshta }) === true);
  test('vlenDeri = -30 ditë → E SKADUAR', esOfertaAktive({ vlenDeri: kaluar }) === false);
  test('vlenDeri bosh → aktive', esOfertaAktive({ vlenDeri: '' }) === true);
} finally {
  fs.unlinkSync(tmp);
}

console.log('=== oferta: ' + mire + ' te kaluara, ' + gabim + ' GABIME ' + (gabim ? '⚠️' : '✅') + ' ===');
process.exit(gabim ? 1 : 0);
