import { useState, useEffect, useContext } from 'react';
import { AppContext } from './AppContext';
import { useBizneset, merrMapsUrl } from './useBizneset';
import { useKategorite, useQyteteve } from './useKontenti';
import { distancaKm, formatoDistancm } from './distanca';
import { rendiPaketes } from './paketa';

function SmartSearch() {
  const { darkMode, vleraKerkimi, userLocation, setBiznesiIzgjedhur, t, vendndodhja } = useContext(AppContext);
  const { bizneset, loading } = useBizneset();
  const { lista: kategoritë } = useKategorite();
  const { lista: qytetet } = useQyteteve();
  const [kërkimi, setKërkimi] = useState('');
  const [filtriKategoria, setFiltriKategoria] = useState('');
  const [filtriQyteti, setFiltriQyteti] = useState('');
  const [renditja, setRenditja] = useState('përmasa'); // përmasa | yjet | emri | distanca

  // Përmbush fushën me kërkimin që vjen nga Ballina (gjendja globale)
  useEffect(() => {
    if (vleraKerkimi) setKërkimi(vleraKerkimi);
  }, [vleraKerkimi]);

  const normalizo = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fjalaKyçe = normalizo(kërkimi);

  // Filtrimi inteligjent (emër, kategori, qytet, adresë, përshkrim)
  let biznesetEfiltruara = bizneset.filter((b) => {
    const pasqyronKerkimin = !fjalaKyçe ||
      normalizo(b.emri).includes(fjalaKyçe) ||
      normalizo(b.kategoria).includes(fjalaKyçe) ||
      normalizo(b.qyteti).includes(fjalaKyçe) ||
      normalizo(b.adresa).includes(fjalaKyçe) ||
      normalizo(b.pershkrimi).includes(fjalaKyçe);
    const pasqyronKategorine = !filtriKategoria || normalizo(b.kategoria) === normalizo(filtriKategoria);
    const pasqyronQytetin = !filtriQyteti || normalizo(b.qyteti) === normalizo(filtriQyteti);
    return pasqyronKerkimin && pasqyronKategorine && pasqyronQytetin;
  });

  // Shton distancën (nëse ka GPS)
  biznesetEfiltruara = biznesetEfiltruara.map((b) => {
    if (userLocation && b.lat && b.lng) {
      return { ...b, distanca: distancaKm(userLocation.lat, userLocation.lng, Number(b.lat), Number(b.lng)) };
    }
    return { ...b, distanca: null };
  });

  // Renditja
  biznesetEfiltruara = [...biznesetEfiltruara].sort((a, b) => {
    if (renditja === 'distanca') {
      return (a.distanca ?? Infinity) - (b.distanca ?? Infinity);
    }
    if (renditja === 'yjet') {
      return Number(b.vleresimi || b.yllatNumer || 0) - Number(a.vleresimi || a.yllatNumer || 0);
    }
    if (renditja === 'emri') {
      return String(a.emri).localeCompare(String(b.emri));
    }
    // 'përmasa' → Featured positioning: Premium > Gold > Basic, pastaj renditja natyrale (spec Y15)
    return rendiPaketes(a) - rendiPaketes(b);
  });

  const stiliSfondit = darkMode ? '#111827' : '#f3f4f6';
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';

  const chipsi = (aktive, ngjyra = '#3b82f6') => ({
    padding: '7px 13px', borderRadius: '16px', border: `1px solid ${aktive ? ngjyra : stiliInputit}`,
    backgroundColor: aktive ? ngjyra : 'transparent', color: aktive ? '#fff' : stiliTekstit,
    fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ backgroundColor: stiliSfondit, minHeight: 'calc(100vh - 145px)', padding: '40px 20px', fontFamily: 'sans-serif', color: stiliTekstit }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        <h2 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: '800', textAlign: 'center' }}>Kërkimi Inteligjent 🔍</h2>
        <p style={{ margin: '0 0 25px 0', fontSize: '14px', color: '#8e8e93', textAlign: 'center' }}>
          Gjeni hotele, restorante, stacione dhe pika turistike — {bizneset.length} vende të regjistruara
        </p>

        {/* Inputi i Kërkimit */}
        <input
          type="text"
          value={kërkimi}
          onChange={(e) => setKërkimi(e.target.value)}
          placeholder={t('kerko')}
          style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, fontSize: '15px', outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box', marginBottom: '14px' }}
        />

        {/* Filtrat: kategori + qytet */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '6px', scrollbarWidth: 'none' }}>
          <button onClick={() => setFiltriKategoria('')} style={chipsi(!filtriKategoria && !filtriQyteti, '#8e8e93')}>Të gjitha</button>
          {kategoritë.slice(0, 8).map((k) => (
            <button key={k.emri} onClick={() => setFiltriKategoria(filtriKategoria === k.emri ? '' : k.emri)} style={chipsi(filtriKategoria === k.emri)}>
              {k.ikona} {k.emri}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          {qytetet.slice(0, 8).map((q) => (
            <button key={q.emri} onClick={() => setFiltriQyteti(filtriQyteti === q.emri ? '' : q.emri)} style={chipsi(filtriQyteti === q.emri, '#16a34a')}>
              📍 {q.emri}
            </button>
          ))}
        </div>

        {/* Renditja */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#8e8e93', fontWeight: '700' }}>Rendit:</span>
          {[['përmasa', '📊 Përmasa'], ['yjet', '⭐ Yjet'], ['emri', '🔤 Emri'], ['distanca', '📍 Afërsia']].map(([id, etiketa]) => (
            <button key={id} onClick={() => setRenditja(id)} disabled={id === 'distanca' && !userLocation}
              style={{ ...chipsi(renditja === id, '#8e8e93'), opacity: id === 'distanca' && !userLocation ? 0.4 : 1, cursor: id === 'distanca' && !userLocation ? 'not-allowed' : 'pointer' }}>
              {etiketa}
            </button>
          ))}
          {renditja === 'distanca' && userLocation && (
            <span style={{ fontSize: '11px', color: userLocation.burimi === 'gps' ? '#16a34a' : '#d97706', fontWeight: '700' }}>
              Afër: {vendndodhja || (userLocation.burimi === 'gps' ? 'lokacioni juaj' : `qendra e ${userLocation.qyteti}`)} {userLocation.burimi === 'gps' ? '(GPS real)' : '— jo GPS'}
            </span>
          )}
        </div>

        {/* Lista e Rezultateve — kartelat hapin Profilin */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#8e8e93', fontWeight: '600' }}>Duke ngarkuar bizneset...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {biznesetEfiltruara.length > 0 ? (
              biznesetEfiltruara.map((b) => (
                <div key={b.id} onClick={() => setBiznesiIzgjedhur(b)}
                  style={{ backgroundColor: stiliKartelës, padding: '20px', borderRadius: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: darkMode ? '1px solid #2d2d2d' : '1px solid #f2f2f7', cursor: 'pointer', transition: 'transform 0.1s' }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.99)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#3b82f6', backgroundColor: '#3b82f615', padding: '4px 8px', borderRadius: '6px' }}>
                          {b.kategoria || 'Biznes'}
                        </span>
                        {b.sponsoruar && <span style={{ fontSize: '10px', fontWeight: '800', color: '#f59e0b' }}>🏷️ SPONSORUAR</span>}
                        {b.verifikuar && <span style={{ fontSize: '10px', fontWeight: '800', color: '#16a34a' }}>✓ E VERIFIKUAR</span>}
                      </div>
                      <h3 style={{ margin: '8px 0 4px 0', fontSize: '18px', fontWeight: '800' }}>🏢 {b.emri}</h3>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#8e8e93' }}>
                        📍 {b.qyteti}{b.adresa ? ` — ${b.adresa}` : ''}
                        {b.distanca != null && <span style={{ color: '#16a34a', fontWeight: '700' }}> · {formatoDistancm(b.distanca)} afër</span>}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {b.vleresimi || b.yllatNumer ? (
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>⭐ {Number(b.vleresimi || b.yllatNumer).toFixed(1)}</p>
                        ) : null}
                      </div>
                      {b.oferta ? (
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{b.oferta}</p>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <a
                        href={merrMapsUrl(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: 'none', backgroundColor: '#3b82f6', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}
                      >
                        Navigo 🧭
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#8e8e93', marginTop: '20px' }}>
                Nuk u gjet asnjë biznes për këto filtra.
                <br />
                <small>Provo me: hotel, restorant, karburant, Suharekë, Rugova...</small>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default SmartSearch;
