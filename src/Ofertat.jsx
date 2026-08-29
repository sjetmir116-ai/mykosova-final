import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { useOfertatTeGjitha } from './useOfertat';
import { useBizneset } from './useBizneset';
import { meDistanca, formatoDistancm } from './distanca';
import { hapLinkun } from './hapLinkun';

// ===== OFERTAT 🎁 (Faza 3.3) =====
// Faqe e dedikuar: të gjitha ofertat aktive në një vend.
//  Burime: (1) koleksioni "offers" (me skadencë, i menaxhuar nga biznesi/admini)
//           (2) fusha e përhershme "oferta" e bizneseve (lokale + cloud)
function Ofertat({ setEkrani }) {
  const { darkMode, userLocation, setBiznesiIzgjedhur } = useContext(AppContext);
  const { aktive: ofertatDinamike, skaduar: ofertatSkaduar, loading } = useOfertatTeGjitha();
  const { bizneset } = useBizneset();
  const [qytetiFiltr, setQytetiFiltr] = useState('');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  // Gjen biznesin sipas emrit (për qytetin, GPS-in, hapjen e detajit)
  const gjenBiznesin = (emri) => {
    const e = String(emri || '').toLowerCase();
    return bizneset.find((b) => String(b.emri).toLowerCase() === e) || null;
  };

  // 1. Ofertat dinamike (koleksioni offers) — vetëm aktive, me filtrin e qytetit
  const dinamikeEfiltruar = (qytetiFiltr ? [] : [])
    .concat(ofertatDinamike)
    .filter((o) => {
      if (!qytetiFiltr) return true;
      const b = gjenBiznesin(o.biznesiEmri);
      return b && b.qyteti === qytetiFiltr;
    });

  // 2. Ofertat e përhershme nga biznese (fusha "oferta")
  const tePershmeja = bizneset
    .filter((b) => b.oferta && String(b.oferta).trim())
    .filter((b) => !qytetiFiltr || b.qyteti === qytetiFiltr)
    .map((b) => (userLocation ? meDistanca(b, userLocation) : { ...b, distanca: null }))
    .sort((a, b) => {
      if (!userLocation) return String(a.emri).localeCompare(String(b.emri));
      if (a.distanca == null && b.distanca == null) return String(a.emri).localeCompare(String(b.emri));
      if (a.distanca == null) return 1;
      if (b.distanca == null) return -1;
      return a.distanca - b.distanca;
    });

  // Qytetet me oferta (për filtrimin)
  const qytetetMeOferta = [...new Set(
    [...(ofertatDinamike.map((o) => { const b = gjenBiznesin(o.biznesiEmri); return b?.qyteti; }).filter(Boolean)),
     ...tePershmeja.map((b) => b.qyteti).filter(Boolean)]
  )].filter(Boolean).sort();

  const chipsi = (aktiv) => ({
    padding: '8px 14px',
    borderRadius: '18px',
    border: `1px solid ${aktiv ? '#16a34a' : korniza}`,
    backgroundColor: aktiv ? '#16a34a' : 'transparent',
    color: aktiv ? '#fff' : stiliTekstit,
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  const butoni = (ngjyra) => ({
    flex: 1,
    padding: '10px 8px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: ngjyra,
    color: '#fff',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  });

  const distancaShenja = (b) => (b.distanca != null ? (
    <span style={{
      fontSize: '11px',
      fontWeight: '800',
      color: userLocation.burimi === 'gps' ? '#16a34a' : '#d97706',
      backgroundColor: userLocation.burimi === 'gps' ? '#16a34a15' : '#d9770615',
      padding: '3px 9px',
      borderRadius: '6px',
    }}>
      📍 {formatoDistancm(b.distanca)} {userLocation.burimi === 'gps' ? 'nga ju' : `nga ${userLocation.qyteti} (MANUAL)`}
    </span>
  ) : null);

  const totalAktive = dinamikeEfiltruar.length + tePershmeja.length;

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* KREU */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: stiliTekstit }}>Ofertat 🎁</h2>
        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#8e8e93' }}>
          {loading ? 'Duke ngarkuar ofertat...' : `${totalAktive} oferte aktive ${qytetiFiltr ? `te ${qytetiFiltr}` : 'në Kosovë'}`}
        </p>
      </div>

      {/* FILTËRI I QYTETIT */}
      {qytetetMeOferta.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', scrollbarWidth: 'none' }}>
          <button onClick={() => setQytetiFiltr('')} style={chipsi(!qytetiFiltr)}>🇽 Të gjitha</button>
          {qytetetMeOferta.map((q) => (
            <button key={q} onClick={() => setQytetiFiltr(qytetiFiltr === q ? '' : q)} style={chipsi(qytetiFiltr === q)}>📍 {q}</button>
          ))}
        </div>
      )}

      {/* GJENDJA BOSH */}
      {totalAktive === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: stiliKartelës, borderRadius: '20px', border: `1px solid ${korniza}`, marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎁</div>
          <p style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: stiliTekstit }}>
            {qytetiFiltr ? `Ende s\u2019ka oferta te ${qytetiFiltr}.` : 'Ende s\u2019ka asnjë ofertë publike.'}
          </p>
          <button onClick={() => setEkrani('shto')}
            style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
            🏢 Shto biznesin tënd me një ofertë
          </button>
        </div>
      )}

      {/* 1. OFERTAT DINAMIKE (me skadencë) */}
      {dinamikeEfiltruar.length > 0 && (
        <div style={{ marginBottom: '26px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a', margin: '0 0 12px 0' }}>⏳ Ofertat me vllim deri në një datë</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '18px' }}>
            {dinamikeEfiltruar.map((o) => {
              const b = gjenBiznesin(o.biznesiEmri);
              return (
                <div key={o.id} style={{ backgroundColor: stiliKartelës, borderRadius: '16px', border: '1px solid #16a34a40', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: '15px', color: stiliTekstit, cursor: b ? 'pointer' : 'default' }}
                      onClick={() => b && setBiznesiIzgjedhur(b)}
                      title={b ? 'Hap biznesin' : ''}>
                      🏢 {o.biznesiEmri} {b ? '→' : ''}
                    </b>
                    {o.vlenDeri && <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', backgroundColor: '#d9770615', padding: '3px 9px', borderRadius: '6px' }}>vlen deri më {o.vlenDeri}</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: stiliTekstit, lineHeight: 1.4 }}>🎁 {o.teksti}</p>
                  {(o.cmimiVjete || o.cmimiIri) && (
                    <p style={{ margin: 0, fontSize: '15px' }}>
                      {o.cmimiVjete && <s style={{ color: '#8e8e93', fontWeight: '600' }}>{o.cmimiVjete}€</s>}
                      {o.cmimiIri && <b style={{ color: '#16a34a', marginLeft: o.cmimiVjete ? '8px' : 0, fontSize: '17px' }}>{o.cmimiIri}€</b>}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                    {b && b.qyteti && <span style={{ fontSize: '12px', color: '#8e8e93', fontWeight: '700' }}>📍 {b.qyteti}</span>}
                    {distancaShenja(b)}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                      {b && (b.lat || b.qyteti) && (
                        <button onClick={() => hapLinkun(
                          b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.emri + ' ' + b.qyteti + ' Kosovë')}`,
                          b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}&z=15&output=embed` : `https://www.google.com/maps?q=${encodeURIComponent(b.emri + ' ' + b.qyteti + ' Kosovë')}&output=embed`
                        )} style={butoni('#8e8e93')}>🧭 Navigo</button>
                      )}
                      {b && (
                        <button onClick={() => setBiznesiIzgjedhur(b)} style={butoni('#3b82f6')}>Hap biznesin</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. OFERTAT E PËRHERSHME nga biznese */}
      {tePershmeja.length > 0 && (
        <div style={{ marginBottom: '26px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a', margin: '0 0 12px 0' }}>♾️ Ofertat e përhershme nga biznese</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '18px' }}>
            {tePershmeja.map((b) => (
              <div key={b.id} style={{ backgroundColor: stiliKartelës, borderRadius: '16px', border: '1px solid #16a34a40', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: '15px', color: stiliTekstit, cursor: 'pointer' }} onClick={() => setBiznesiIzgjedhur(b)} title="Hap biznesin">
                    🏢 {b.emri} →
                  </b>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', backgroundColor: '#16a34a15', padding: '3px 9px', borderRadius: '6px' }}>e përhershme</span>
                </div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: stiliTekstit, lineHeight: 1.4 }}>{b.oferta}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#8e8e93', fontWeight: '700' }}>📍 {b.qyteti}</span>
                  {distancaShenja(b)}
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button onClick={() => hapLinkun(
                      b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.emri + ' ' + b.qyteti + ' Kosovë')}`,
                      b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}&z=15&output=embed` : `https://www.google.com/maps?q=${encodeURIComponent(b.emri + ' ' + b.qyteti + ' Kosovë')}&output=embed`
                    )} style={butoni('#8e8e93')}>🧭 Navigo</button>
                    <button onClick={() => setBiznesiIzgjedhur(b)} style={butoni('#3b82f6')}>Hap biznesin</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFERTAT E SKADUAR (nën, të zbehta) */}
      {ofertatSkaduar.length > 0 && !qytetiFiltr && (
        <div style={{ marginBottom: '30px', opacity: 0.65 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#8e8e93', margin: '0 0 10px 0' }}>🗓️ Ofertat e skaduara ({ofertatSkaduar.length})</h3>
          {ofertatSkaduar.map((o) => (
            <div key={o.id} style={{ padding: '10px 14px', marginBottom: '8px', borderRadius: '12px', border: `1px dashed ${korniza}`, fontSize: '13px', color: '#8e8e93' }}>
              <s>🏢 {o.biznesiEmri} — 🎁 {o.teksti}</s> {o.vlenDeri && <span style={{ fontWeight: '700' }}>(skaduar më {o.vlenDeri})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Ofertat;
