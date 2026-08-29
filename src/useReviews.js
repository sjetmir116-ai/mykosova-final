import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc, increment, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';

// ===== REVIEWS (vlerësimet me tekst) =====
// Koleksioni: reviews = { biznesiEmri, emri, tekst, yje, foto, koha, uid, raportuar, ndermuesit }
// (email-i s'ruhet — S1-pika5: dokumenti është publike)
// Kyçet me biznesiEmri (funcionon për lokale + cloud)

export function useReviews(biznesiEmri) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!biznesiEmri) return;
    const q = query(collection(db, 'reviews'), where('biznesiEmri', '==', biznesiEmri));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.koha?.toMillis?.() || 0) - (a.koha?.toMillis?.() || 0));
        setReviews(lista);
        setLoading(false);
      },
      (err) => {
        console.warn('Reviews s\u2019u arrit:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [biznesiEmri]);

  // Mesatarja e yjeve nga reviews (ose null nëse s'ka)
  const mesatarja = reviews.length
    ? reviews.reduce((s, r) => s + Number(r.yje || 0), 0) / reviews.length
    : null;

  return { reviews, loading, mesatarja };
}

// Shton një review (me foto opsionale, spec U23) + raporton
// ANTI-SPAM (spec S18): maksimum 3 vlerësime/përdorues/biznes
export async function shtoReview({ biznesiEmri, emri, tekst, yje, uid, email, foto }) {
  if (uid && uid !== 'anonim') {
    const snap = await getDocs(query(collection(db, 'reviews'), where('uid', '==', uid)));
    const perKyBiznes = snap.docs.filter((d) => d.data().biznesiEmri === String(biznesiEmri)).length;
    if (perKyBiznes >= 3) {
      throw new Error('Keni arritur kufirin e 3 vlerësimeve për këtë biznes.');
    }
  }
  // SHËNIM SIGURIE (S1-pika5): email-i SË RUHET te dokumenti i review-it
  // (dokumenti është publike — rules s'mund të maskojnë fushat te read).
  // Moderimi vazhdon: fusha 'raportuar' + leximi nga admini.
  return addDoc(collection(db, 'reviews'), {
    biznesiEmri: String(biznesiEmri),
    emri: emri || 'Anonim',
    tekst: String(tekst).trim(),
    yje: Number(yje),
    foto: String(foto || '').trim(),
    uid: uid || 'anonim',
    raportuar: 0,
    ndermuesit: [],
    koha: serverTimestamp(),
  });
}

export function raportoReview(reviewId) {
  return updateDoc(doc(db, 'reviews', reviewId), { raportuar: increment(1) });
}

// "NDIHMROI?" — toggle votë sipas uid (çdo përdorues 1 votë/review)
export function votoNdermues(reviewId, uid) {
  if (!uid || uid === 'anonim') return Promise.reject(new Error('Hyhuni për të votuar.'));
  const doku = doc(db, 'reviews', reviewId);
  // Lexon nëse ka votuar tashmë → toggle
  return getDoc(doku).then((snap) => {
    const uds = snap.data()?.ndermuesit || [];
    const kaVotuar = uds.includes(uid);
    return updateDoc(doku, {
      ndermues: kaVotuar ? arrayRemove(uid) : arrayUnion(uid),
    });
  });
}
