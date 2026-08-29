import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// ===== ANALITIKA (Faza 3.4) — statistikat live të veprimeve të përdoruesve =====
// Lexon koleksionin analytics_events (e shkruar nga çdo vizitor te app-i)
// Ngjarjet: kërkim, hapje_biznesi, navigo, telefon, vlerësim, sos, ndaje, shtim_biznesi
function Analitika() {
  const { darkMode } = useContext(AppContext);
  const [ngjarjet, setNgjarjet] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'analytics_events'),
      (snap) => {
        setNgjarjet(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('Analitika s\u2019u arrit (kontrollo rules v2.1):', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const meKoha = ngjarjet.filter((n) => n.koha?.toMillis);
  const sot = new Date().toISOString().split('T')[0];
  const ka = (ng) => meKoha.filter((n) => n.ngjarja === ng);

  // Agregimi
  const total = meKoha.length;
  const teSot = meKoha.filter((n) => n.koha.toDate().toISOString().split('T')[0] === sot).length;
  const topBiznese = new Map();
  ka('hapje_biznesi').forEach((n) => {
    const e = n.detajet?.emri || 'I panjohur';
    topBiznese.set(e, (topBiznese.get(e) || 0) + 1);
  });
  const topBizneseLista = [...topBiznese.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topKerkime = new Map();
  ka('kërkim').forEach((n) => {
    const e = n.detajet?.teksti || '';
    topKerkime.set(e, (topKerkime.get(e) || 0) + 1);
  });
  const topKerkimeLista = [...topKerkime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const teVeprat = [
    ['🧭 Navigo', ka('navigo').length],
    ['📞 Telefon/WhatsApp', ka('telefon').length],
    ['⭐ Vlerësime', ka('vlerësim').length],
    ['📤 Ndarje', ka('ndaje').length],
    [' Shtim biznese', ka('shtim_biznesi').length],
    ['🚨 SOS', ka('sos').length],
  ];

  // 7 ditët e fundit
  const te7Ditet = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const ky = d.toISOString().split('T')[0];
    return {
      etiketa: d.toLocaleDateString('sq-AL', { weekday: 'short' }),
      numri: meKoha.filter((n) => n.koha.toDate().toISOString().split('T')[0] === ky).length,
    };
  });
  const max7 = Math.max(1, ...te7Ditet.map((x) => x.numri));

  const statBox = (vlera, etiketa, ngjyra = stiliTekstit) => (
    <div style={{ flex: 1, minWidth: '110px', padding: '14px', borderRadius: '14px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#f9fafb', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color: ngjyra }}>{vlera}</div>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#8e8e93' }}>{etiketa}</div>
    </div>
  );

  const barra = (emri, vlera, maks, ikona = '') => {
    const përqindja = maks > 0 ? Math.max(4, Math.round((vlera / maks) * 100)) : 0;
    return (
      <div key={emri} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
        <span style={{ fontSize: '13px', color: stiliTekstit, fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
          {ikona} {emri}
        </span>
        <div style={{ flex: 1, height: '12px', borderRadius: '6px', backgroundColor: darkMode ? '#2d2d2d' : '#f3f4f6', overflow: 'hidden' }}>
          <div style={{ width: përqindja + '%', height: '100%', borderRadius: '6px', background: 'linear-gradient(90deg, #3b82f6, #16a34a)' }} />
        </div>
        <b style={{ fontSize: '13px', color: '#3b82f6', minWidth: '30px', textAlign: 'right' }}>{vlera}</b>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Analitika 📊</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          Veprimet e përdoruesve live — {loading ? 'duke ngarkuar...' : `${total} ngjarje gjithsej`}
        </p>
      </div>

      {/* STATISTIKAT KRYESORE */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {statBox(total, 'NGJARJET GJITHSEJ')}
        {statBox(teSot, 'SË DITËS', '#3b82f6')}
        {statBox(ka('kërkim').length, 'KËRKIMET', '#16a34a')}
        {statBox(ka('hapje_biznesi').length, 'VIZITAT E BIZNESEVE', '#f59e0b')}
        {statBox(ka('vlerësim').length, 'VLERËSIMET E REJA', '#8b5cf6')}
      </div>

      {loading ? (
        <p style={{ color: '#8e8e93', fontSize: '14px' }}>Duke ngarkuar ngjarjet...</p>
      ) : total === 0 ? (
        <div style={{ padding: '30px', borderRadius: '18px', border: `1px dashed ${korniza}`, textAlign: 'center', color: '#8e8e93', fontSize: '14px' }}>
          Ende s\u2019ka ngjarje të regjistruara.<br />
          Sa herë që një përdorues bën një kërkim, hap një biznes, shtyp Navigo/Telefono ose vlerëson — do të shfaqet këtu.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* TOP BIZNESET */}
          <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>🏆 Bizneset më të vizituara</h3>
            {topBizneseLista.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8e8e93' }}>Ende s\u2019ka vizita.</p>
            ) : (
              topBizneseLista.map(([emri, numri]) => barra(emri, numri, topBizneseLista[0][1]))
            )}
          </div>

          {/* TOP KËRKIMET */}
          <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>🔍 Kërkimet më të bëra</h3>
            {topKerkimeLista.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8e8e93' }}>Ende s\u2019ka kërkime.</p>
            ) : (
              topKerkimeLista.map(([teksti, numri]) => barra(teksti, numri, topKerkimeLista[0][1], '🔎 '))
            )}
          </div>

          {/* VEPRAT */}
          <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>⚡ Veprat e përdoruesve</h3>
            {teVeprat.map((v) => barra(v[0], v[1], Math.max(1, ...teVeprat.map((x) => x[1]))))}
          </div>

          {/* 7 DITËT E FUNDIT */}
          <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>📅 7 ditët e fundit</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px' }}>
              {te7Ditet.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                  <b style={{ fontSize: '11px', color: '#3b82f6' }}>{d.numri > 0 ? d.numri : ''}</b>
                  <div style={{ width: '100%', maxWidth: '34px', height: Math.max(3, Math.round((d.numri / max7) * 70)) + 'px', borderRadius: '5px 5px 0 0', background: 'linear-gradient(180deg, #3b82f6, #60a5fa)' }} />
                  <span style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '700' }}>{d.etiketa}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analitika;
