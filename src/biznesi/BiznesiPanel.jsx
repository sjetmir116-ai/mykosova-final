import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../AppContext';
import { useBizneset } from '../useBizneset';
import { useBookings, ndryshoStatusBooking } from '../useBookings';
import { useReviews } from '../useReviews';
import { usePaketa } from '../paketa';
import { useOfertat, shtoOferta, fshiOfertu, esOfertaAktive } from '../useOfertat';
import { db, fcn } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { regjistroAudit } from '../audit';
import { hapLinkun } from '../hapLinkun';

// ===== PANELI I BIZNESIT (spec B1-B11, B14-B17) =====
// Rruga: /biznesi — vetëm për përdorues që pronësojnë biznesë (uidPronari == uid)
function BiznesiPanel() {
  const { darkMode, përdoruesi } = useContext(AppContext);
  const navigate = useNavigate();
  const { bizneset } = useBizneset({ vetemAprovuar: false });
  const biznesetEte = bizneset.filter((b) => b.uidPronari === përdoruesi?.uid);
  const [biznesiAktual, setBiznesiAktual] = useState(null);
  const biznesi = biznesiAktual || biznesetEte[0] || null;
  const [seksioni, setSeksioni] = useState('përmbledhja');
  const { bookings } = useBookings(biznesi ? { biznesiEmri: biznesi.emri } : {});
  const { reviews } = useReviews(biznesi?.emri);
  const { paketa } = usePaketa();

  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';

  // GUARD: pa përdorues ose pa biznese
  if (!përdoruesi) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: darkMode ? '#111827' : '#f3f4f6', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderRadius: '24px', padding: '35px 30px', maxWidth: '420px', border: `1px solid ${korniza}` }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏢</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: stiliTekstit }}>Paneli i Biznesit</h2>
          <p style={{ fontSize: '14px', color: '#8e8e93', marginBottom: '18px' }}>Hypuni ose regjistrohuni për t'e hapur panelin e biznesit tuaj.</p>
          <button onClick={() => navigate('/')} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>← Kthehu te app-i</button>
        </div>
      </div>
    );
  }

  if (biznesetEte.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: darkMode ? '#111827' : '#f3f4f6', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderRadius: '24px', padding: '35px 30px', maxWidth: '440px', border: `1px solid ${korniza}` }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏢</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: stiliTekstit }}>Ende pa biznese</h2>
          <p style={{ fontSize: '14px', color: '#8e8e93', marginBottom: '18px', lineHeight: 1.6 }}>
            Ju ({përdoruesi.email}) s'keni asnjë biznes të regjistruar.
            Regjistrojeni biznesin tuaj te app-i (butoni "Shto Biznes") — pas miratimit do ta menaxhoni këtu.
          </p>
          <button onClick={() => navigate('/')} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>← Regjistro biznesin</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#111827' : '#f3f4f6', fontFamily: 'system-ui, sans-serif', display: 'flex', flexWrap: 'wrap' }}>
      {/* Sidebar */}
      <aside style={{ width: '230px', minWidth: '230px', backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', borderRight: `1px solid ${korniza}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>🏢</span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: stiliTekstit }}>MyKosova</div>
            <div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600' }}>PANELI I BIZNESIT</div>
          </div>
        </div>

        {/* Zgjedhja e biznesit (nëse ka shumë) */}
        {biznesetEte.length > 1 && (
          <select value={biznesi?.id} onChange={(e) => setBiznesiAktual(biznesetEte.find((b) => b.id === e.target.value))}
            style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#ffffff', color: stiliTekstit, fontSize: '13px', marginBottom: '8px', cursor: 'pointer' }}>
            {biznesetEte.map((b) => <option key={b.id} value={b.id}>{b.emri}</option>)}
          </select>
        )}

        {[
          ['përmbledhja', '📊 Përmbledhja'],
          ['profili', '📝 Profili'],
          ['ofertat', '🎁 Ofertat'],
          ['rezervimet', '📅 Rezervimet'],
          ['paketa', '💳 Paketa'],
        ].map(([id, etiketa]) => (
          <button key={id} onClick={() => setSeksioni(id)}
            style={{ textAlign: 'left', padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
              backgroundColor: seksioni === id ? '#3b82f6' : 'transparent', color: seksioni === id ? '#fff' : stiliTekstit }}>
            {etiketa}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: `1px solid ${korniza}`, paddingTop: '14px', fontSize: '12px', color: '#8e8e93' }}>
          <div style={{ fontWeight: '700', color: stiliTekstit }}>👤 {përdoruesi.emri}</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{përdoruesi.email}</div>
        </div>
        <button onClick={() => navigate('/')} style={{ padding: '10px 14px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: '#8e8e93', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          ← Kthehu te app-i
        </button>
      </aside>

      {/* Përmbajtja */}
      <main style={{ flex: 1, minWidth: '300px', padding: '28px', maxWidth: '1000px' }}>
        {seksioni === 'përmbledhja' && <Përmbledhja biznesi={biznesi} bookings={bookings} reviews={reviews} paketa={paketa} darkMode={darkMode} stiliTekstit={stiliTekstit} korniza={korniza} />}
        {seksioni === 'profili' && <Profilli biznesi={biznesi} darkMode={darkMode} stiliTekstit={stiliTekstit} korniza={korniza} />}
        {seksioni === 'ofertat' && <Ofertat biznesi={biznesi} darkMode={darkMode} stiliTekstit={stiliTekstit} korniza={korniza} />}
        {seksioni === 'rezervimet' && <Rezervimet bookings={bookings} darkMode={darkMode} stiliTekstit={stiliTekstit} korniza={korniza} />}
        {seksioni === 'paketa' && <Paketa bizneseve={biznesi} paketa={paketa} darkMode={darkMode} stiliTekstit={stiliTekstit} korniza={korniza} />}
      </main>
    </div>
  );
}

// ===== PËRMBLIEDHJA (B3) =====
function Përmbledhja({ biznesi, bookings, reviews, paketa, darkMode, stiliTekstit, korniza }) {
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const stats = [
    ['👁️', 'Vizitat', biznesi.shikime || 0],
    ['📞', 'Telefonata', biznesi.klikTelefoni || 0],
    ['💬', 'WhatsApp', biznesi.klikWhatsApp || 0],
    ['🧭', 'Navigo', biznesi.klikNavigo || 0],
    ['⭐', 'Vlerësime', reviews.length],
    ['📅', 'Rezervime', bookings.length],
  ];
  const rezervimetAktive = bookings.filter((b) => b.status !== 'anuluar').length;
  const paketaInfo = paketa[biznesi.paketa] || paketa.basic;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>{biznesi.emri}</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          {biznesi.kategoria} · 📍 {biznesi.qyteti} · Paketa: <b style={{ color: paketaInfo.ngjyra }}>{paketaInfo.ikona} {paketaInfo.emri}</b>
        </p>
      </div>
      {biznesi.status === 'pendshe' && (
        <div style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: '#f59e0b15', border: '1px solid #f59e0b40', color: '#f59e0b', fontSize: '13px', fontWeight: '700' }}>
          ⏳ Biznesi është ende në pranim — nuk e shoh publiku deri sa admini ta miratojë.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {stats.map(([ikona, etiketa, vlera]) => (
          <div key={etiketa} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '20px' }}>{ikona}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: stiliTekstit, marginTop: '4px' }}>{vlera}</div>
            <div style={{ fontSize: '12px', color: '#8e8e93', fontWeight: '600' }}>{etiketa}</div>
          </div>
        ))}
      </div>
      {rezervimetAktive > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: '#3b82f615', border: '1px solid #3b82f640', color: '#3b82f6', fontSize: '13px', fontWeight: '700' }}>
          📅 Keni {rezervimetAktive} rezervime aktive — shikoji te seksioni "Rezervimet".
        </div>
      )}
    </div>
  );
}

// ===== PROFILI (B4) =====
function Profili({ biznesi, darkMode, stiliTekstit, korniza }) {
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';
  const [form, setForm] = useState({
    emri: biznesi.emri || '', pershkrimi: biznesi.pershkrimi || '', adresa: biznesi.adresa || '',
    telefoni: biznesi.telefoni || '', whatsapp: biznesi.whatsapp || '', website: biznesi.website || '',
    foto: biznesi.foto || '', oferta: biznesi.oferta || '', orari: biznesi.orari || '', sherbimet: biznesi.sherbimet || '',
  });
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [mesazhi, setMesazhi] = useState('');
  const ndrysho = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const ruaj = async (e) => {
    e.preventDefault();
    setDukeRuajtur(true);
    setMesazhi('');
    try {
      await updateDoc(doc(db, 'bizneset', biznesi.id), { ...form });
      regjistroAudit('biznesi_profil_ndryshim', { emri: biznesi.emri });
      setMesazhi('✅ Profili u ruajt.');
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    } finally {
      setDukeRuajtur(false);
    }
  };

  const fusha = (etiketa, fushaEmri, tipi = 'text', placeholder = '') => (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>{etiketa}</label>
      <input type={tipi} name={fushaEmri} value={form[fushaEmri]} onChange={ndrysho} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '22px' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '800', color: stiliTekstit }}>📝 Profili i biznesit</h2>
      {typeof biznesi.id !== 'string' || biznesi.id.length <= 8 ? (
        <p style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ Ky biznes është ende lokal (pa dokument cloud) — admini duhet ta ngarkojë në cloud nga Paneli Admin për ta bërë të editueshëm këtu.
        </p>
      ) : (
        <form onSubmit={ruaj} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {fusha('Emri', 'emri', 'text')}
          {fusha('Adresa', 'adresa', 'text')}
          {fusha('Telefoni', 'telefoni', 'tel')}
          {fusha('WhatsApp', 'whatsapp', 'tel')}
          {fusha('Website', 'website', 'url')}
          {fusha('Foto (URL)', 'foto', 'url')}
          {fusha('Orari (p.sh. 08:00-22:00)', 'orari', 'text')}
          {fusha('Oferta aktuale', 'oferta', 'text')}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Përshkrimi</label>
            <textarea name="pershkrimi" value={form.pershkrimi} onChange={ndrysho} rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Shërbimet (të ndara me presje)</label>
            <input type="text" name="sherbimet" value={form.sherbimet} onChange={ndrysho} placeholder="p.sh. Kafe, Ushqim, Evente private"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="submit" disabled={dukeRuajtur}
              style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: dukeRuajtur ? 0.6 : 1 }}>
              {dukeRuajtur ? 'Duke ruajtur...' : '💾 Ruaj ndryshimet'}
            </button>
            <span style={{ fontSize: '13px', fontWeight: '700', color: mesazhi.startsWith('✅') ? '#16a34a' : '#ef4444' }}>{mesazhi}</span>
          </div>
        </form>
      )}
    </div>
  );
}

// ===== REZERVIMET (B9, K4-K6) me KALENDAR VIZUAL (K4) =====
function KalendarRezervimeve({ bookings, diteZgjedhur, setDiteZgjedhur, darkMode, stiliTekstit, korniza }) {
  const sot = new Date();
  const [pozicioni, setPozicionin] = useState({ y: sot.getFullYear(), m: sot.getMonth() });

  // Numëron rezervimet sipas ditës
  const numrat = {};
  bookings.forEach((b) => { if (b.data) numrat[b.data] = (numrat[b.data] || 0) + 1; });

  const diteNeMuaj = new Date(pozicioni.y, pozicioni.m + 1, 0).getDate();
  const fillimi = new Date(pozicioni.y, pozicioni.m, 1).getDay(); // 0 = Diel
  const kyceDites = (d) => `${pozicioni.y}-${String(pozicioni.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const emriMuajit = new Date(pozicioni.y, pozicioni.m, 1).toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' });
  const diteSot = kyceDites(sot.getDate());

  const qetoMuajin = (delta) => {
    const d = new Date(pozicioni.y, pozicioni.m + delta, 1);
    setPozicionin({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div style={{ backgroundColor: darkMode ? '#111827' : '#f9fafb', border: `1px solid ${korniza}`, borderRadius: '14px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={() => qetoMuajin(-1)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: stiliTekstit }}>←</button>
        <b style={{ fontSize: '13px', color: stiliTekstit, textTransform: 'capitalize' }}>{emriMuajit}</b>
        <button onClick={() => qetoMuajin(1)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: stiliTekstit }}>→</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {['Di', 'Hë', 'Ma', 'Më', 'En', 'Sh', 'Di'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '800', color: '#8e8e93' }}>{d}</div>
        ))}
        {Array.from({ length: fillimi }).map((_, i) => <div key={'f' + i} />)}
        {Array.from({ length: diteNeMuaj }).map((_, i) => {
          const d = i + 1;
          const kyç = kyceDites(d);
          const ka = numrat[kyç] || 0;
          const zgjedhur = diteZgjedhur === kyç;
          return (
            <button key={kyç} onClick={() => setDiteZgjedhur(zgjedhur ? null : kyç)}
              style={{
                position: 'relative', aspectRatio: '1', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '700',
                backgroundColor: zgjedhur ? '#3b82f6' : ka > 0 ? '#16a34a25' : 'transparent',
                color: zgjedhur ? '#fff' : ka > 0 ? '#16a34a' : stiliTekstit,
                outline: kyç === diteSot ? '2px solid #3b82f6' : 'none', outlineOffset: '-2px',
              }}>
              {d}
              {ka > 0 && <span style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '9px', fontWeight: '800', color: zgjedhur ? '#fff' : '#16a34a' }}>{ka}</span>}
            </button>
          );
        })}
      </div>
      {diteZgjedhur && (
        <button onClick={() => setDiteZgjedhur(null)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
          ✕ Shfaqi filtrin e ditës
        </button>
      )}
    </div>
  );
}

function Rezervimet({ bookings, darkMode, stiliTekstit, korniza }) {
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const ngjyraStatusi = { pendshe: '#f59e0b', konfirmuar: '#16a34a', anuluar: '#ef4444' };
  const [diteZgjedhur, setDiteZgjedhur] = useState(null);
  const teFiltruara = diteZgjedhur ? bookings.filter((b) => b.data === diteZgjedhur) : bookings;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: stiliTekstit }}>📅 Rezervimet ({bookings.length})</h2>
      <KalendarRezervimeve bookings={bookings} diteZgjedhur={diteZgjedhur} setDiteZgjedhur={setDiteZgjedhur} darkMode={darkMode} stiliTekstit={stiliTekstit} korniza={korniza} />
      {bookings.length === 0 ? (
        <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#8e8e93', fontSize: '14px' }}>
          Ende asnjë rezervim. Kur një përdorues rezervon te biznesi juaj, do të shfaqet këtu.
        </div>
      ) : teFiltruara.length === 0 ? (
        <div style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '20px', textAlign: 'center', color: '#8e8e93', fontSize: '14px' }}>
          Asnjë rezervim për këtë ditë.
        </div>
      ) : (
        teFiltruara.map((b) => (
          <div key={b.id} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <b style={{ fontSize: '14px', color: stiliTekstit }}>{b.përdoruesiEmri}</b>
                <span style={{ fontSize: '12px', color: ngjyraStatusi[b.status] || '#8e8e93', fontWeight: '800', marginLeft: '10px', textTransform: 'uppercase' }}>
                  {b.status === 'pendshe' ? '⏳ Në pranim' : b.status === 'konfirmuar' ? '✅ E konfirmuar' : '❌ E anuluar'}
                </span>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
                  📅 {b.data} {b.ora && `· ${b.ora}`} · 👥 {b.guest} guest{b.dhoma && b.dhoma !== '1' ? ` · 🛏️ ${b.dhoma} dhoma` : ''}
                </p>
                {b.shenim && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8e8e93', fontStyle: 'italic' }}>"{b.shenim}"</p>}
              </div>
              {b.status === 'pendshe' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => ndryshoStatusBooking(b.id, 'konfirmuar').catch((e) => alert(e.message))}
                    style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                    ✓ Konfirmo
                  </button>
                  <button onClick={() => ndryshoStatusBooking(b.id, 'anuluar').catch((e) => alert(e.message))}
                    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                    ✗ Anulo
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ===== PAKETAT (B13-B17) =====
function Paketa({ bizneseve, paketa, darkMode, stiliTekstit, korniza }) {
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const aktuale = bizneseve.paketa || 'basic';
  const statusi = bizneseve.paketaStatus || '';
  const [dukeVepruar, setDukeVepruar] = useState(null);
  const [mesazhi, setMesazhi] = useState('');

  const NGJYRA_STATUSI = {
    active: { ngjyra: '#16a34a', teksti: 'ACTIVE' },
    overdue: { ngjyra: '#f59e0b', teksti: 'PAGESA E VONUAR (grace 7 ditë)' },
    expiring: { ngjyra: '#3b82f6', teksti: 'MBARON NË FUND TË PERIODIT' },
    canceled: { ngjyra: '#8e8e93', teksti: 'I ANULUAR' },
    none: { ngjyra: '#8e8e93', teksti: 'SË ERE' },
  };
  const stStatus = NGJYRA_STATUSI[statusi] || NGJYRA_STATUSI.none;

  // NIS PAGESËN — callable server-side → URL i Paddle-it → redirect
  const nisPaketen = async (paketaEre) => {
    if (!bizneseve.uidPronari) { setMesazhi('⚠️ Ky biznes nuk ka pronar të lidhur me një llogari.'); return; }
    setDukeVepruar(paketaEre);
    setMesazhi('');
    try {
      const res = await fcn.https.onCall('nisPagesen')({ biznesiId: bizneseve.id, paketa: paketaEre });
      // Kthehu prapa te app-i pas mbarimit të pagesës
      window.location.href = res.data.url;
    } catch (err) {
      const teksti = err?.error?.message || err?.message || String(err);
      setMesazhi('❌ ' + teksti);
      setDukeVepruar(null);
    }
  };

  // PORTALI I PADDLE (ri-novim / kartela / anulim nga faqja e Paddle)
  const hapPortali = async () => {
    setDukeVepruar('portal');
    setMesazhi('');
    try {
      const res = await fcn.https.onCall('hapPortalin')({});
      hapLinkun(res.data.url);
    } catch (err) {
      setMesazhi('❌ ' + (err?.message || err));
    } finally {
      setDukeVepruar(null);
    }
  };

  // ANULO — në fund të periodit (v1)
  const anulo = async () => {
    if (!window.confirm('Të anulohet abeti ' + paketa[aktuale]?.emri + '? Përfundon në fund të periodit aktual (s\u2019ka pagesë e kthyer për periudhën e përdorur).')) return;
    setDukeVepruar('anulo');
    setMesazhi('');
    try {
      const res = await fcn.https.onCall('anuloSubscription')({ biznesiId: bizneseve.id, menjehere: false });
      setMesazhi('✅ Abeti u anulua — ' + (res?.data?.statusi === 'expiring' ? 'paketa mbaron në fund të periodit.' : 'u anulua.'));
    } catch (err) {
      setMesazhi('❌ ' + (err?.error?.message || err?.message || err));
    } finally {
      setDukeVepruar(null);
    }
  };

  const kaPaketeEPlate = aktuale !== 'basic' && statusi !== 'canceled' && statusi !== 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: stiliTekstit }}>💳 Paketat</h2>

      {kaPaketeEPlate && (
        <div style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: stStatus.ngjyra + '15', border: `1px solid ${stStatus.ngjyra}40`, color: stStatus.ngjyra, fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>
            Statusi: {paketa[aktuale]?.ikona} {paketa[aktuale]?.emri} — {stStatus.teksti}
          </span>
          <span style={{ display: 'flex', gap: '8px' }}>
            <button onClick={hapPortali} disabled={dukeVepruar === 'portal'}
              style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid ' + stStatus.ngjyra, backgroundColor: 'transparent', color: stStatus.ngjyra, fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              {dukeVepruar === 'portal' ? 'Duke hapur...' : '⚙️ Mbro (Paddle)'}
            </button>
            <button onClick={anulo} disabled={dukeVepruar === 'anulo'}
              style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              {dukeVepruar === 'anulo' ? 'Duke anuluar...' : '✗ Anulo'}
            </button>
          </span>
        </div>
      )}

      {mesazhi && (
        <div style={{ padding: '12px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', backgroundColor: mesazhi.startsWith('❌') ? '#ef444415' : '#16a34a15', color: mesazhi.startsWith('❌') ? '#ef4444' : '#16a34a', border: `1px solid ${mesazhi.startsWith('❌') ? '#ef444440' : '#16a34a40'}` }}>
          {mesazhi}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {Object.entries(paketa).map(([kyç, p]) => {
          const esAktuale = kyç === aktuale;
          const esPaguajshme = kyç !== 'basic';
          return (
            <div key={kyç} style={{ backgroundColor: stiliKartelës, border: `2px solid ${esAktuale ? p.ngjyra : korniza}`, borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b style={{ fontSize: '16px', color: p.ngjyra, fontWeight: '800' }}>{p.ikona} {p.emri}</b>
                {esAktuale && <span style={{ fontSize: '10px', fontWeight: '800', color: p.ngjyra, backgroundColor: p.ngjyra + '15', padding: '3px 8px', borderRadius: '6px' }}>AKTUALE</span>}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: stiliTekstit, marginBottom: '12px' }}>
                {p.cmimi === 0 ? 'FALAS' : `${p.cmimi}€`}
                <span style={{ fontSize: '12px', color: '#8e8e93', fontWeight: '600' }}> / {p.period}</span>
              </div>
              <ul style={{ margin: '0 0 16px 0', paddingLeft: '16px', fontSize: '12px', color: '#8e8e93', lineHeight: 1.8, flex: 1 }}>
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              {esPaguajshme && !esAktuale && (
                <button onClick={() => nisPaketen(kyç)} disabled={dukeVepruar !== null}
                  style={{ backgroundColor: p.ngjyra, color: '#fff', border: 'none', padding: '11px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', opacity: dukeVepruar !== null ? 0.6 : 1 }}>
                  {dukeVepruar === kyç ? 'Duke përgatitur pagesën...' : 'Zgjidh ' + p.emri + ' → ' + p.cmimi + '€/muaj'}
                </button>
              )}
              {esPaguajshme && esAktuale && kaPaketeEPlate && (
                <p style={{ margin: 0, fontSize: '12px', color: stStatus.ngjyra, fontWeight: '700' }}>
                  ✓ E përdorur tani — mbajeni ose anuloni sipër
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '12px', color: '#8e8e93', lineHeight: 1.6 }}>
        ℹ️ Pas pagesës te faqja e Paddle, kthehu këtu — <b>statusi përditësohet automatikisht</b> (webhook server-side).
        <br />ℹ️ Çmimet dhe features-i i paketeve i menaxhon admini (te Paddle + Paneli Admin → Paketa, pa ndryshuar kod).
      </p>
    </div>
  );
}

// ===== OFERTAT (B8, D10) =====
function Ofertat({ biznesi, darkMode, stiliTekstit, korniza }) {
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';
  const { aktive, skaduar, loading } = useOfertat(biznesi.emri);
  const [form, setForm] = useState({ lloji: 'zbritje', teksti: '', cmimiVjete: '', cmimiIri: '', vlenDeri: '' });
  const [mesazhi, setMesazhi] = useState('');
  const ndrysho = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const shto = async (e) => {
    e.preventDefault();
    if (!form.teksti.trim()) { setMesazhi('⚠️ Shkruani përshkrimin e ofertës.'); return; }
    setMesazhi('');
    try {
      await shtoOferta({ biznesiEmri: biznesi.emri, uidPronari: biznesi.uidPronari, ...form });
      regjistroAudit('biznesi_oferta_shtim', { emri: biznesi.emri, teksti: form.teksti });
      setForm({ lloji: 'zbritje', teksti: '', cmimiVjete: '', cmimiIri: '', vlenDeri: '' });
      setMesazhi('✅ Oferta u publikua.');
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const fshi = async (o) => {
    if (!window.confirm('Të fshihet kjo ofertë?')) return;
    try {
      await fshiOfertu(o.id);
      regjistroAudit('biznesi_oferta_fshirje', { emri: biznesi.emri, teksti: o.teksti });
      setMesazhi('🗑️ Oferta u fshi.');
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    }
  };

  const kartelaOferte = (o, aktiv) => (
    <div key={o.id} style={{ backgroundColor: stiliKartelës, border: `1px solid ${aktiv ? '#16a34a40' : korniza}`, borderRadius: '14px', padding: '14px', opacity: aktiv ? 1 : 0.6, display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      <div>
        <b style={{ fontSize: '14px', color: stiliTekstit }}>
          {o.lloji === 'zbritje' ? '🏷️' : o.lloji === 'ditore' ? '⚡' : o.lloji === 'sezonal' ? '🌤️' : '🎁'} {o.teksti}
        </b>
        {(o.cmimiVjete || o.cmimiIri) && (
          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            {o.cmimiVjete && <s style={{ color: '#8e8e93' }}>{o.cmimiVjete}€</s>}
            {o.cmimiIri && <b style={{ color: '#16a34a', marginLeft: o.cmimiVjete ? '8px' : 0 }}>{o.cmimiIri}€</b>}
          </p>
        )}
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: aktiv ? '#16a34a' : '#8e8e93', fontWeight: '700' }}>
          {aktiv ? `Aktive${o.vlenDeri ? ` deri më ${o.vlenDeri}` : ' (e përhershme)'}` : `E skaduar ${o.vlenDeri}`}
        </p>
      </div>
      <button onClick={() => fshi(o)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>🗑️</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: stiliTekstit }}>🎁 Ofertat ({aktive.length} aktive)</h2>

      {/* Forma e reja */}
      <form onSubmit={shto} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <select name="lloji" value={form.lloji} onChange={ndrysho}
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', cursor: 'pointer' }}>
          <option value="zbritje">🏷️ Zbritje %</option>
          <option value="special">💎 Çmim special</option>
          <option value="ditore">⚡ Ofertë ditore</option>
          <option value="javore">📆 Ofertë javore</option>
          <option value="sezonal">🌤️ Seasonal</option>
          <option value="lastminute">⏰ Last minute</option>
          <option value="pakete">🎁 Paketë</option>
        </select>
        <input name="cmimiVjete" type="number" min="0" step="any" value={form.cmimiVjete} onChange={ndrysho} placeholder="Çmimi i vjetër (€)"
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input name="cmimiIri" type="number" min="0" step="any" value={form.cmimiIri} onChange={ndrysho} placeholder="Çmimi i ri (€)"
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input name="vlenDeri" type="date" value={form.vlenDeri} onChange={ndrysho}
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none' }} />
        <input name="teksti" value={form.teksti} onChange={ndrysho} placeholder="P.sh. 20% zbritje për grupe mbi 4 persona"
          style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${stiliInputit}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', gridColumn: '1 / -1' }} />
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="submit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Publiko ofertën</button>
          {mesazhi && <span style={{ fontSize: '13px', fontWeight: '700', color: mesazhi.startsWith('✅') ? '#16a34a' : mesazhi.startsWith('🗑') ? stiliTekstit : '#ef4444' }}>{mesazhi}</span>}
        </div>
      </form>

      {loading ? <p style={{ color: '#8e8e93' }}>Duke ngarkuar...</p> : (
        <>
          {aktive.length === 0 && skaduar.length === 0 && (
            <p style={{ color: '#8e8e93', fontSize: '13px' }}>Ende s\u2019keni asnjë ofertë — krijojeni sipër. Shfaqet te profili i biznesit + te AI-ja.</p>
          )}
          {aktive.map((o) => kartelaOferte(o, true))}
          {skaduar.map((o) => kartelaOferte(o, false))}
        </>
      )}
    </div>
  );
}

export default BiznesiPanel;
