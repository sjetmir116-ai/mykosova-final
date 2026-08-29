import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { QYTETET_E_KOSOVES } from './attraksionet';

// ===== TRIP PLANNER (spec T3, T4, T8) =====
// SIGURIA (S1-pika3): subcollection trips/{uid}/{tripId} — path-i vetë e kufizon
// çdo akses te pronari (mbyllje totale e list-exposure-së; s'ka të dhëna për migrim)

export function useTrips(uid) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const q = collection(db, 'trips', uid);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('Trips s\u2019u arrit:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  const ruajTrip = (trip) => addDoc(collection(db, 'trips', uid), { ...trip, uid, koha: serverTimestamp() });
  const fshiTrip = (tripId) => deleteDoc(doc(db, 'trips', uid, tripId));

  return { trips, loading, ruajTrip, fshiTrip };
}

// GJENERATORI I ITINERARIT — ndërton N-ditore nga të dhënat reale (spec T4)
// Merr: numri i ditëve, qytetet e zgjedhura (ose automatik), biznese (hotela/restorante), atraksione
export function gjeneroItinerarin({ ditet, qytetetZgjedhura, bizneset, attraksionet }) {
  const qytetet = qytetetZgjedhura?.length
    ? QYTETET_E_KOSOVES.filter((q) => qytetetZgjedhura.includes(q.emri))
    : QYTETET_E_KOSOVES.slice(0, ditet); // default: qytetet kryesore

  const itinerari = [];
  for (let d = 0; d < ditet; d++) {
    const qyteti = qytetet[d % qytetet.length];
    const atraksionetEne = attraksionet
      .filter((a) => a.qyteti === qyteti.emri)
      .slice(0, 3);
    const hotel = bizneset.find((b) => (b.kategoria || '').toLowerCase().includes('hotel') && b.qyteti === qyteti.emri)
      || bizneset.find((b) => (b.kategoria || '').toLowerCase().includes('hotel'));
    const restorant = bizneset.find((b) => (b.kategoria || '').toLowerCase().includes('restorant') && b.qyteti === qyteti.emri)
      || bizneset.find((b) => (b.kategoria || '').toLowerCase().includes('restorant'));

    itinerari.push({
      dita: d + 1,
      qyteti: qyteti.emri,
      pikat: atraksionetEne.length ? atraksionetEne.map((a) => a.emri) : ['Zbuloni qytetin — shëtitje qendrore'],
      hotel: hotel ? hotel.emri : 'Zgjidhni hotelin te MyKosova',
      restorant: restorant ? restorant.emri : 'Zgjidhni restorantin te MyKosova',
    });
  }
  return itinerari;
}
