import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { biznesetFillestare } from './teDhenat';
import { normalizo, ndertoEmrinKerkim } from './kerkimi';

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
  // v1.0.17 — 'emriKerkim' llogaritet edhe për dokumentet e vjetra (pa e shkruar në Firestore)
  let bizneset = biznesetFillestare.map((b) => ({
    ...b,
    burimi: 'lokal',
    emriKerkim: b.emriKerkim || ndertoEmrinKerkim(b),
  }));
  for (const b of biznesetFirestore) {
    const kyçi = b.emriKerkim || normalizo(b.emri);
    const iEkzistenti = bizneset.find((l) => (l.emriKerkim || normalizo(l.emri)) === kyçi);
    if (iEkzistenti) Object.assign(iEkzistenti, b, { burimi: 'cloud', emriKerkim: kyçi });
    else bizneset.push({ ...b, burimi: 'cloud', emriKerkim: kyçi });
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

// Lidhja EMBED (lejohet brenda iframe/paneli — përdoret kur shtesa 1 bllokohet)
export function merrMapsUrlEmbed(biznesi) {
  if (biznesi.lat && biznesi.lng) {
    return `https://www.google.com/maps?q=${biznesi.lat},${biznesi.lng}&z=15&output=embed`;
  }
  const pyetja = [biznesi.emri, biznesi.adresa, biznesi.qyteti, 'Kosovë'].filter(Boolean).join(', ');
  return `https://www.google.com/maps?q=${encodeURIComponent(pyetja)}&output=embed`;
}
