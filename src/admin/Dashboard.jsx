import { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { useBizneset } from '../useBizneset';
import { biznesetFillestare } from '../teDhenat';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { regjistroAudit } from '../audit';

function Dashboard({ onNav }) {
  const { darkMode } = useContext(AppContext);
  const { bizneset, loading, gabim } = useBizneset({ vetemAprovuar: false });
  const [dukeSinkronizuar, setDukeSinkronizuar] = useState(false);
  const [mesazhi, setMesazhi] = useState('');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const tePendshe = bizneset.filter((b) => b.status === 'pendshe');
  const teAprovuar = bizneset.filter((b) => b.status !== 'pendshe');
  const mesatarja = teAprovuar.length
    ? (teAprovuar.reduce((shuma, b) => shuma + Number(b.vleresimi || b.yllatNumer || 0), 0) / teAprovuar.length).toFixed(2)
    : '—';

  const sipasKategorise = {};
  const sipasQytetit = {};
  for (const b of teAprovuar) {
    const k = b.kategoria || 'Pa kategori';
    const q = b.qyteti || 'Pa qytet';
    sipasKategorise[k] = (sipasKategorise[k] || 0) + 1;
    sipasQytetit[q] = (sipasQytetit[q] || 0) + 1;
  }

  const teFushat = [...bizneset].sort((a, b) => (b.krijuarM || '').localeCompare(a.krijuarM || '')).slice(0, 5);
  const biznesetLokale = bizneset.filter((b) => b.burimi === 'lokal');

  // Ngarkon në cloud bizneset që ekzistojnë vetëm si lokale (pa dokument Firestore)
  const sinkronizoBazen = async () => {
    setDukeSinkronizuar(true);
    setMesazhi('');
    try {
      let shtuar = 0;
      for (const b of biznesetFillestare) {
        const ekziston = await getDocs(query(collection(db, 'bizneset'), where('emri', '==', b.emri)));
        if (ekziston.size === 0) {
          await addDoc(collection(db, 'bizneset'), {
            ...b,
            status: 'aprovar',
            krijuarM: new Date().toISOString(),
            shtuarMNga: 'Sistemi (bazë fillestare)',
          });
          shtuar++;
        }
      }
      if (shtuar > 0) regjistroAudit('sinkronizim_baze', { numri: shtuar });
      setMesazhi(shtuar > 0 ? `✅ ${shtuar} biznese u ngarkuan në cloud — tani mund t'i menaxhoni.` : '✅ Baza është e sinkronizuar — s\u2019ka asgjë e re për ngarkim.');
    } catch (err) {
      console.error('Gabim në sinkronizim:', err);
      setMesazhi('❌ Gabim: ' + err.message);
    } finally {
      setDukeSinkronizuar(false);
    }
  };

  const kartela = { backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '18px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Dashboardi 📊</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>Përmbledhja e të gjitha të dhënave të MyKosova</p>
      </div>

      {gabim && (
        <div style={{ ...kartela, backgroundColor: '#ff3b3015', border: '1px solid #ff3b3040', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ S'u arrit Firebase nga kjo rrjetë — statistikat janë vetëm nga të dhënat lokale.
        </div>
      )}

      {/* Kartelat kryesore */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
        <div style={kartela}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase' }}>Biznese totale</div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: stiliTekstit, marginTop: '4px' }}>{loading ? '…' : bizneset.length}</div>
        </div>
        <div style={kartela}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase' }}>Aprovuar</div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>{loading ? '…' : teAprovuar.length}</div>
        </div>
        <div style={kartela}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase' }}>Për miratim</div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: tePendshe.length > 0 ? '#f59e0b' : stiliTekstit, marginTop: '4px' }}>
            {loading ? '…' : tePendshe.length}
          </div>
          {tePendshe.length > 0 && (
            <button onClick={() => onNav('menaxhim')} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
              → Menaxhoni tani
            </button>
          )}
        </div>
        <div style={kartela}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase' }}>Mesatarja e yjeve</div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>⭐ {mesatarja}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {/* Sipas kategorisë */}
        <div style={kartela}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>Sipas kategorisë</h3>
          {Object.keys(sipasKategorise).length === 0 ? (
            <p style={{ color: '#8e8e93', fontSize: '13px' }}>Ende pa të dhëna.</p>
          ) : (
            Object.entries(sipasKategorise).sort((a, b) => b[1] - a[1]).map(([kat, n]) => (
              <div key={kat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${korniza}`, fontSize: '14px', color: stiliTekstit }}>
                <span>{kat}</span>
                <span style={{ fontWeight: '800', color: '#3b82f6' }}>{n}</span>
              </div>
            ))
          )}
        </div>

        {/* Sipas qytetit */}
        <div style={kartela}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>Sipas qytetit</h3>
          {Object.keys(sipasQytetit).length === 0 ? (
            <p style={{ color: '#8e8e93', fontSize: '13px' }}>Ende pa të dhëna.</p>
          ) : (
            Object.entries(sipasQytetit).sort((a, b) => b[1] - a[1]).map(([q, n]) => (
              <div key={q} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${korniza}`, fontSize: '14px', color: stiliTekstit }}>
                <span>📍 {q}</span>
                <span style={{ fontWeight: '800', color: '#3b82f6' }}>{n}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shtimet e fundit */}
      <div style={kartela}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>Shtimet e fundit</h3>
        {teFushat.length === 0 ? (
          <p style={{ color: '#8e8e93', fontSize: '13px' }}>Ende asnjë shtim.</p>
        ) : (
          teFushat.map((b) => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${korniza}`, fontSize: '14px', color: stiliTekstit }}>
              <span>
                🏢 {b.emri}
                <span style={{ color: '#8e8e93', fontSize: '12px', marginLeft: '8px' }}>{b.qyteti}</span>
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: b.status === 'pendshe' ? '#f59e0b' : '#16a34a' }}>
                {b.status === 'pendshe' ? '⏳ Pendshe' : '✅ Approvar'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Sinkronizimi i bazës fillestare */}
      {biznesetLokale.length > 0 && (
        <div style={{ ...kartela, borderColor: '#3b82f6', borderStyle: 'solid' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>☁️ Baza fillestare në cloud</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#8e8e93', lineHeight: 1.5 }}>
            {biznesetLokale.length} biznese ({biznesetLokale.map((b) => b.emri.split(' ')[0]).slice(0, 4).join(', ')}…) ekzistojnë ende vetëm në aplikacion.
            Ngarkojini në cloud për t'i menaxhur (edhje, fshi, mirato) nga ky panel.
          </p>
          <button onClick={sinkronizoBazen} disabled={dukeSinkronizuar}
            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', opacity: dukeSinkronizuar ? 0.7 : 1 }}>
            {dukeSinkronizuar ? 'Duke ngarkuar...' : 'Ngarko në cloud ☁️'}
          </button>
          {mesazhi && <p style={{ margin: '10px 0 0 0', fontSize: '13px', fontWeight: '600' }}>{mesazhi}</p>}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
