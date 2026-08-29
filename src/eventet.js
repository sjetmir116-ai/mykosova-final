import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// ===== EVENTE (spec U14, D16, A20) =====
// Nga Firestore (events — i menaxhueshëm nga admini) me fallback lokal.

const EVENTET_LOKALE = [
  {
    emri: 'Pejë Mountain Running', qyteti: 'Pejë', data: '2026-09-19', ora: '07:00',
    kategoria: 'Sport', ikona: '🏃',
    pershkrimi: 'Garë malore 21km nga qendra e Pejës deri te Ujmani — për çdo nivel. Regjistrimi te organizatori.',
  },
  {
    emri: 'Kosova Rocks Festival', qyteti: 'Prizren', data: '2026-09-12', ora: '18:00',
    kategoria: 'Muzikë', ikona: '🎸',
    pershkrimi: 'Festivali kryesor i muzikës rock dhe metal në Kosovë — 3 skena, 20+ grupe, afër Kalasë.',
  },
  {
    emri: 'Gjakova Food Festival', qyteti: 'Gjakovë', data: '2026-09-25', ora: '12:00',
    kategoria: 'Ushqim', ikona: '🍽️',
    pershkrimi: 'Pjatë tradicionale shqiptare dhe ballkanike, treg produktish vendas dhe kuzhinëlive.',
  },
  {
    emri: 'Java e Verës së Kosovës', qyteti: 'Gjakovë', data: '2026-09-28', ora: '11:00',
    kategoria: 'Kulturë', ikona: '🍷',
    pershkrimi: 'Degustim verash të vendit nga 12 prodhues — Rahovec, Ferizaj, Pejë. Hapur për publikun.',
  },
  {
    emri: 'Prizren Jazz Days', qyteti: 'Prizren', data: '2026-10-03', ora: '19:00',
    kategoria: 'Muzikë', ikona: '🎷',
    pershkrimi: 'Javë jazz me koncerte afër Shadrvanit — muzikantë vendas dhe të huaj.',
  },
  {
    emri: 'Prishtina International Film Festival', qyteti: 'Prishtinë', data: '2026-11-14', ora: '18:00',
    kategoria: 'Kulturë', ikona: '🎬',
    pershkrimi: 'Festivali ndërkombëtar i filmit — konkurse, filmatë kurorëzuar dhe takime me regjizorë.',
  },
];

export function useEventet() {
  const [ngaDb, setNgaDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gabim, setGabim] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        setNgaDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setGabim(false);
      },
      (err) => {
        console.warn('Events s\u2019u arrit — fallback lokal:', err.message);
        setLoading(false);
        setGabim(true);
      }
    );
    return () => unsub();
  }, []);

  const normalizo = (v) => String(v || '').toLowerCase();
  let lista = EVENTET_LOKALE.map((e) => ({ ...e, burimi: 'lokal' }));
  for (const e of ngaDb) {
    const iEkzistenti = lista.find((l) => normalizo(l.emri) === normalizo(e.emri));
    if (iEkzistenti) Object.assign(iEkzistenti, e, { burimi: 'db' });
    else lista.push({ ...e, burimi: 'db' });
  }

  // Rendit sipas datës (më e afërta fillim)
  lista = [...lista].sort((a, b) => String(a.data).localeCompare(String(b.data)));
  return { lista, loading, gabim };
}

// Formaton datën në mënyrë shqipe
export function formatoDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return String(dateStr);
  return d.toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// A është eventi ende në të ardhmen?
export function esNeTeArdhmen(dateStr) {
  if (!dateStr) return false;
  const sot = new Date().toISOString().split('T')[0];
  return String(dateStr) >= sot;
}
