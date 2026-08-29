import { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// ===== PAKETAT E BIZNESEVE (spec B13-B17) =====
// Çmimet dhe features NUK janë hard-coded — admini i ndryshon nga Paneli → Paketa
// (koleksion packages/global). Fallback lokal nëse s'ka dokument.

export const PAKETA_LOKALE = {
  basic: {
    emri: 'BASIC',
    ngjyra: '#16a34a',
    ikona: '🟢',
    cmimi: 0,
    period: 'muaj',
    features: ['Profil biznesi', 'Emër + Kategori', 'Lokacion + Navigo', 'Telefon', 'Orari', 'Deri 3 foto', 'Listimi në kërkim'],
    limitet: { foto: 3, oferta: 0 },
  },
  gold: {
    emri: 'GOLD',
    ngjyra: '#f59e0b',
    ikona: '🟡',
    cmimi: 29,
    period: 'muaj',
    features: ['Gjithçka nga Basic', 'Foto të pamatura', 'WhatsApp + Website', 'Social media', 'Përshkrim i avancuar', 'Oferta aktivizuar', 'Featured te rezultatat', 'Statistika bazë', 'Prioritet në kërkim'],
    limitet: { foto: 99, oferta: 5 },
  },
  premium: {
    emri: 'PREMIUM',
    ngjyra: '#dc2626',
    ikona: '🔴',
    cmimi: 59,
    period: 'muaj',
    features: ['Gjithçka nga Gold', 'Featured profile', 'Prioritet maksimal në kërkim', 'Vendosje në faqen kryesore', 'Premium badge', 'Oferta speciale + Booking', 'Advanced analytics', 'Leads / mesazhe', 'Click + Call + WhatsApp stats', 'Campaign management'],
    limitet: { foto: 999, oferta: 99 },
  },
};

// Përdor paketat nga Firestore (packages/global) me fallback lokal
export function usePaketa() {
  const [paketa, setPaketa] = useState(PAKETA_LOKALE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'packages', 'global'),
      (snap) => {
        if (snap.exists()) {
          // Dokumenti mund të ketë vetëm çmimet (admini i ndryshon) — features nga lokal
          const ngaDb = snap.data();
          const teBashkuara = {};
          for (const kyç of ['basic', 'gold', 'premium']) {
            teBashkuara[kyç] = {
              ...PAKETA_LOKALE[kyç],
              ...(ngaDb[kyç] || {}),
            };
          }
          setPaketa(teBashkuara);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Paketa nga DB s\u2019u arrit — fallback lokal:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { paketa, loading };
}

// Rendi i paketas (për featured positioning në kërkim)
// Sponsored (M2/M4) merr vendin e parë, pastaj Premium > Gold > Basic
export function rendiPaketes(biznesi) {
  if (biznesi.sponsoruar) return -1;
  switch (biznesi.paketa) {
    case 'premium': return 0;
    case 'gold': return 1;
    default: return 2;
  }
}
