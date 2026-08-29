import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

// Komponenta e yjeve të vlerësimit:
// - Tregon vlerësimin aktual (yllatNumer) të biznesit nga Firestore (live)
// - Klikohet një yll → ruhet menjëherë në bazën e të dhënave
function RatingStars({ biznesiId, vleresimiAktual }) {
  const [vleresimi, setVleresimi] = useState(vleresimiAktual || 0);
  const [dukeRuajtur, setDukeRuajtur] = useState(false);

  // Përditësim live nga Firestore që çdo vizitues të shohë vlerësimin e fundit
  useEffect(() => {
    if (!biznesiId) return;
    const doku = doc(db, 'bizneset', biznesiId);
    const unsub = onSnapshot(doku, (snap) => {
      if (snap.exists()) {
        const yllat = snap.data().yllatNumer;
        if (typeof yllat === 'number') setVleresimi(yllat);
      }
    });
    return () => unsub();
  }, [biznesiId]);

  const vlereso = async (vlera) => {
    if (!biznesiId || dukeRuajtur) return;
    setDukeRuajtur(true);
    setVleresimi(vlera); // feedback i menjëhershëm
    try {
      await updateDoc(doc(db, 'bizneset', biznesiId), { yllatNumer: vlera });
    } catch (e) {
      console.error('Gabim në ruajtjen e vlerësimit:', e);
    } finally {
      setDukeRuajtur(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }} title="Kliko një yll për të vlerësuar këtë biznes">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => vlereso(i)}
          style={{
            fontSize: '20px',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'transform 0.1s',
            transform: i <= Math.round(vleresimi) ? 'scale(1)' : 'scale(0.92)',
            filter: i <= Math.round(vleresimi) ? 'none' : 'grayscale(1) opacity(0.45)',
          }}
        >
          ⭐
        </span>
      ))}
      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#b45309', marginLeft: '4px' }}>
        {vleresimi ? Number(vleresimi).toFixed(1) : '—'}
      </span>
    </div>
  );
}

export default RatingStars;
