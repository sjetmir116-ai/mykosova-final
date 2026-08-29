import { useState, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { regjistroAudit } from '../audit';

// ===== MODERIMI I VLERËSIMEVE (Faza 2 — kërkesa: "admini i moderon") =====
// Liston live gjithë review-et, shtonin raportet, admini i fshin/pastron raportet.
function Moderimi() {
  const { darkMode } = useContext(AppContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kerkimi, setKerkimi] = useState('');
  const [filtri, setFiltri] = useState('teGjitha'); // teGjitha | meRaporte
  const [mesazhi, setMesazhi] = useState('');

  // Live sync me Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const diffRap = (Number(b.raportuar) || 0) - (Number(a.raportuar) || 0);
            if (diffRap !== 0) return diffRap;
            return (b.koha?.toMillis?.() || 0) - (a.koha?.toMillis?.() || 0);
          });
        setReviews(lista);
        setLoading(false);
      },
      (err) => {
        console.warn('Moderimi s\u2019u arrit:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtruar = reviews.filter((r) => {
    const teksti = String(r.biznesiEmri || '') + ' ' + String(r.emri || '') + ' ' + String(r.tekst || '');
    const k = kerkimi.toLowerCase();
    const peshKerkim = !k || teksti.toLowerCase().includes(k);
    const peshFiltri = filtri === 'teGjitha' || Number(r.raportuar) > 0;
    return peshKerkim && peshFiltri;
  });

  const meRaporte = reviews.filter((r) => Number(r.raportuar) > 0).length;
  const mesatarja = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.yje || 0), 0) / reviews.length).toFixed(1)
    : '—';

  const fshi = async (r) => {
    if (!window.confirm(`Fshi vlerësimin e "${r.emri}" për "${r.biznesiEmri}"?`)) return;
    try {
      await deleteDoc(doc(db, 'reviews', r.id));
      regjistroAudit('moderim_review_fshirje', { biznesi: r.biznesiEmri, autor: r.emri, id: r.id });
      setMesazhi(`🗑️ Vlerësimi i "${r.emri}" u fshi.`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const cyzeroRaportet = async (r) => {
    try {
      await updateDoc(doc(db, 'reviews', r.id), { raportuar: 0 });
      regjistroAudit('moderim_review_raporte_cyzero', { biznesi: r.biznesiEmri, autor: r.emri });
      setMesazhi(`✅ Raportet u çyzerozuan për vlerësimin e "${r.emri}".`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';

  const stiliStat = {
    flex: 1, minWidth: '110px', padding: '14px', borderRadius: '14px',
    border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#f9fafb', textAlign: 'center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Moderimi i Vlerësimeve ⭐</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          Shiko çdo vlerësim, trajto raportet, fshi spam-in — ndryshimet duken live te app-i
        </p>
      </div>

      {/* STATISTIKAT */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={stiliStat}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>{reviews.length}</div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#8e8e93' }}>VLERËSIMET GJITHSEJ</div>
        </div>
        <div style={{ ...stiliStat, borderColor: meRaporte ? '#ef444480' : korniza }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: meRaporte ? '#ef4444' : stiliTekstit }}>{meRaporte}</div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: meRaporte ? '#ef4444' : '#8e8e93' }}>ME RAPORTE ⚑</div>
        </div>
        <div style={stiliStat}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{mesatarja}</div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#8e8e93' }}>MESATARJA E YJEVE</div>
        </div>
      </div>

      {/* KËRKIMI + FILTËRIMI */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input value={kerkimi} onChange={(e) => setKerkimi(e.target.value)} placeholder="🔍 Kërko sipas biznesit, autorit ose teksti..."
          style={{ flex: 2, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        {[['teGjitha', 'Të gjitha'], ['meRaporte', '⚑ Vetëm me raporte']].map(([id, etiketa]) => (
          <button key={id} onClick={() => setFiltri(id)}
            style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${filtri === id ? '#3b82f6' : stiliInputit}`, backgroundColor: filtri === id ? '#3b82f6' : 'transparent', color: filtri === id ? '#fff' : stiliTekstit, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            {etiketa}
          </button>
        ))}
      </div>

      {mesazhi && <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: mesazhi.startsWith('✅') || mesazhi.startsWith('🗑️') ? '#16a34a' : '#ef4444' }}>{mesazhi}</p>}

      {/* LISTA */}
      {loading ? (
        <p style={{ color: '#8e8e93', fontSize: '14px' }}>Duke ngarkuar vlerësimet...</p>
      ) : filtruar.length === 0 ? (
        <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '30px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📭</div>
          <p style={{ margin: 0, fontSize: '14px', color: '#8e8e93' }}>
            {filtruar.length === 0 && reviews.length === 0
              ? 'Ende s\u2019ka asnjë vlerësim. Sa herë që një përdorues vlerëson një biznes, do të shfaqet këtu.'
              : 'Asnjë vlerësim s\u2019përshtatet me kërkimin/filtrin.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtruar.map((r) => (
            <div key={r.id} style={{
              backgroundColor: stiliKartelës, border: `1px solid ${Number(r.raportuar) > 0 ? '#ef444480' : korniza}`,
              borderRadius: '16px', padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: '14px', color: stiliTekstit }}>{r.emri || 'Anonim'}</b>
                  <span style={{ fontSize: '13px' }}>{'⭐'.repeat(Math.max(0, Math.round(Number(r.yje) || 0)))}</span>
                  <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '700' }}>te: {r.biznesiEmri}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#8e8e93' }}>
                  {r.koha?.toDate ? r.koha.toDate().toLocaleDateString('sq-AL') : ''}
                  {r.raportuar > 0 && (
                    <span style={{ color: '#ef4444', fontWeight: '800', marginLeft: '8px' }}>⚑ {r.raportuar} RAPORTE</span>
                  )}
                </span>
              </div>

              <p style={{ margin: '0 0 6px 0', fontSize: '14px', lineHeight: 1.5, color: stiliTekstit, whiteSpace: 'pre-wrap' }}>{r.tekst}</p>
              {r.foto && String(r.foto).startsWith('http') && (
                <img src={r.foto} alt="Foto nga përdoruesi"
                  style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', margin: '6px 0' }}
                  onError={(e) => (e.target.style.display = 'none')} />
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => fshi(r)}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  🗑️ Fshi
                </button>
                {Number(r.raportuar) > 0 && (
                  <button onClick={() => cyzeroRaportet(r)}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    ⚑ Çzero raportet
                  </button>
                )}
                <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '10px', color: '#8e8e93' }}>
                  id: {r.id.slice(0, 8)} · {(r.ndermuesit || []).length} 👍
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Moderimi;
