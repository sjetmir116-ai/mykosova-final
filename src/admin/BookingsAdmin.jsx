import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { ndryshoStatusBooking } from '../useBookings';

// ===== BOOKINGS ADMIN (spec A12) — të gjitha rezervimet + statuset =====
function BookingsAdmin() {
  const { darkMode } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtri, setFiltri] = useState('teGjitha');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const ngarko = () => {
    const q = query(collection(db, 'bookings'), limit(100));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('Bookings s\u2019u arrit:', err.message);
        setLoading(false);
      }
    );
    return unsub;
  };

  useEffect(() => {
    const unsub = ngarko();
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teFiltruara = filtri === 'teGjitha' ? bookings : bookings.filter((b) => b.status === filtri);
  const ngjyraStatusi = { pendshe: '#f59e0b', konfirmuar: '#16a34a', anuluar: '#ef4444' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>📅 Rezervimet</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>Të gjitha rezervimet e platformës (100 të fundit)</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[['teGjitha', 'Të gjitha'], ['pendshe', '⏳ Pendshe'], ['konfirmuar', '✅ Konfirmuar'], ['anuluar', '❌ Anuluar']].map(([id, etiketa]) => (
          <button key={id} onClick={() => setFiltri(id)}
            style={{ padding: '9px 15px', borderRadius: '12px', border: `1px solid ${filtri === id ? '#3b82f6' : korniza}`, backgroundColor: filtri === id ? '#3b82f6' : 'transparent', color: filtri === id ? '#fff' : stiliTekstit, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            {etiketa}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#8e8e93' }}>Duke ngarkuar...</p>
      ) : teFiltruara.length === 0 ? (
        <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#8e8e93' }}>
          Asnjë rezervim për këtë filtr.
        </div>
      ) : (
        teFiltruara.map((b) => (
          <div key={b.id} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <b style={{ fontSize: '14px', color: stiliTekstit }}>🏢 {b.biznesiEmri}</b>
              <span style={{ fontSize: '11px', fontWeight: '800', color: ngjyraStatusi[b.status], marginLeft: '10px', textTransform: 'uppercase' }}>{b.status}</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8e8e93' }}>
                👤 {b.përdoruesiEmri} · 📅 {b.data} {b.ora && `· ${b.ora}`} · 👥 {b.guest}
                {b.lloji && ` · ${b.lloji}`}
              </p>
            </div>
            {b.status === 'pendshe' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => ndryshoStatusBooking(b.id, 'konfirmuar').catch((e) => alert(e.message))}
                  style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  ✓ Konfirmo
                </button>
                <button onClick={() => ndryshoStatusBooking(b.id, 'anuluar').catch((e) => alert(e.message))}
                  style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  ✗ Anulo
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default BookingsAdmin;
