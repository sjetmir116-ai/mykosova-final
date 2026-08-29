import { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { esAdminOse, dali } from '../auth';
import Hyrja from './Hyrja';
import Dashboard from './Dashboard';
import MenaxhoBizneset from './MenaxhoBizneset';
import Kontenti from './Kontenti';
import AuditLog from './AuditLog';
import BookingsAdmin from './BookingsAdmin';
import PaketaAdmin from './PaketaAdmin';
import Perdoruesit from './Perdoruesit';

// PANELI ADMIN — /admin
// Guard: vetëm role 'admin' / 'moderator' / 'super_admin' (nga Firebase Auth + koleksioni përdoruesit)
function AdminLayout() {
  const { darkMode, përdoruesi } = useContext(AppContext);
  const navigate = useNavigate();
  const [seksioni, setSeksioni] = useState('dashboard');

  // Pa përdorues → Hyrja; me përdorues por pa role admin → mesazh
  if (!përdoruesi) {
    return <Hyrja />;
  }

  if (!esAdminOse(përdoruesi.roli)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: darkMode ? '#111827' : '#f3f4f6', padding: '20px' }}>
        <div style={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderRadius: '24px', padding: '35px 30px', maxWidth: '420px', width: '100%', textAlign: 'center', border: `1px solid ${darkMode ? '#2d2d2d' : '#e5e7eb'}` }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>Nuk keni akses</h2>
          <p style={{ fontSize: '14px', color: '#8e8e93', marginBottom: '20px' }}>
            Llogaria <b>{përdoruesi.email}</b> nuk ka rol admin.
            Për akses kërko nga administratori.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/')} style={{ padding: '11px 18px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: darkMode ? '#fff' : '#111827', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              ← Kthehu te app-i
            </button>
            <button onClick={() => dali().catch(() => {})} style={{ padding: '11px 18px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              Dal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';

  const itemsi = [
    { id: 'dashboard', emri: '📊 Dashboardi' },
    { id: 'menaxhim', emri: '🗂️ Menaxho Bizneset' },
    { id: 'rezervimet', emri: '📅 Rezervimet' },
    { id: 'paketa', emri: '💳 Paketa' },
    { id: 'perdoruesit', emri: '👥 Përdoruesit' },
    { id: 'kontenti', emri: '📦 Kontenti' },
    { id: 'auditi', emri: '📜 Audit Log' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#111827' : '#f3f4f6', fontFamily: 'system-ui, sans-serif', display: 'flex', flexWrap: 'wrap' }}>
      {/* Sidebar */}
      <aside style={{ width: '230px', minWidth: '230px', backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderRight: `1px solid ${korniza}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '24px' }}>🇽</span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: stiliTekstit }}>MyKosova</div>
            <div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600' }}>PANELI ADMIN</div>
          </div>
        </div>

        {itemsi.map((s) => (
          <button key={s.id} onClick={() => setSeksioni(s.id)}
            style={{ textAlign: 'left', padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
              backgroundColor: seksioni === s.id ? '#3b82f6' : 'transparent', color: seksioni === s.id ? '#fff' : stiliTekstit, transition: 'background 0.15s' }}>
            {s.emri}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ borderTop: `1px solid ${korniza}`, paddingTop: '14px', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: stiliTekstit, overflow: 'hidden', textOverflow: 'ellipsis' }}>👤 {përdoruesi.emri}</div>
          <div style={{ fontSize: '11px', color: '#8e8e93', overflow: 'hidden', textOverflow: 'ellipsis' }}>{përdoruesi.email}</div>
          <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#dc262620', color: '#dc2626', textTransform: 'uppercase' }}>
            {përdoruesi.roli}
          </span>
        </div>
        <button onClick={() => dali().then(() => navigate('/')).catch(() => navigate('/'))} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          Dal nga paneli
        </button>
        <button onClick={() => navigate('/')} style={{ padding: '10px 14px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: '#8e8e93', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          ← Kthehu te app-i
        </button>
      </aside>

      {/* Përmbajtja */}
      <main style={{ flex: 1, minWidth: '300px', padding: '28px', maxWidth: '1100px' }}>
        {seksioni === 'dashboard' && <Dashboard onNav={setSeksioni} />}
        {seksioni === 'menaxhim' && <MenaxhoBizneset />}
        {seksioni === 'rezervimet' && <BookingsAdmin />}
        {seksioni === 'paketa' && <PaketaAdmin />}
        {seksioni === 'perdoruesit' && <Perdoruesit />}
        {seksioni === 'kontenti' && <Kontenti />}
        {seksioni === 'auditi' && <AuditLog />}
      </main>
    </div>
  );
}

export default AdminLayout;
