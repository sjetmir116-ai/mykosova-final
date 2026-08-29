import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { useAttraksioneve, QYTETET_E_KOSOVES } from './attraksionet';
import { useBizneset, merrMapsUrl } from './useBizneset';
import { useTrips, gjeneroItinerarin } from './useTrips';
import { useQyteteve } from './useKontenti';
import { useMoti, esMotIMire, QYTETE_KOORDINATA } from './moti';
import { useEventet, formatoDate, esNeTeArdhmen } from './eventet';
import { hapLinkun } from './hapLinkun';

// ===== MY KOSOVA TRIP (spec T1-T8) =====
// 3 seksione: Zbulo (qytete + atraksione) · Planner (N-ditore automatik) · Tripat e mi
function TripScreen() {
  const { darkMode, përdoruesi, setBiznesiIzgjedhur } = useContext(AppContext);
  const [seksioni, setSeksioni] = useState('zbulo');
  const [filtriQyteti, setFiltriQyteti] = useState('');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const chipsi = (aktive) => ({
    padding: '8px 14px', borderRadius: '16px', border: `1px solid ${aktive ? '#3b82f6' : korniza}`,
    backgroundColor: aktive ? '#3b82f6' : 'transparent', color: aktive ? '#fff' : stiliTekstit,
    fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ backgroundColor: darkMode ? '#111827' : '#f3f4f6', minHeight: 'calc(100vh - 145px)', padding: '30px 20px', fontFamily: 'system-ui, sans-serif', color: stiliTekstit }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '800', textAlign: 'center' }}>My Kosova Trip 🏔️</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#8e8e93', textAlign: 'center' }}>
          Zbuloni Kosovën — qytetet, atraksionet dhe itineraret e gatshme
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[['zbulo', '🔍 Zbulo'], ['planner', '🗓️ Planifiko'], ['tripat', '💾 Tripat e mi']].map(([id, etiketa]) => (
            <button key={id} onClick={() => setSeksioni(id)} style={chipsi(seksioni === id)}>{etiketa}</button>
          ))}
        </div>

        {seksioni === 'zbulo' && <Zbulo filtriQyteti={filtriQyteti} setFiltriQyteti={setFiltriQyteti} stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} />}
        {seksioni === 'planner' && <Planner stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} />}
        {seksioni === 'tripat' && <TripatEte uid={përdoruesi?.uid} darkMode={darkMode} stiliTekstit={stiliTekstit} korniza={korniza} />}
      </div>
    </div>
  );
}

// ===== ZBULO (T1, T2) =====
function Zbulo({ filtriQyteti, setFiltriQyteti, stiliKartelës, korniza, stiliTekstit }) {
  const { lista: attraksionet } = useAttraksioneve();
  const { setBiznesiIzgjedhur } = useContext(AppContext);
  const qytete = QYTETET_E_KOSOVES;
  const teFiltruara = filtriQyteti ? attraksionet.filter((a) => a.qyteti === filtriQyteti) : attraksionet;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Qytetet */}
      <div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '800' }}>🇽🇰 Zbulo Kosovën</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {qytete.map((q) => (
            <div key={q.emri} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '14px', padding: '14px', cursor: 'pointer' }}
              onClick={() => setFiltriQyteti(filtriQyteti === q.emri ? '' : q.emri)}>
              <b style={{ fontSize: '14px' }}>{q.ikona} {q.emri} {filtriQyteti === q.emri && '✓'}</b>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8e8e93', lineHeight: 1.5 }}>{q.pershkrimi}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MOTI — spec T7/U31 */}
      <MotiQyteteve stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} />

      {/* EVENTE — spec U14/D16/A20 */}
      <Eventet stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} />

      {/* Atraksionet */}
      <div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '800' }}>
          ⭐ Atraksionet {filtriQyteti && <span style={{ color: '#3b82f6' }}>— {filtriQyteti}</span>}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {teFiltruara.map((a) => (
            <div key={a.emri} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', overflow: 'hidden' }}>
              {a.foto && <img src={a.foto} alt={a.emri} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />}
              <div style={{ padding: '14px' }}>
                <b style={{ fontSize: '14px' }}>{a.ikona} {a.emri}</b>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#8e8e93' }}>📍 {a.qyteti} · {a.kategoria}</p>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: stiliTekstit, lineHeight: 1.5 }}>{a.pershkrimi}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => hapLinkun(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.emri + ' ' + a.qyteti + ' Kosovë')}`, `https://www.google.com/maps?q=${encodeURIComponent(a.emri + ' ' + a.qyteti + ' Kosovë')}&output=embed`)}
                    style={{ flex: 1, backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '9px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    Navigo 🧭
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== EVENTE (U14, D16) =====
function Eventet({ stiliKartelës, korniza, stiliTekstit }) {
  const { lista, loading } = useEventet();
  const teArdhshmet = lista.filter((e) => esNeTeArdhmen(e.data));

  return (
    <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '800' }}>🎪 Eventet e ardhshme</h3>
      {loading ? (
        <p style={{ margin: 0, fontSize: '13px', color: '#8e8e93' }}>Duke ngarkuar...</p>
      ) : teArdhshmet.length === 0 ? (
        <p style={{ margin: 0, fontSize: '13px', color: '#8e8e93' }}>Ende s\u2019ka evente të ardhshme të regjistruara.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {teArdhshmet.map((e) => (
            <div key={e.emri} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', border: `1px solid ${korniza}`, alignItems: 'flex-start' }}>
              <div style={{ fontSize: '26px' }}>{e.ikona || '🎪'}</div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '14px', color: stiliTekstit }}>{e.emri}</b>
                <p style={{ margin: '3px 0', fontSize: '12px', color: '#8e8e93' }}>
                  📅 {formatoDate(e.data)}{e.ora && ` · ${e.ora}`} · 📍 {e.qyteti} · {e.kategoria}
                </p>
                {e.pershkrimi && <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: stiliTekstit, lineHeight: 1.5 }}>{e.pershkrimi}</p>}
                <button
                  onClick={() => hapLinkun(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((e.qyteti || '') + ' Kosovë')}`, `https://www.google.com/maps?q=${encodeURIComponent((e.qyteti || '') + ' Kosovë')}&output=embed`)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
                  Shiko lokacionin 🧭
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== MOTI (T7, U31) — "A është moti i mirë për Rugovë nesër?" =====
function MotiQyteteve({ stiliKartelës, korniza, stiliTekstit }) {
  const [qyteti, setQyteti] = useState('Prishtinë');
  const { moti, loading, gabim } = useMoti({ qyteti });
  const qytetet = Object.keys(QYTETE_KOORDINATA);

  return (
    <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '800' }}>🌤️ Moti tani</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {qytetet.map((q) => (
          <button key={q} onClick={() => setQyteti(q)}
            style={{ padding: '6px 12px', borderRadius: '14px', border: `1px solid ${qyteti === q ? '#3b82f6' : korniza}`, backgroundColor: qyteti === q ? '#3b82f6' : 'transparent', color: qyteti === q ? '#fff' : stiliTekstit, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            {q}
          </button>
        ))}
      </div>
      {loading && <p style={{ margin: 0, fontSize: '13px', color: '#8e8e93' }}>Duke marrë motin për {qyteti}...</p>}
      {gabim && <p style={{ margin: 0, fontSize: '12px', color: '#8e8e93' }}>Moti s\u2019u arrit (kontrollo internetin) — {gabim}</p>}
      {moti && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '38px' }}>{moti.emoji}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: stiliTekstit }}>{moti.temp}°C</div>
            <div style={{ fontSize: '12px', color: '#8e8e93' }}>{moti.emri}</div>
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {moti.ditet.map((d) => (
                <div key={d.data} style={{ textAlign: 'center', padding: '6px 10px', borderRadius: '10px', border: `1px solid ${korniza}` }}>
                  <div style={{ fontSize: '10px', color: '#8e8e93' }}>{d.data.slice(5)}</div>
                  <div style={{ fontSize: '16px' }}>{d.emoji}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: stiliTekstit }}>{d.maks}°/{d.min}°</div>
                </div>
              ))}
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontWeight: '700', color: esMotIMire(moti.kod, moti.temp).mire ? '#16a34a' : '#f59e0b' }}>
              {esMotIMire(moti.kod, moti.temp).teksti} — {qyteti}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PLANNER (T3, T4) =====
function Planner({ stiliKartelës, korniza, stiliTekstit }) {
  const { darkMode, përdoruesi } = useContext(AppContext);
  const { lista: attraksionet } = useAttraksioneve();
  const { bizneset } = useBizneset();
  const { trips, ruajTrip, fshiTrip } = useTrips(përdoruesi?.uid);
  const [ditet, setDitet] = useState(2);
  const [qytetetZgjedhura, setQytetetZgjedhura] = useState([]);
  const [iterari, setIterari] = useState(null);

  const toggleQyteti = (q) => setQytetetZgjedhura((prev) => prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]);

  const gjenero = () => {
    const i = gjeneroItinerarin({ ditet, qytetetZgjedhura: qytetetZgjedhura, bizneset, attraksionet });
    setIterari(i);
  };

  const ruaj = async () => {
    if (!iterari) return;
    try {
      await ruajTrip({ emri: `Trip ${ditet}-ditor — ${new Date().toLocaleDateString('sq-AL')}`, ditet: iterari });
      alert('✅ Trip-i u ruajt — shikoje te "Tripat e mi".');
      setIterari(null);
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '17px', fontWeight: '800' }}>🗓️ Ndërton itinerarin</h3>
        <label style={{ fontSize: '13px', fontWeight: '700', color: '#8e8e93' }}>Sa ditë keni?</label>
        <div style={{ display: 'flex', gap: '8px', margin: '8px 0 16px 0' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setDitet(n)}
              style={{ width: '46px', padding: '10px 0', borderRadius: '12px', border: `1px solid ${ditet === n ? '#3b82f6' : korniza}`, backgroundColor: ditet === n ? '#3b82f6' : 'transparent', color: ditet === n ? '#fff' : stiliTekstit, fontWeight: '800', cursor: 'pointer' }}>
              {n}
            </button>
          ))}
        </div>
        <label style={{ fontSize: '13px', fontWeight: '700', color: '#8e8e93' }}>Qytetet (ose lëreni bosh për rekomandim):</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '8px 0 16px 0' }}>
          {QYTETET_E_KOSOVES.slice(0, 7).map((q) => (
            <button key={q.emri} onClick={() => toggleQyteti(q.emri)}
              style={{ padding: '7px 13px', borderRadius: '16px', border: `1px solid ${qytetetZgjedhura.includes(q.emri) ? '#3b82f6' : korniza}`, backgroundColor: qytetetZgjedhura.includes(q.emri) ? '#3b82f6' : 'transparent', color: qytetetZgjedhura.includes(q.emri) ? '#fff' : stiliTekstit, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              {q.ikona} {q.emri}
            </button>
          ))}
        </div>
        <button onClick={gjenero} style={{ width: '100%', backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
          Gjenero itinerarin ✨
        </button>
      </div>

      {iterari && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {iterari.map((d) => (
            <div key={d.dita} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '18px' }}>
              <b style={{ fontSize: '15px', color: '#3b82f6' }}>Dita {d.dita} — {d.qyteti}</b>
              <ul style={{ margin: '10px 0', paddingLeft: '18px', fontSize: '13px', color: stiliTekstit, lineHeight: 1.9 }}>
                {d.pikat.map((p) => <li key={p}>📍 {p}</li>)}
                <li>🛏️ Hotel: {d.hotel}</li>
                <li>🍽️ Kujdes: {d.restorant}</li>
              </ul>
            </div>
          ))}
          <button onClick={ruaj} disabled={!përdoruesi}
            style={{ backgroundColor: përdoruesi ? '#3b82f6' : '#8e8e93', color: '#fff', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: përdoruesi ? 'pointer' : 'not-allowed', opacity: përdoruesi ? 1 : 0.5 }}>
            {përdoruesi ? '💾 Ruaj trip-in te llogaria' : 'Hyhuni për ta ruajtur trip-in'}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== TRIPAT E MI (T8) =====
function TripatEte({ uid, darkMode, stiliTekstit, korniza }) {
  const { trips, loading, fshiTrip } = useTrips(uid);
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';

  // NDAJE TRIP-IT (spec T10) — Web Share API me fallback te clipboard
  const ndajeTrip = async (t) => {
    const teksti = `🧳 ${t.emri}\n` +
      (t.ditet || []).map((d) => `Dita ${d.dita}: ${d.qyteti} — ${(d.pikat || []).join(', ')}\n   🛏️ ${d.hotel} · 🍽️ ${d.restorant}`).join('\n') +
      '\n— MyKosova 🇽🇰';
    if (navigator.share) {
      try { await navigator.share({ title: t.emri, text: teksti }); } catch { /* u anulua */ }
    } else {
      try {
        await navigator.clipboard.writeText(teksti);
        alert('✅ Trip-i u kopjua — ngjite e te WhatsApp/Facebook/te dikush!');
      } catch { alert('S\u2019u kopjua.'); }
    }
  };

  if (!uid) {
    return <p style={{ textAlign: 'center', color: '#8e8e93' }}>Hyhuni për të parë trip-et tuaja të ruajtura.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {loading ? (
        <p style={{ textAlign: 'center', color: '#8e8e93' }}>Duke ngarkuar...</p>
      ) : trips.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#8e8e93' }}>Ende s'keni trip-e të ruajtura. Hapini "Planifiko" dhe gjeneroni një!</p>
      ) : (
        trips.map((t) => (
          <div key={t.id} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <b style={{ fontSize: '15px', color: stiliTekstit }}>🧳 {t.emri}</b>
              <div style={{ display: 'flex', gap: '14px' }}>
                <button onClick={() => ndajeTrip(t)} title="Ndaje trip-in"
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                  📤 Ndaje
                </button>
                <button onClick={() => { if (confirm('Të fshihet ky trip?')) fshiTrip(t.id).catch((e) => alert(e.message)); }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                  🗑️
                </button>
              </div>
            </div>
            {(t.ditet || []).map((d) => (
              <div key={d.dita} style={{ fontSize: '13px', color: stiliTekstit, padding: '6px 0', borderBottom: `1px solid ${korniza}`, lineHeight: 1.6 }}>
                <b style={{ color: '#3b82f6' }}>Dita {d.dita}:</b> {d.qyteti} — {(d.pikat || []).join(', ')}
                <span style={{ color: '#8e8e93' }}> · 🛏️ {d.hotel} · 🍽️ {d.restorant}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default TripScreen;
