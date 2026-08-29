import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { useAttraksioneve, QYTETET_E_KOSOVES } from './attraksionet';
import { meDistanca, formatoDistancm } from './distanca';
import Foto from './Foto';
import { hapLinkun } from './hapLinkun';

// ===== TURIZMI NË KOSOVË 🏔️ (Faza 3 — spec T1, T2) =====
// Faqe e dedikuar: pikat turistike me foto, histori, aktivitetet + Navigo.
// Integrim me "Afër meje": distanca nga lokacioni real/manual i përdoruesit.
function Turizmi() {
  const { darkMode, userLocation, t } = useContext(AppContext);
  const { lista, loading } = useAttraksioneve();
  const [qytetiFiltr, setQytetiFiltr] = useState('');
  const [kategoriaFiltr, setKategoriaFiltr] = useState('');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const kategoriUnike = [...new Set(lista.map((a) => a.kategoria).filter(Boolean))];

  const eFiltruar = lista
    .filter((a) => !qytetiFiltr || a.qyteti === qytetiFiltr)
    .filter((a) => !kategoriaFiltr || a.kategoria === kategoriaFiltr)
    .map((a) => (userLocation ? meDistanca(a, userLocation) : { ...a, distanca: null }))
    .sort((a, b) => {
      if (!userLocation) return 0;
      if (a.distanca == null && b.distanca == null) return 0;
      if (a.distanca == null) return 1;
      if (b.distanca == null) return -1;
      return a.distanca - b.distanca;
    });

  const chipsi = (aktiv) => ({
    padding: '9px 15px',
    borderRadius: '20px',
    border: `1px solid ${aktiv ? '#3b82f6' : korniza}`,
    backgroundColor: aktiv ? '#3b82f6' : 'transparent',
    color: aktiv ? '#fff' : stiliTekstit,
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* KREU */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: stiliTekstit }}>{t('turizmi')} në Kosovë</h2>
        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#8e8e93' }}>
          {loading ? 'Duke ngarkuar atraksionet...' : `${eFiltruar.length} pika turistike — kliko çdo kartelë për Navigo`}
          {userLocation && (
            <span style={{ marginLeft: '8px', fontWeight: '700', color: userLocation.burimi === 'gps' ? '#16a34a' : '#d97706' }}>
              · renditur sipas {userLocation.burimi === 'gps' ? 'lokacionit tënd real' : `qendrës së ${userLocation.qyteti} (MANUAL)`}
            </span>
          )}
        </p>
      </div>

      {/* ULLËRIMI I QYTETEVE (spec T1) */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#8e8e93', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🏙️ Ullërimi i qyteteve — kliko për ta filtruar
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          <button onClick={() => setQytetiFiltr('')} style={chipsi(!qytetiFiltr)}>Të gjitha</button>
          {QYTETET_E_KOSOVES.map((q) => (
            <button key={q.emri} onClick={() => setQytetiFiltr(qytetiFiltr === q.emri ? '' : q.emri)} style={chipsi(qytetiFiltr === q.emri)}
              title={q.pershkrimi}>
              {q.ikona ? q.ikona + ' ' : ''}{q.emri}
            </button>
          ))}
        </div>
      </div>

      {/* FILTËRI I KATEGORIVE */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', scrollbarWidth: 'none' }}>
        <button onClick={() => setKategoriaFiltr('')} style={chipsi(!kategoriaFiltr)}>⚡ Të gjitha kategoritë</button>
        {kategoriUnike.map((k) => (
          <button key={k} onClick={() => setKategoriaFiltr(kategoriaFiltr === k ? '' : k)} style={chipsi(kategoriaFiltr === k)}>
            {k}
          </button>
        ))}
      </div>

      {/* GJENDJA BOSH */}
      {eFiltruar.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: stiliKartelës, borderRadius: '20px', border: `1px solid ${korniza}` }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>🔭</div>
          <p style={{ margin: 0, fontSize: '14px', color: '#8e8e93' }}>
            Asnjë atraksion s\u2019përshtatet me filtrin. Provo qytet ose kategori tjetër.
          </p>
          <button onClick={() => { setQytetiFiltr(''); setKategoriaFiltr(''); }}
            style={{ marginTop: '14px', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            Pastro filtrat
          </button>
        </div>
      )}

      {/* KARTELAT E ATRAKSIONEVE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '22px', paddingBottom: '40px' }}>
        {eFiltruar.map((a) => (
          <div key={a.emri} style={{ backgroundColor: stiliKartelës, borderRadius: '18px', overflow: 'hidden', border: `1px solid ${korniza}`, boxShadow: '0 4px 14px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
            {/* FOTOGRAFIA — me fallback gradient+ikonë nëse URL s'ngarkohet */}
            <div style={{ position: 'relative' }}>
              <Foto
                src={a.foto}
                alt={a.emri}
                ikona={a.ikona || '📍'}
                lartesia="170px"
              />
              <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '22px', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: '10px', padding: '4px 8px' }}>
                {a.ikona || '📍'}
              </span>
              {a.distanca != null && (
                <span style={{
                  position: 'absolute', bottom: '10px', right: '10px', fontSize: '12px', fontWeight: '800',
                  backgroundColor: userLocation.burimi === 'gps' ? 'rgba(22,163,74,0.92)' : 'rgba(217,119,6,0.92)', color: '#fff',
                  borderRadius: '8px', padding: '5px 10px',
                }}>
                  📍 {formatoDistancm(a.distanca)} {userLocation.burimi === 'gps' ? 'nga ju' : `nga ${userLocation.qyteti} (MANUAL)`}
                </span>
              )}
            </div>

            <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#3b82f6', backgroundColor: '#3b82f615', padding: '3px 9px', borderRadius: '6px' }}>
                  {a.kategoria || 'Turizëm'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93' }}>📍 {a.qyteti}</span>
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '19px', fontWeight: '800', color: stiliTekstit }}>{a.emri}</h3>

              <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', lineHeight: 1.55, color: darkMode ? '#d1d5db' : '#4b5563' }}>
                {a.pershkrimi}
              </p>

              {a.aktivitetet && (
                <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', fontWeight: '700', color: '#0ea5e9' }}>
                  🎯 {a.aktivitetet}
                </p>
              )}

              <button
                onClick={() => hapLinkun(`https://www.google.com/maps?q=${a.lat},${a.lng}`, `https://www.google.com/maps?q=${a.lat},${a.lng}&z=15&output=embed`)}
                style={{ marginTop: 'auto', width: '100%', padding: '11px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                🧭 Navigo te {a.emri.split(' ').slice(0, 2).join(' ')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Turizmi;
