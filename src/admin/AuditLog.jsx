import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

// AUDIT LOG — çdo veprim kritik: KUSH + KUR + ÇFARË (spec S34, S35, A24)
function AuditLog() {
  const { darkMode } = useContext(AppContext);
  const [teDhenat, setTeDhenat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('koha', 'desc'), limit(100));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTeDhenat(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('Audit log s\u2019u arrit (mundësisht mungon index për "koha"):', err.message);
        // Fallback pa orderBy nëse mungon index-i
        const q2 = query(collection(db, 'auditLogs'), limit(100));
        const unsub2 = onSnapshot(q2, (snap2) => {
          const lista = snap2.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.koha?.toMillis?.() || 0) - (a.koha?.toMillis?.() || 0));
          setTeDhenat(lista);
          setLoading(false);
        });
        return () => { unsub(); unsub2(); };
      }
    );
    return () => unsub();
  }, []);

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const ngjyraVeprimit = (v) => {
    if (['fshirje', 'rifuzim', 'dalje'].some((x) => v.includes(x))) return '#ef4444';
    if (['hyrje', 'regjistrim'].some((x) => v.includes(x))) return '#3b82f6';
    if (['miratim', 'shtim'].some((x) => v.includes(x))) return '#16a34a';
    return '#8e8e93';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Audit Log 📜</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          Çdo veprim kritik i regjistruar: kush + kur + çfarë · (100 veprimet e fundit)
        </p>
      </div>

      <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '16px' }}>
        {loading ? (
          <p style={{ color: '#8e8e93', fontSize: '14px' }}>Duke ngarkuar...</p>
        ) : teDhenat.length === 0 ? (
          <p style={{ color: '#8e8e93', fontSize: '14px' }}>Ende asnjë veprim i regjistruar.</p>
        ) : (
          teDhenat.map((a) => (
            <div key={a.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${korniza}`, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: ngjyraVeprimit(a.veprimi), backgroundColor: ngjyraVeprimit(a.veprimi) + '18', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {a.veprimi}
              </span>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: stiliTekstit }}>{a.email}</div>
                <div style={{ fontSize: '12px', color: '#8e8e93', marginTop: '2px' }}>
                  {a.detajet && Object.keys(a.detajet).length > 0 &&
                    Object.entries(a.detajet).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: '#8e8e93', whiteSpace: 'nowrap' }}>
                {a.koha?.toDate ? a.koha.toDate().toLocaleString('sq-AL') : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuditLog;
