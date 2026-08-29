import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ===== ANALYTICS (Faza 3.4) — regjistrimi i veprimeve të përdoruesve =====
// Koleksioni: analytics_events = { ngjarja, detajet, koha }
//  - SHKRUAN: çdo vizitor (edhe jo i loguar) — vetëm fushat e sakta + koha e serverit
//    (e kufizuar te firestore.rules — v2.1)
//  - LEXON: vetëm admini (Paneli Admin → 📊 Analitika)
// Analitika NUK e ndalon kurrë app-in: çdo gabim thahet në heshtje.

export const NGJARJET_E_LEJUARA = [
  'kërkim',
  'hapje_biznesi',
  'navigo',
  'telefon',
  'vlerësim',
  'sos',
  'ndaje',
  'shtim_biznesi',
];

// Regjistron një ngjarje (fire-and-forget). Detajet: objekt i vogël (emri, teksti, yjet...)
export function ekzekutoNgjarjen(ngjarja, detajet = {}) {
  try {
    if (!NGJARJET_E_LEJUARA.includes(ngjarja)) return false;
    addDoc(collection(db, 'analytics_events'), {
      ngjarja: String(ngjarja),
      detajet: detajet || {},
      koha: serverTimestamp(),
    }).catch((e) => {
      // Shpesh: rules ende s'janë publikuar ose rrjeti i dobët — thahet në heshtje
      console.warn('Ngjarja s\u2019u regjistrua (analitika):', e.message);
    });
    return true;
  } catch (e) {
    console.warn('Analitika (thahet në heshtje):', e.message);
    return false;
  }
}
