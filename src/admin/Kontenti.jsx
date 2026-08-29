import { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { useKategorite, useQyteteve, useUrgjencave } from '../useKontenti';
import { useEventet, formatoDate } from '../eventet';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { regjistroAudit } from '../audit';

// KONTENTI — CRUD për Kategoritë, Qytete dhe Shërbimet e Urgjencës
// Këto listë e menaxhon admini PA ndryshuar kod (spec A17, A18, A21, Y1, Y10)
function Kontenti() {
  const { darkMode } = useContext(AppContext);
  const [tabi, setTabi] = useState('kategorite');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Kontenti 📦</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          Ndrysho kategoritë, qytetet dhe urgjencat — pa prekur asnjë rresht kodi
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[['kategorite', '🗂️ Kategoritë'], ['qytetet', '🏙️ Qytetet'], ['urgjenca', '🚨 Urgjenca'], ['eventet', '🎪 Eventet']].map(([id, etiketa]) => (
          <button key={id} onClick={() => setTabi(id)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: `1px solid ${tabi === id ? '#3b82f6' : korniza}`, backgroundColor: tabi === id ? '#3b82f6' : 'transparent', color: tabi === id ? '#fff' : stiliTekstit, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            {etiketa}
          </button>
        ))}
      </div>

      {tabi === 'kategorite' && <KategoriTab stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} stiliInputit={stiliInputit} />}
      {tabi === 'qytetet' && <QytetetTab stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} stiliInputit={stiliInputit} />}
      {tabi === 'urgjenca' && <UrgjenceTab stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} stiliInputit={stiliInputit} />}
      {tabi === 'eventet' && <EventetTab stiliKartelës={stiliKartelës} korniza={korniza} stiliTekstit={stiliTekstit} stiliInputit={stiliInputit} />}
    </div>
  );
}

// ===== KATEGORITË =====
function KategoriTab({ stiliKartelës, korniza, stiliTekstit, stiliInputit }) {
  const { lista } = useKategorite();
  const [emri, setEmri] = useState('');
  const [ikona, setIkona] = useState('');
  const [mesazhi, setMesazhi] = useState('');

  const shto = async (e) => {
    e.preventDefault();
    if (!emri.trim()) return;
    try {
      await addDoc(collection(db, 'kategorite'), { emri: emri.trim(), ikona: ikona.trim() || '📁' });
      regjistroAudit('kontent_kategori_shtim', { emri });
      setEmri(''); setIkona('');
      setMesazhi(`✅ "${emri.trim()}" u shtua.`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const fshi = async (k) => {
    if (!window.confirm(`Fshi kategorinë "${k.emri}"?`)) return;
    try {
      await deleteDoc(doc(db, 'kategorite', k.id));
      regjistroAudit('kontent_kategori_fshirje', { emri: k.emri });
      setMesazhi(`🗑️ "${k.emri}" u fshi.`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '20px' }}>
      <form onSubmit={shto} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={emri} onChange={(e) => setEmri(e.target.value)} placeholder="Emri i kategorisë (p.sh. Bakery)"
          style={{ flex: 2, minWidth: '160px', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input value={ikona} onChange={(e) => setIkona(e.target.value)} placeholder="Ikona (p.sh. 🥐)"
          style={{ flex: 1, minWidth: '90px', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <button type="submit" style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Shto</button>
      </form>
      {mesazhi && <p style={{ fontSize: '13px', fontWeight: '600' }}>{mesazhi}</p>}
      {lista.map((k) => (
        <div key={k.emri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${korniza}`, fontSize: '14px', color: stiliTekstit }}>
          <span>{k.ikona} {k.emri} {k.burimi === 'lokal' && <span style={{ fontSize: '10px', color: '#8e8e93' }}>(default)</span>}</span>
          {k.burimi === 'db' ? (
            <button onClick={() => fshi(k)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>🗑️</button>
          ) : null}
        </div>
      ))}
      <p style={{ fontSize: '11px', color: '#8e8e93', marginTop: '10px' }}>
        (default) = listat bazë të kodit — nuk mund të fshihen këtu, por mund të shtosh alternativa.
      </p>
    </div>
  );
}

// ===== QYTETET =====
function QytetetTab({ stiliKartelës, korniza, stiliTekstit, stiliInputit }) {
  const { lista } = useQyteteve();
  const [emri, setEmri] = useState('');
  const [mesazhi, setMesazhi] = useState('');

  const shto = async (e) => {
    e.preventDefault();
    if (!emri.trim()) return;
    try {
      await addDoc(collection(db, 'qytetet'), { emri: emri.trim() });
      regjistroAudit('kontent_qytet_shtim', { emri });
      setEmri('');
      setMesazhi(`✅ "${emri.trim()}" u shtua.`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const fshi = async (q) => {
    if (!window.confirm(`Fshi qytetin "${q.emri}"?`)) return;
    try {
      await deleteDoc(doc(db, 'qytetet', q.id));
      regjistroAudit('kontent_qytet_fshirje', { emri: q.emri });
      setMesazhi(`🗑️ "${q.emri}" u fshi.`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '20px' }}>
      <form onSubmit={shto} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input value={emri} onChange={(e) => setEmri(e.target.value)} placeholder="Qyteti (p.sh. Fushë Kosovë)"
          style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <button type="submit" style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Shto</button>
      </form>
      {mesazhi && <p style={{ fontSize: '13px', fontWeight: '600' }}>{mesazhi}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {lista.map((q) => (
          <span key={q.emri} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '16px', backgroundColor: 'transparent', border: `1px solid ${korniza}`, fontSize: '13px', color: stiliTekstit }}>
            📍 {q.emri}
            {q.burimi === 'db' ? (
              <button onClick={() => fshi(q)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>✕</button>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

// ===== URGJENCA =====
function UrgjenceTab({ stiliKartelës, korniza, stiliTekstit, stiliInputit }) {
  const { lista } = useUrgjencave();
  const [emri, setEmri] = useState('');
  const [numri, setNumri] = useState('');
  const [ikona, setIkona] = useState('');
  const [ngjyra, setNgjyra] = useState('#3b82f6');
  const [mesazhi, setMesazhi] = useState('');

  const shto = async (e) => {
    e.preventDefault();
    if (!emri.trim() || !numri.trim()) return;
    try {
      await addDoc(collection(db, 'emergencyServices'), { emri: emri.trim(), numri: numri.trim(), ikona: ikona.trim() || '', ngjyra: ngjyra });
      regjistroAudit('kontent_urgjence_shtim', { emri, numri });
      setEmri(''); setNumri(''); setIkona('');
      setMesazhi(`✅ "${emri.trim()}" u shtua.`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const fshi = async (u) => {
    if (!window.confirm(`Fshi shërbimin "${u.emri}"?`)) return;
    try {
      await deleteDoc(doc(db, 'emergencyServices', u.id));
      regjistroAudit('kontent_urgjence_fshirje', { emri: u.emri });
      setMesazhi(`🗑️ "${u.emri}" u fshi.`);
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '20px' }}>
      <form onSubmit={shto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <input value={emri} onChange={(e) => setEmri(e.target.value)} placeholder="Shërbimi (p.sh. QKMF)"
          style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input value={numri} onChange={(e) => setNumri(e.target.value)} placeholder="Numri (p.sh. 038-200000)"
          style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input value={ikona} onChange={(e) => setIkona(e.target.value)} placeholder="Ikona (p.sh. 🏥)"
          style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input type="color" value={ngjyra} onChange={(e) => setNgjyra(e.target.value)}
          style={{ padding: '4px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', cursor: 'pointer' }} />
        <button type="submit" style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Shto</button>
      </form>
      {mesazhi && <p style={{ fontSize: '13px', fontWeight: '600' }}>{mesazhi}</p>}
      {lista.map((u) => (
        <div key={u.emri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${korniza}`, fontSize: '14px', color: stiliTekstit }}>
          <span>{u.ikona} {u.emri} — <b style={{ color: u.ngjyra || '#3b82f6' }}>{u.numri}</b></span>
          {u.burimi === 'db' ? (
            <button onClick={() => fshi(u)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>🗑️</button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ===== EVENTE (U14, A20) =====
function EventetTab({ stiliKartelës, korniza, stiliTekstit, stiliInputit }) {
  const { lista, loading } = useEventet();
  const [form, setForm] = useState({ emri: '', qyteti: '', data: '', ora: '', kategoria: 'Muzikë', pershkrimi: '' });
  const [mesazhi, setMesazhi] = useState('');
  const ndrysho = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const shto = async (e) => {
    e.preventDefault();
    if (!form.emri.trim() || !form.data) { setMesazhi('⚠️ Emri dhe data janë të detyrueshme.'); return; }
    try {
      await addDoc(collection(db, 'events'), { ...form, ikona: '🎪' });
      regjistroAudit('kontent_event_shtim', { emri: form.emri });
      setForm({ emri: '', qyteti: '', data: '', ora: '', kategoria: 'Muzikë', pershkrimi: '' });
      setMesazhi('✅ Eventi u shtua.');
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const fshi = async (ev) => {
    if (!window.confirm(`Fshi eventin "${ev.emri}"?`)) return;
    try {
      await deleteDoc(doc(db, 'events', ev.id));
      regjistroAudit('kontent_event_fshirje', { emri: ev.emri });
      setMesazhi('🗑️ U fshi.');
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '20px' }}>
      <form onSubmit={shto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <input name="emri" value={form.emri} onChange={ndrysho} placeholder="Emri i eventit"
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input name="qyteti" value={form.qyteti} onChange={ndrysho} placeholder="Qyteti"
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input name="data" type="date" value={form.data} onChange={ndrysho}
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input name="ora" type="time" value={form.ora} onChange={ndrysho}
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <select name="kategoria" value={form.kategoria} onChange={ndrysho}
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
          {['Muzikë', 'Sport', 'Kulturë', 'Ushqim', 'Festival', 'Tjetër'].map((k) => <option key={k}>{k}</option>)}
        </select>
        <input name="pershkrimi" value={form.pershkrimi} onChange={ndrysho} placeholder="Përshkrim (opsional)"
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', gridColumn: '1 / -1' }} />
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Shto eventin</button>
          {mesazhi && <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: '700', color: mesazhi.startsWith('✅') ? '#16a34a' : '#ef4444' }}>{mesazhi}</span>}
        </div>
      </form>

      {loading ? <p style={{ color: '#8e8e93', fontSize: '13px' }}>Duke ngarkuar...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lista.map((ev) => (
            <div key={ev.emri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${korniza}`, gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: stiliTekstit }}>
                {ev.ikona || '🎪'} <b>{ev.emri}</b>
                <span style={{ color: '#8e8e93', fontSize: '12px' }}> · {ev.qyteti} · {formatoDate(ev.data)}{ev.burimi === 'lokal' ? ' (default)' : ''}</span>
              </span>
              {ev.burimi === 'db' ? (
                <button onClick={() => fshi(ev)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>🗑️</button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Kontenti;
