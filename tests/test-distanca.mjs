// ===== TESTET E UNITARE: DISTANCA (Haversine) + TË DHËNAT LOKALE =====
import { distancaKm, formatoDistancm, meDistanca } from '../src/distanca.js';
import { biznesetFillestare } from '../src/teDhenat.js';

let mire = 0, gabim = 0;
const test = (emri, kushti) => { kushti ? mire++ : gabim++; console.log((kushti ? '✅' : '❌ GABIM') + ' ' + emri); };

// 1. Haversine — pika e njejte
test('Distanca e nje pike me vete = 0', distancaKm(42.6627, 21.1655, 42.6627, 21.1655) === 0);

// 2. Distanca te njohura
const dPS = distancaKm(42.6627, 21.1655, 42.5706, 20.7875); // Prishtine -> Suhareke
test('Prishtine->Suhareke ~ 31-34 km (rez: ' + dPS.toFixed(1) + ')', dPS > 31 && dPS < 34);
const dPriz = distancaKm(42.6627, 21.1655, 42.6820, 20.7968); // Prishtine -> Prizren
test('Prishtine->Prizren ~ 29-32 km (rez: ' + dPriz.toFixed(1) + ')', dPriz > 29 && dPriz < 32);

// 3. Formatimi
test('0.85 km -> "850 m"', formatoDistancm(0.85) === '850 m');
test('3.42 km -> "3.4 km"', formatoDistancm(3.42) === '3.4 km');
test('null -> ""', formatoDistancm(null) === '');

// 4. Te dhënat lokale — te gjitha me GPS
const paGPS = biznesetFillestare.filter((b) => b.lat == null || b.lng == null);
test('Te gjitha ' + biznesetFillestare.length + ' biznese lokale kane lat/lng (paGPS: ' + paGPS.length + ')', paGPS.length === 0);
test('Te gjitha kane emri+qyteti+kategoria+vleresimi', biznesetFillestare.every((b) => b.emri && b.qyteti && b.kategoria && b.vleresimi));

// 5. meDistanca
const meGPS = meDistanca({ lat: 42.5, lng: 20.8 }, { lat: 42.6627, lng: 21.1655 });
const paGPSRes = meDistanca({}, { lat: 42.6627, lng: 21.1655 });
test('meDistanca kthen distancen kur ka GPS', meGPS.distanca > 0);
test('meDistanca kthen null kur s\u2019ka GPS', paGPSRes.distanca === null);

// 6. RENDITJA — përdoruesi lëviz në qytet tjetër (kërkesa #3 e përdoruesit)
const rendit = (ul) => [...biznesetFillestare]
  .map((b) => meDistanca(b, ul))
  .sort((a, b) => {
    if (a.distanca == null && b.distanca == null) return 0;
    if (a.distanca == null) return 1;
    if (b.distanca == null) return -1;
    return a.distanca - b.distanca;
  });
const ngaPrishtina = rendit({ lat: 42.6627, lng: 21.1655 });
const ngaPrizreni = rendit({ lat: 42.6820, lng: 20.7968 });
test('Nga Prishtina, biznesi i pari eshte i Prishtines (rez: ' + ngaPrishtina[0].emri + ')', ngaPrishtina[0].qyteti === 'Prishtinë');
test('Nga Prizreni, biznesi i pari eshte i Prizrenit (rez: ' + ngaPrizreni[0].emri + ')', ngaPrizreni[0].qyteti === 'Prizren');
test('Biznesi me i aferten ndryshon kur perdoruesi leviz', ngaPrishtina[0].emri !== ngaPrizreni[0].emri);
test('Renditja eshte rritese', ngaPrishtina.every((b, i) => i === 0 || (b.distanca == null) || b.distanca >= ngaPrishtina[i - 1].distanca));

console.log('=== distanca: ' + mire + ' te kaluara, ' + gabim + ' GABIME ' + (gabim ? '⚠️' : '✅') + ' ===');
process.exit(gabim ? 1 : 0);
