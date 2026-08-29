import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { regjistroAudit } from './audit';

// ===== BOOKING (spec K1-K8) =====
// Koleksioni: bookings = {
//   biznesiEmri, biznesiId, lloji ('hotel'|'restorant'|'aktivitet'),
//   data (yyyy-mm-dd), ora, guest, dhoma, shenim,
//   përdoruesiUid, përdoruesiEmri, përdoruesiEmail,
//   uidPronari, status ('pendshe'|'konfirmuar'|'anuluar'), koha
// }
// Fluxi: përdoruesi krijon (pendshe) → biznesi/admini konfirmon ose anulon

// Liston bookings sipas filtrit: biznesiEmri OSE përdoruesiUid
export function useBookings({ biznesiEmri = null, përdoruesiUid = null } = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!biznesiEmri && !përdoruesiUid) return;
    let q;
    if (biznesiEmri) q = query(collection(db, 'bookings'), where('biznesiEmri', '==', biznesiEmri));
    else q = query(collection(db, 'bookings'), where('përdoruesiUid', '==', përdoruesiUid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(b.data).localeCompare(String(a.data)));
        setBookings(lista);
        setLoading(false);
      },
      (err) => {
        console.warn('Bookings s\u2019u arrit:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [biznesiEmri, përdoruesiUid]);

  return { bookings, loading };
}

// Krijon një booking (status: pendshe)
export function shtoBooking({ biznesi, lloji, data, ora, guest, dhoma, shenim, përdoruesi }) {
  return addDoc(collection(db, 'bookings'), {
    biznesiEmri: biznesi.emri,
    biznesiId: typeof biznesi.id === 'string' ? biznesi.id : null,
    lloji,
    data: String(data),
    ora: String(ora || ''),
    guest: Number(guest || 2),
    dhoma: String(dhoma || ''),
    shenim: String(shenim || ''),
    përdoruesiUid: përdoruesi?.uid || 'anonim',
    përdoruesiEmri: përdoruesi?.emri || 'Përdorues',
    përdoruesiEmail: përdoruesi?.email || '',
    uidPronari: biznesi.uidPronari || 'anonim',
    status: 'pendshe',
    koha: serverTimestamp(),
  });
}

// Ndryshon statusin (konfirmim/anulim) — biznesi ose admini
export function ndryshoStatusBooking(bookingId, statusi) {
  return updateDoc(doc(db, 'bookings', bookingId), {
    status: statusi,
    statusPerditësuar: serverTimestamp(),
  }).then(() => regjistroAudit('booking_' + statusi, { bookingId }));
}
