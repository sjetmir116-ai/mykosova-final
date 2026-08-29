import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// ===== OFERTAT (spec B8, D10) =====
// Koleksioni: offers = { biznesiEmri, lloji, teksti, cmimiVjete, cmimiIri, vlenDeri (yyyy-mm-dd), koha }
// Oferta aktivese: vlenDeri >= sot

// A është oferta ende aktive?
export function esOfertaAktive(oferta) {
  if (!oferta.vlenDeri) return true; // pa skadencë = e përhershme
  const sot = new Date().toISOString().split('T')[0];
  return String(oferta.vlenDeri) >= sot;
}

export function useOfertat(biznesiEmri) {
  const [ofertat, setOfertat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!biznesiEmri) return;
    const q = query(collection(db, 'offers'), where('biznesiEmri', '==', biznesiEmri));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(b.vlenDeri || '9999').localeCompare(String(a.vlenDeri || '9999')));
        setOfertat(lista);
        setLoading(false);
      },
      (err) => {
        console.warn('Ofertat s\u2019u arritën:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [biznesiEmri]);

  const aktive = ofertat.filter(esOfertaAktive);
  const skaduar = ofertat.filter((o) => !esOfertaAktive(o));

  return { ofertat, aktive, skaduar, loading };
}

// TË GJITHA ofertat (faqja "Ofertat" — Faza 3.3) — live sync nga i gjithë koleksioni
export function useOfertatTeGjitha() {
  const [ofertat, setOfertat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'offers'),
      (snap) => {
        setOfertat(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('Ofertat s\u2019u arritën:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const aktive = ofertat.filter(esOfertaAktive);
  const skaduar = ofertat.filter((o) => !esOfertaAktive(o));
  return { ofertat, aktive, skaduar, loading };
}

// SIGURIA (S1-pika7): ruhet uidPronari që rules v2 ta kufizojë shkrimin
// vetëm te pronari i atij biznesi
export function shtoOferta({ biznesiEmri, uidPronari, lloji, teksti, cmimiVjete, cmimiIri, vlenDeri }) {
  return addDoc(collection(db, 'offers'), {
    biznesiEmri: String(biznesiEmri),
    uidPronari: String(uidPronari || 'anonim'),
    lloji: lloji || 'zbritje',
    teksti: String(teksti || '').trim(),
    cmimiVjete: cmimiVjete ? Number(cmimiVjete) : null,
    cmimiIri: cmimiIri ? Number(cmimiIri) : null,
    vlenDeri: String(vlenDeri || ''),
    koha: serverTimestamp(),
  });
}

export function fshiOfertu(offerId) {
  return deleteDoc(doc(db, 'offers', offerId));
}
