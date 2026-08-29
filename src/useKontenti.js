import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// ===== KONTENTI I MENAXHUESHËM NGA ADMINI =====
// Kategoritë, Qytetet dhe Shërbimet e Urgjencës janë në Firestore (CRUD nga Paneli Admin → Kontenti).
// Fallback lokal: nëse Firestore nuk arrihet, app-i punon me listat e default (edhe pa internet).
// Admini mund t'i ndryshojë pa ndryshuar asnjë rresht kodi (spec Y1, Y10, A17-A18, A21).

const normalizo = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function përdorKoleksionin(emriIKoleksionit, fallbackLokal) {
  const [ngaDb, setNgaDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gabim, setGabim] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, emriIKoleksionit),
      (snap) => {
        setNgaDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setGabim(false);
      },
      (err) => {
        console.warn(`Koleksioni "${emriIKoleksionit}" nuk u arrit — fallback lokal:`, err.message);
        setLoading(false);
        setGabim(true);
      }
    );
    return () => unsub();
  }, [emriIKoleksionit]);

  // Bashkim: fallback lokal + DB (DB merr parësiri sipas emrit)
  let lista = fallbackLokal.map((x) => ({ ...x, burimi: 'lokal' }));
  for (const x of ngaDb) {
    const iEkzistenti = lista.find((l) => normalizo(l.emri) === normalizo(x.emri));
    if (iEkzistenti) Object.assign(iEkzistenti, x, { burimi: 'db' });
    else lista.push({ ...x, burimi: 'db' });
  }

  return { lista, loading, gabim };
}

// KATEGORITË (Master Plan: 8 grupe + 5 bazë)
const KATEGORITE_LOKALE = [
  { emri: 'Hotele', ikona: '🏨' },
  { emri: 'Restorante', ikona: '🍽️' },
  { emri: 'Kafene', ikona: '☕' },
  { emri: 'Pika Karburanti', ikona: '⛽' },
  { emri: 'Turizëm', ikona: '🏔️' },
  { emri: 'Emergjenca', ikona: '🚑' },
  { emri: 'Hospitality', ikona: '🛏️' },
  { emri: 'Food', ikona: '🍔' },
  { emri: 'Automotive', ikona: '🚗' },
  { emri: 'Health', ikona: '🏥' },
  { emri: 'Shopping', ikona: '🛍️' },
  { emri: 'Services', ikona: '🔧' },
  { emri: 'Business', ikona: '🏢' },
];
export function useKategorite() {
  return përdorKoleksionin('kategorite', KATEGORITE_LOKALE);
}

// QYTETET
const QYTESET_LOKALE = [
  { emri: 'Prishtinë' },
  { emri: 'Prizren' },
  { emri: 'Pejë' },
  { emri: 'Gjakovë' },
  { emri: 'Ferizaj' },
  { emri: 'Gjilan' },
  { emri: 'Mitrovicë' },
  { emri: 'Suharekë' },
  { emri: 'Vitina' },
  { emri: 'Lipjan' },
  { emri: 'Kosovë' },
  { emri: 'Obiliq' },
  { emri: 'Suva Reka' },
  { emri: 'Vushtrri' },
  { emri: 'Luginë' },
  { emri: 'Deçan' },
  { emri: 'Orahovac' },
  { emri: 'Kamenicë' },
];
export function useQyteteve() {
  return përdorKoleksionin('qytetet', QYTESET_LOKALE);
}

// SHËRBIMET E URGJENCËS (numrat zyrtarë + shërbimet mjekësore)
const URGJENCAT_LOKALE = [
  { emri: 'Policia', numri: '192', ikona: '👮‍♂️', ngjyra: '#1e3a8a' },
  { emri: 'Zjarrfikësit', numri: '193', ikona: '👨‍🚒', ngjyra: '#b91c1c' },
  { emri: 'Ndihma e Shpejtë', numri: '194', ikona: '🚑', ngjyra: '#15803d' },
  { emri: 'Mbrojtja Civile', numri: '112', ikona: '🚨', ngjyra: '#b45309' },
];
export function useUrgjencave() {
  return përdorKoleksionin('emergencyServices', URGJENCAT_LOKALE);
}
