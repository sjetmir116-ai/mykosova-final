import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// ===== ATRAKSIONET TURISTIKE (spec T2) + QBRETI E QYTEVE (spec T1) =====
// Nga Firestore (attractions — i menaxhueshëm nga admini) me fallback lokal.

export const QYTETET_E_KOSOVES = [
  { emri: 'Prishtinë', ikona: '🏛️', pershkrimi: 'Kryeqyteti — Kulla e Re, Grand Park, Muzeu Historik, qendrat tregtare dhe jetë natën.' },
  { emri: 'Prizren', ikona: '🏰', pershkrimi: 'Perla e Kosovës — Kalaja, Shadrvani, Xhamia e Sinjtë, filigrani, kafet e vjetra.' },
  { emri: 'Pejë', ikona: '🏔️', pershkrimi: 'Deri te Rugova dhe Ujmani — natyra malore, shoshenat, turizmi alpin.' },
  { emri: 'Gjakovë', ikona: '🕌', pershkrimi: 'Qyteti i xhamive — xhami të shekullit XV, kisha me mozaqe, tregu traditional.' },
  { emri: 'Ferizaj', ikona: '🌉', pershkrimi: 'Deri te Liqeni i Ferizajt dhe Kalaja e Kamenicës — histori romake.' },
  { emri: 'Gjilan', ikona: '🎭', pershkrimi: 'Qyteti artistik — Teatri, Muzeu, Liqeni i Gjilanit.' },
  { emri: 'Mitrovicë', ikona: '⚓', pershkrimi: 'Qyteti i urave — ura mbi Ibar, Kalaja, tradita bizantine.' },
  { emri: 'Suharekë', ikona: '', pershkrimi: 'Porta e Therandës — qendër malore me restorante tradicionalë.' },
  { emri: 'Lipjan', ikona: '', pershkrimi: 'Dera e Hartzës — bujqësi, fshatra, natyra e hapur.' },
  { emri: 'Vushtrri', ikona: '⛰️', pershkrimi: 'Deri te Bjeshkët e Nemuna — shtigje legjendare dhe natyrë e paprekur.' },
];

const ATRAKSIONET_LOKALE = [
  {
    emri: 'Gryka e Rugovës', qyteti: 'Pejë', kategoria: 'Bjeshkë', ikona: '🏔️',
    lat: 42.5833, lng: 20.5544,
    pershkrimi: 'Pika numër 1 malore e Kosovës — shtigje legjendare për ecje, natyrë e mbrapshtme dhe ambiente tradicionale. Rrugica e Rugovës është një nga rrugët më të bukura ballkanike.',
    foto: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Ecje malore, foto-turizëm, ambiente tradicionale',
  },
  {
    emri: 'Kalaja e Prizrenit', qyteti: 'Prizren', kategoria: 'Monumente', ikona: '🏰',
    lat: 42.2569, lng: 20.7843,
    pershkrimi: 'Kalaja mesjetare mbi kodrën e Prizrenit — pamje panoramike 360° e qytetit, mure 800-vjeçare dhe kisha e shën Gjinit brenda kalasë.',
    foto: 'https://images.unsplash.com/photo-1541842578-679cb9c70879?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Histori, pamje panoramike, foto',
  },
  {
    emri: 'Liqeni i Ujmanit', qyteti: 'Pejë', kategoria: 'Liqene', ikona: '💧',
    lat: 42.5833, lng: 20.4167,
    pershkrimi: 'Liqeni malor më i thellë i Ballkanit (deri 180 m) me ujë të kristalshëm — pikënisje për shoshenat dhe shtigjet alpine.',
    foto: 'https://images.unsplash.com/photo-1437482078695-73f5ca5c902e?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Ecje, kanoe, kamp, natyrë',
  },
  {
    emri: 'Thethi', qyteti: 'Lipjan', kategoria: 'Fshatra', ikona: '🏘️',
    lat: 42.5500, lng: 20.1500,
    pershkrimi: 'Fshati legjendar alban — shtëpi tradicionale me gur, ujëvara, shtegjet e thëna me gur dhe mikpritje unike. Deri te liqeni i Thethit.',
    foto: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Ecje alpine, kulturë, natyrë',
  },
  {
    emri: 'Shadrvani i Prizrenit', qyteti: 'Prizren', kategoria: 'Monumente', ikona: '⛲',
    lat: 42.2600, lng: 20.7850,
    pershkrimi: 'Funtana e shekullit XVIII në sheshin kryesor — zemra e jetës së qytetit mes kafeneve, restoranteve dhe teatrit.',
    foto: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Kafe, shëtitje, jetë qytetare',
  },
  {
    emri: 'Muzeu Historik i Prizrenit', qyteti: 'Prizren', kategoria: 'Muze', ikona: '🏛️',
    lat: 42.2610, lng: 20.7860,
    pershkrimi: 'Koleksione arkeologjike dhe etnografike — historia e Prizrenit nga kohët e lashta deri te sot, me seksionin e filigranit.',
    foto: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Kulturë, histori, edukim',
  },
  {
    emri: 'Ujëvara e Fushesë', qyteti: 'Vushtrri', kategoria: 'Ujëvara', ikona: '🌊',
    lat: 42.7167, lng: 20.9167,
    pershkrimi: 'Ujëvara më e lartë e Kosovës brenda Bjeshkëve të Nemuna — rreth 15 metra, e mbyllur nga pyje pisha.',
    foto: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Ecje, foto, natyrë',
  },
  {
    emri: 'Grand Park Prishtinë', qyteti: 'Prishtinë', kategoria: 'Parqe', ikona: '🌳',
    lat: 42.6610, lng: 21.1570,
    pershkrimi: 'Parku modern me liqen artificial, shtigje për ecje dhe biciklet, kafene — zemra e pushimeve të Prishtinës.',
    foto: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Pushim, ecje, kafene',
  },
  {
    emri: 'Kalaja e Gjakovës', qyteti: 'Gjakovë', kategoria: 'Monumente', ikona: '🏯',
    lat: 42.3294, lng: 20.8808,
    pershkrimi: 'Kalaja me xhami të shekullit XV — një nga komplekset më të rëndësishme otomane në Ballkan, me 4 xhami brenda mureve.',
    foto: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Histori, xhami, foto',
  },
  {
    emri: 'Liqeni i Preshevës', qyteti: 'Lipjan', kategoria: 'Liqene', ikona: '🦆',
    lat: 42.6167, lng: 21.3000,
    pershkrimi: 'Zonë e lagësht liqeni me të pulave uji — pikë për shëtitje natyrore, kanoe dhe foto.',
    foto: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    aktivitetet: 'Natyrë, kanoe, foto',
  },
];

export function useAttraksioneve() {
  const [ngaDb, setNgaDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gabim, setGabim] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'attractions'),
      (snap) => {
        setNgaDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setGabim(false);
      },
      (err) => {
        console.warn('Attractions s\u2019u arrit — fallback lokal:', err.message);
        setLoading(false);
        setGabim(true);
      }
    );
    return () => unsub();
  }, []);

  // Bashkim: lokale + DB (DB merr parësi sipas emrit)
  const normalizo = (v) => String(v || '').toLowerCase();
  let lista = ATRAKSIOET_LOKALE.map((a) => ({ ...a, burimi: 'lokal' }));
  for (const a of ngaDb) {
    const iEkzistenti = lista.find((l) => normalizo(l.emri) === normalizo(a.emri));
    if (iEkzistenti) Object.assign(iEkzistenti, a, { burimi: 'db' });
    else lista.push({ ...a, burimi: 'db' });
  }

  return { lista, loading, gabim };
}
