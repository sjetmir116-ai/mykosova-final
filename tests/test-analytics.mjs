// ===== TESTET E UNITARE: ANALYTICS (8 ngjarjet + validimi) =====
import fs from 'fs';
import path from 'path';

const burimi = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'analytics.js'), 'utf8');
const stub = burimi
  .replace("import { db } from './firebase';", 'globalThis.__calls = []; export const db = {};')
  .replace("import { collection, addDoc, serverTimestamp } from 'firebase/firestore';",
    'const collection = (d, n) => n; const addDoc = async (c, d) => { globalThis.__calls.push({ c, d }); return {}; }; const serverTimestamp = () => ({ t: "now" });');
const tmp = path.join(import.meta.dirname, '..', 'src', '__analytics-stub-tmp.mjs');
fs.writeFileSync(tmp, stub);

let mire = 0, gabim = 0;
const test = (emri, kushti) => { kushti ? mire++ : gabim++; console.log((kushti ? '✅' : '❌ GABIM') + ' ' + emri); };
try {
  const { ekzekutoNgjarjen, NGJARJET_E_LEJUARA } = await import('../src/__analytics-stub-tmp.mjs');
  test('Lista e ngjarjeve ka 8 ngjarje', NGJARJET_E_LEJUARA.length === 8);

  globalThis.__calls.length = 0;
  const r1 = ekzekutoNgjarjen('kërkim', { teksti: 'kafe' });
  test('Ngjarje e lejuar → addDoc thirret', r1 === true && globalThis.__calls.length === 1);
  test('Fushat janë saktë: ngjarja+detajet+koha', globalThis.__calls[0] && Object.keys(globalThis.__calls[0].d).join(',') === 'ngjarja,detajet,koha');
  test('Koleksioni i saktë (analytics_events)', globalThis.__calls[0].c === 'analytics_events');

  globalThis.__calls.length = 0;
  const r2 = ekzekutoNgjarjen('hakerim', { x: 1 });
  test('Ngjarje e panjohur → s\u2019shkruhet (mbron nga abuzi)', r2 === false && globalThis.__calls.length === 0);

  let shton = true;
  try { ekzekutoNgjarjen('navigo', { emri: 'X' }); } catch (e) { shton = false; }
  test('Gabimi thahet në heshtje (analitika s\u2019e ndalon kurrë app-in)', shton === true);

  let te8 = 0;
  for (const n of NGJARJET_E_LEJUARA) if (ekzekutoNgjarjen(n, {})) te8++;
  test('Te 8 ngjarjet e lejuara shkrihen (8/8)', te8 === 8);
} finally {
  fs.unlinkSync(tmp);
}

console.log('=== analytics: ' + mire + ' te kaluara, ' + gabim + ' GABIME ' + (gabim ? '⚠️' : '✅') + ' ===');
process.exit(gabim ? 1 : 0);
