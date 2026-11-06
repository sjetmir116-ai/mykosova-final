// ===== TESTET E KËRKIMIT (v1.0.17) — normalizimi + fusha 'emriKerkim' =====
// Ekzekutohet me: node tests/test-kerkimi.mjs
import { normalizo, ndertoEmrinKerkim, tekstiKerkimit, perputhetKerkimi, kufijteKerkimit } from '../src/kerkimi.js';

let mire = 0, gabim = 0;
const kontrollo = (emri, rez, pritur) => {
  const ok = JSON.stringify(rez) === JSON.stringify(pritur);
  if (ok) { mire++; console.log(`✅ ${emri}`); }
  else { gabim++; console.log(`❌ ${emri} → ${JSON.stringify(rez)} (pritur: ${JSON.stringify(pritur)})`); }
};

kontrollo('normalizo: ë→e, ç→c', normalizo('Suharekë Çarshia'), 'suhareke carshia');
kontrollo('normalizo: shkronja të mëdha', normalizo('HOTEL SOLID'), 'hotel solid');
kontrollo('normalizo: hapësira të tepërta', normalizo('  Hotel   Solid  '), 'hotel solid');
kontrollo('normalizo: null/undefined', normalizo(null), '');
kontrollo('ndertoEmrinKerkim: emër + qytet', ndertoEmrinKerkim({ emri: 'Hotel Solid', qyteti: 'Prizren' }), 'hotel solid prizren');
kontrollo('ndertoEmrinKerkim: pa qytet', ndertoEmrinKerkim({ emri: 'Alpet Petrol' }), 'alpet petrol');
kontrollo('tekstiKerkimit: përdor fushën kur ekziston', tekstiKerkimit({ emri: 'X', emriKerkim: 'y z' }), 'y z');
kontrollo('tekstiKerkimit: fallback për dokument të vjetër', tekstiKerkimit({ emri: 'Restorant Imperial', qyteti: 'Suharekë' }), 'restorant imperial suhareke');
kontrollo('perputhetKerkimi: pa diakritika (emriKerkim)', perputhetKerkimi({ emri: 'Restorant Imperial', emriKerkim: 'restorant imperial suhareke' }, 'IMPERIAL'), true);
kontrollo('perputhetKerkimi: pyetje me ë', perputhetKerkimi({ emri: 'Hotel Solid', qyteti: 'Suharekë' }, 'suharekë'), true);
kontrollo('perputhetKerkimi: pyetje pa ë', perputhetKerkimi({ emri: 'Hotel Solid', qyteti: 'Suharekë' }, 'suhareke'), true);
kontrollo('perputhetKerkimi: kategori', perputhetKerkimi({ emri: 'X', kategoria: 'Pika Karburanti' }, 'karburant'), true);
kontrollo('perputhetKerkimi: s\\u2019përputhet', perputhetKerkimi({ emri: 'Hotel Solid', qyteti: 'Prizren' }, 'hotel aulona'), false);
kontrollo('perputhetKerkimi: pyetje bosh', perputhetKerkimi({ emri: 'Hotel Solid' }, '   '), true);
kontrollo('kufijteKerkimit: prefiksi', kufijteKerkimit('Hotel').nga, 'hotel');
kontrollo('kufijteKerkimit: kufiri i sipërm', kufijteKerkimit('Hotel').deri, 'hotel\uf8ff');

console.log(`\n${gabim === 0 ? '🎉' : '⚠️'} TESTET E KËRKIMIT: ${mire} kaluar, ${gabim} gabim.`);
if (gabim > 0) process.exit(1);
