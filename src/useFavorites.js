import { useEffect, useState, useContext } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { AppContext } from './AppContext';

// ===== FAVORITES (të ruajturat) =====
// Struktura: favorites/{uid} = { uid, bizneset: [emri...], perditësuar }
// Kyçet me EMRI (funcionon edhe për bizneset lokale pa dokument cloud)

export function useFavorites() {
  const { përdoruesi } = useContext(AppContext);
  const [ruajtur, setRuajtur] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!përdoruesi) {
      setRuajtur([]);
      setLoading(false);
      return;
    }
    const doku = doc(db, 'favorites', përdoruesi.uid);
    const unsub = onSnapshot(
      doku,
      (snap) => {
        setRuajtur(snap.exists() ? snap.data().bizneset || [] : []);
        setLoading(false);
      },
      (err) => {
        console.warn('Favorites s\u2019u arrit:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [përdoruesi?.uid]);

  const esRuajtur = (emri) => ruajtur.some((r) => r.toLowerCase() === String(emri).toLowerCase());

  const alterno = async (emri) => {
    if (!përdoruesi) return { sukses: false, mesazhi: 'Hyreni për t\u2019u ruajtur favorites.' };
    try {
      const aktuale = esRuajtur(emri) ? arrayRemove(emri) : arrayUnion(emri);
      await setDoc(
        doc(db, 'favorites', përdoruesi.uid),
        { uid: përdoruesi.uid, bizneset: aktuale, perditësuar: serverTimestamp() },
        { merge: true }
      );
      return { sukses: true };
    } catch (err) {
      console.error('Gabim favorites:', err);
      return { sukses: false, mesazhi: err.message };
    }
  };

  return { ruajtur, esRuajtur, alterno, loading, duhshHyrje: !përdoruesi };
}
