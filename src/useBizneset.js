import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { biznesetFillestare } from './teDhenat';

// BURIMI I BASHKUAR I TË DHËNAVE
// - biznesetFillestare (lokale): gjithmonë të disponueshme, edhe pa internet
// - Firestore (live): bizneset e shtuara nga përdoruesit/admini, përditësohen në kohë reale
// Ndryshimi i ri: bizneset me status 'pendshe' fshehen nga publiku (t'i shohë vetëm admini).
export function useBizneset({ vetemAprovuar = true } = {}) {
  const [biznesetFirestore, setBiznesetFirestore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gabim, setGabim] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'bizneset'),
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBiznesetFirestore(lista);
        setLoading(false);
        setGabim(false);
      },
      (err) => {
        console.warn('Firestore nuk u arrit — duke përdorur të dhënat lokale:', err.message);
        setLoading(false);
        setGabim(true);
      }
    );
    return () => unsub();
  }, []);

  // Bashkim: bazë lokale + Firestore mbi të (emri i njëjtë → versioni Firestore fiton)
  let bizneset = biznesetFillestare.map((b) => ({ ...b, burimi: 'lokal' }));
  for (const b of biznesetFirestore) {
    const iEkzistenti = bizneset.find((l) => String(l.emri).toLowerCase() === String(b.emri).toLowerCase());
    if (iEkzistenti) Object.assign(iEkzistenti, b, { burimi: 'cloud' });
    else bizneset.push({ ...b, burimi: 'cloud' });
  }

  if (vetemAprovuar) {
    bizneset = bizneset.filter((b) => b.status !== 'pendshe');
  }

  return { bizneset, loading, gabim };
}

// Lidhja e saktë për Google Maps: koordinata nëse ka, nëse jo — kërkim i saktë me adresën
export function merrMapsUrl(biznesi) {
  if (biznesi.lat && biznesi.lng) {
    return `https://www.google.com/maps?q=${biznesi.lat},${biznesi.lng}`;
  }
  const pyetja = [biznesi.emri, biznesi.adresa, biznesi.qyteti, 'Kosovë'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pyetja)}`;
}
