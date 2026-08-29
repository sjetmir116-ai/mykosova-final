// ===== TESTET E UNITARE: KODIMI GEOGRAFIK (vendndodhja me emër njerëzor) =====
import fs from 'fs';
import path from 'path';
import { distancaKm } from '../src/distanca.js';
import { CITET_GPS } from '../src/qyteteGPS.js';

let mire = 0, gabim = 0;
const test = (emri, kushti) => { kushti ? mire++ : gabim++; console.log((kushti ? '✅' : '❌ GABIM') + ' ' + emri); };

// Stub i qytetiMeIAferi nga kodiGeografike (pa importin e dependencies)
const burimi = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'kodiGeografike.js'), 'utf8');
const stub = burimi
  .replace("import { CITET_GPS } from './qyteteGPS';", "import { CITET_GPS } from './qyteteGPS.js';")
  .replace("import { distancaKm } from './distanca';", "import { distancaKm } from './distanca.js';");
const tmp = path.join(import.meta.dirname, '..', 'src', '__kodiGeografike-stub-tmp.mjs');
fs.writeFileSync(tmp, stub);

try {
  const { qytetiMeIAferi, kthePershkrimi } = await import('../src/__kodiGeografike-stub-tmp.mjs');

  // 1. Qyteti më i afërt
  const suh = qytetiMeIAferi(42.5706, 20.7875); // qendra e Suharekës
  test('Qendra e Suharekes → "Suharekë (Dukagjini)" (rez: ' + suh.emri + ')', suh.emri.startsWith('Suharekë') && suh.distanca < 0.5);
  const prz = qytetiMeIAferi(42.6820, 20.7968); // qendra e Prizrenit
  test('Qendra e Prizrenit → "Prizren" (rez: ' + prz.emri + ')', prz.emri === 'Prizren' && prz.distanca < 0.5);
  const prs = qytetiMeIAferi(42.6627, 21.1655); // qendra e Prishtinës
  test('Qendra e Prishtines → "Prishtina" (rez: ' + prs.emri + ')', prs.emri === 'Prishtina' && prs.distanca < 0.5);
  const mes = qytetiMeIAferi(42.6720, 20.9900); // mes Prishtines dhe Prizrenit
  test('Pika mes qyteteve → qyteti me i afert, jo null', mes && Number.isFinite(mes.distanca));

  // 2. kthePershkrimi me fetch te SIMULUAR (Nominatim)
  globalThis.fetch = async (url) => {
    test('URL-i Nominatim me koordinata + gjuhe sq', url.includes('nominatim.openstreetmap.org/reverse') && url.includes('accept-language=sq') && url.includes('lat=42.5706') && url.includes('lon=20.7875'));
    return { ok: true, json: async () => ({ name: 'Suharekë', address: { city: 'Suharekë', county: 'Dukagjini', state: 'Kosovë' } }) };
  };
  const e1 = await kthePershkrimi(42.5706, 20.7875);
  test('Nominatim → "Suharekë, Kosovë" (rez: ' + e1 + ')', e1 === 'Suharekë, Kosovë');

  // 3. Nominatim me vetëm fshat (pa qytet)
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ name: 'Fshati X', address: { village: 'Fshati X', county: 'Dukagjini' } }) });
  const e2 = await kthePershkrimi(42.5, 20.8);
  test('Vetëm fshat → emri i fshatit (rez: ' + e2 + ')', e2 === 'Fshati X');

  // 4. Nominatim i pasuksesshem (404)
  globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
  const e3 = await kthePershkrimi(42.5, 20.8);
  test('Nominatim 404 → null (thirrësi ruan qytetin e afert)', e3 === null);

  // 5. Pa internet (fetch i ndërruar) → null, s\u2019thon asgjë
  globalThis.fetch = async () => { throw new Error('no network'); };
  let shton = true;
  let e4 = 'x';
  try { e4 = await kthePershkrimi(42.5, 20.8); } catch (e) { shton = false; }
  test('Pa internet → null, pa exception', shton === true && e4 === null);
} finally {
  fs.unlinkSync(tmp);
}

console.log('=== kodiGeografike: ' + mire + ' te kaluara, ' + gabim + ' GABIME ' + (gabim ? '⚠️' : '✅') + ' ===');
process.exit(gabim ? 1 : 0);
