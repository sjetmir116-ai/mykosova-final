import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { regjistroAudit } from '../audit';

// ===== MENAXHIMI I PËRDORUESVE (spec A9, A10) =====
// Lista e përdoruesve + ndryshim roli (admin/moderator/user/pezullim)
function Perdoruesit() {
  const { darkMode } = useContext(AppContext);
  const [përdoruesit, setPërdoruesit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kerkimi, setKerkimi] = useState('');
  const [mesazhi, setMesazhi] = useState('');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'përdoruesit'),
      (snap) => {
        setPërdoruesit(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('Përdoruesit s\u2019u arritën:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const teFiltruara = përdoruesit.filter((p) =>
    !kerkimi ||
    String(p.emri || '').toLowerCase().includes(kerkimi.toLowerCase()) ||
    String(p.email || '').toLowerCase().includes(kerkimi.toLowerCase())
  );

  const ndryshoRolin = async (p, roliIri) => {
    const konfirmim = roliIri === 'iPezulluar'
      ? `Pezullo llogarinë ${p.email}?`
      : roliIri === 'admin'
        ? `Bëj ${p.email} ADMIN? (kontroll i plotë)`
        : null;
    if (konfirmim && !window.confirm(konfirmim)) return;
    try {
      await updateDoc(doc(db, 'përdoruesit', p.id), { roli: roliIri, perditësuarM: serverTimestamp() });
      regjistroAudit('perdoruesi_rol_i', { email: p.email, roli: roliIri });
      setMesazhi(`✅ ${p.email} → ${roliIri}`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const ngjyraRolit = (r) => r === 'admin' ? '#dc2626' : r === 'moderator' ? '#f59e0b' : r === 'iPezulluar' ? '#6b7280' : '#3b82f6';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>👥 Përdoruesit</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          {përdoruesit.length} llogari · Ndrysho rolet (admin / moderator / user / pezullim)
        </p>
      </div>

      {mesazhi && (
        <div style={{ padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', backgroundColor: mesazhi.startsWith('✅') ? '#16a34a15' : '#ef444415', color: mesazhi.startsWith('✅') ? '#16a34a' : '#ef4444', border: `1px solid ${mesazhi.startsWith('✅') ? '#16a34a40' : '#ef444440'}` }}>
          {mesazhi}
        </div>
      )}

      <input value={kerkimi} onChange={(e) => setKerkimi(e.target.value)} placeholder="🔍 Kërko sipas emrit ose email-it..."
        style={{ padding: '11px 16px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none' }} />

      {loading ? (
        <p style={{ color: '#8e8e93' }}>Duke ngarkuar...</p>
      ) : teFiltruara.length === 0 ? (
        <p style={{ color: '#8e8e93' }}>Asnjë përdorues për këtë kërkim.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {teFiltruara.map((p) => (
            <div key={p.id} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <b style={{ fontSize: '14px', color: stiliTekstit }}>{p.emri}</b>
                <span style={{ fontSize: '12px', fontWeight: '800', color: ngjyraRolit(p.roli), marginLeft: '10px', textTransform: 'uppercase' }}>{p.roli}</span>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#8e8e93' }}>
                  {p.email} · regjistruar: {p.krijuarM?.toDate ? p.krijuarM.toDate().toLocaleDateString('sq-AL') : '—'}
                </p>
              </div>
              <select value={p.roli} onChange={(e) => ndryshoRolin(p, e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#ffffff', color: stiliTekstit, fontSize: '13px', cursor: 'pointer' }}>
                <option value="user">👤 User</option>
                <option value="moderator">🛡️ Moderator</option>
                <option value="admin">⚙️ Admin</option>
                <option value="iPezulluar">⛔ I pezulluar</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Perdoruesit;
