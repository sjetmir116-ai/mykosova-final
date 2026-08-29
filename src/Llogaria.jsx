import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { regjistroPërdoruesin, hyrPërdoruesin, dali } from './auth';
import { useFavorites } from './useFavorites';
import { useBizneset } from './useBizneset';
import { useBookings } from './useBookings';
import { db, auth } from './firebase';
import { getDoc, getDocs, query, where, collection, doc, deleteDoc } from 'firebase/firestore';
import { regjistroAudit } from './audit';

// FAQJA E LLOGARISË — regjistrim, hyrje dhe profili i përdoruesit
function Llogaria() {
  const { darkMode, përdoruesi, t, gjuha, setBiznesiIzgjedhur } = useContext(AppContext);
  const { ruajtur, alterno } = useFavorites();
  const { bizneset } = useBizneset();
  const { bookings } = useBookings(përdoruesi ? { përdoruesiUid: përdoruesi.uid } : {});
  const biznesetIruajtura = bizneset.filter((b) => ruajtur.some((r) => r.toLowerCase() === String(b.emri).toLowerCase()));

  // ===== L6 — EKSPORTIMI I TË DHËNAVE (GDPR: "Data export") =====
  const eksportoTeDhenat = async () => {
    try {
      const [favSnap, revSnap, bokSnap, tripSnap] = await Promise.all([
        getDoc(doc(db, 'favorites', përdoruesi.uid)),
        getDocs(query(collection(db, 'reviews'), where('uid', '==', përdoruesi.uid))),
        getDocs(query(collection(db, 'bookings'), where('përdoruesiUid', '==', përdoruesi.uid))),
        getDocs(collection(db, 'trips', përdoruesi.uid)),
      ]);
      const teDhenat = {
        llogaria: { email: përdoruesi.email, emri: përdoruesi.emri, roli: përdoruesi.roli },
        favorites: favSnap.exists() ? favSnap.data().bizneset : [],
        vleresimet: revSnap.docs.map((d) => d.data()),
        rezervimet: bokSnap.docs.map((d) => d.data()),
        tripet: tripSnap.docs.map((d) => d.data()),
        eksportuarM: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(teDhenat, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mykosova-te-dhenat-${përdoruesi.email}.json`;
      a.click();
      URL.revokeObjectURL(url);
      regjistroAudit('llogaria_eksport', { email: përdoruesi.email });
    } catch (err) {
      alert('Gabim te eksporti: ' + err.message);
    }
  };

  // ===== L4/L5 — FSHIRJA E LLOGARISË (me dy konfirmime) =====
  const fshiLlogarine = async () => {
    if (!window.confirm('Të fshihet VËRT llogaria juaj? Kjo veprim nuk kthehet.')) return;
    const emaili = window.prompt('Shkruani email-in tuaj për t\u2019e konfirmuar: ' + përdoruesi.email);
    if (emaili !== përdoruesi.email) { alert('Email-i nuk përputhet — u anulua.'); return; }
    try {
      regjistroAudit('llogaria_fshirje', { email: përdoruesi.email });
      await deleteDoc(doc(db, 'përdoruesit', përdoruesi.uid));
      await auth.currentUser?.delete();
      alert('✅ Llogaria u fshi. (Vlerësimet historike mbeten të regjistruara si anonime.)');
    } catch (err) {
      alert('Gabim te fshirja: ' + err.message);
    }
  };
  const [modali, setModali] = useState('regjistro'); // 'regjistro' | 'hyrje'
  const [emri, setEmri] = useState('');
  const [email, setEmail] = useState('');
  const [fjalëkalimi, setFjalëkalimi] = useState('');
  const [dukeDërguar, setDukeDërguar] = useState(false);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';

  // ===== PROFILI (kur është loguar) =====
  if (përdoruesi) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: stiliKartelës, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: `1px solid ${korniza}`, padding: '30px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', fontSize: '30px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
            {(përdoruesi.emri || 'P')[0].toUpperCase()}
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: stiliTekstit }}>{përdoruesi.emri}</h2>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#8e8e93' }}>{përdoruesi.email}</p>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', backgroundColor: përdoruesi.roli === 'admin' ? '#dc262620' : përdoruesi.roli === 'iPezulluar' ? '#6b728020' : '#3b82f620', color: përdoruesi.roli === 'admin' ? '#dc2626' : përdoruesi.roli === 'iPezulluar' ? '#6b7280' : '#3b82f6' }}>
            {përdoruesi.roli === 'admin' ? '🛡️ ADMIN' : përdoruesi.roli === 'iPezulluar' ? '⛔ E PEZULLUAR' : '👤 PERDORUES'}
          </span>
          {përdoruesi.roli === 'iPezulluar' && (
            <p style={{ margin: '10px 0 0 0', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#6b728015', border: '1px solid #6b728040', color: '#6b7280', fontSize: '13px', fontWeight: '600' }}>
              ⛔ Llogaria juaj është e pezulluar nga admini. S' mund të shtoni vlerësime ose rezervime. Kontaktoni mbështetjen.
            </p>
          )}

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#8e8e93', lineHeight: 1.6 }}>
              ✅ Me llogarinë tuaj do të mund të ruani favorites, të vini re biznese dhe të keni history
              (këto hapen te fazat e ardhshme — <b>Phase 2</b>).
            </p>
            {përdoruesi.roli === 'admin' && (
              <p style={{ margin: 0, fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                Ju keni akses te Paneli Admin (butoni ⚙️ te navbar).
              </p>
            )}

            {/* FAVORITES */}
            <div style={{ textAlign: 'left', border: `1px solid ${korniza}`, borderRadius: '16px', padding: '16px', marginTop: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: stiliTekstit }}>
                ❤️ Favorites tuaja {biznesetIruajtura.length > 0 && <span style={{ color: '#8e8e93', fontSize: '12px' }}>({biznesetIruajtura.length})</span>}
              </h3>
              {biznesetIruajtura.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: '#8e8e93' }}>
                  Ende s'keni asgjë të ruajtur. Hapni një biznes dhe shtypni zemrën 🤍.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {biznesetIruajtura.map((b) => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => setBiznesiIzgjedhur(b)}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
                        🏢 {b.emri}
                        <span style={{ color: '#8e8e93', fontWeight: '500', fontSize: '11px' }}> · {b.qyteti}</span>
                      </button>
                      <button onClick={() => alterno(b.emri)} title="Hiq nga favorites"
                        style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer' }}>
                        ❤️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REZERVIMET */}
            <div style={{ textAlign: 'left', border: `1px solid ${korniza}`, borderRadius: '16px', padding: '16px', marginTop: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: stiliTekstit }}>
                📅 Rezervimet tuaja {bookings.length > 0 && <span style={{ color: '#8e8e93', fontSize: '12px' }}>({bookings.length})</span>}
              </h3>
              {bookings.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: '#8e8e93' }}>
                  Ende s'keni rezervime. Rezervoni një hotel apo tavolinë nga profili i biznesit (butoni "Rezervo tani").
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {bookings.map((b) => {
                    const ngjyra = b.status === 'pendshe' ? '#f59e0b' : b.status === 'konfirmuar' ? '#16a34a' : '#ef4444';
                    return (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span style={{ color: stiliTekstit }}>
                          🏢 {b.biznesiEmri}
                          <span style={{ color: '#8e8e93', fontSize: '11px' }}> · {b.data}{b.ora ? ' ' + b.ora : ''} · {b.guest} pers.</span>
                        </span>
                        <b style={{ color: ngjyra, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          {b.status === 'pendshe' ? '⏳ Në pranim' : b.status === 'konfirmuar' ? '✅ Konfirmuar' : '❌ Anuluar'}
                        </b>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MBJETET JURIDIKORE (spec L4, L5, L6) */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button onClick={eksportoTeDhenat}
                style={{ flex: 1, backgroundColor: 'transparent', border: `1px solid ${korniza}`, color: stiliTekstit, padding: '11px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                📤 Eksporto të dhënat e mia
              </button>
              <button onClick={fshiLlogarine}
                style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '11px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                🗑️ Fshi llogarinë
              </button>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#8e8e93', lineHeight: 1.5 }}>
              Eksporti: kopje JSON e të gjitha të dhënave tuaja (vlerësime, rezervime, favorites, tripe).
              Fshirja: heq llogarinë + credentials (vlerësimet historike mbeten anonime).
            </p>

            <button
              onClick={() => dali().catch(() => {})}
              style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}
            >
              Dal nga llogaria
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== FORMAT E HYRJES / REGJISTRIMIT =====
  const dërgo = async (e) => {
    e.preventDefault();
    setDukeDërguar(true);
    setMesazhi({ tekst: '', gabim: false });
    try {
      const profil = modali === 'regjistro'
        ? await regjistroPërdoruesin({ emri, email, fjalëkalimi })
        : await hyrPërdoruesin({ email, fjalëkalimi });
      setMesazhi({ tekst: modali === 'regjistro' ? `Mirë se vini, ${profil.emri}! 🎉` : 'Hyrje me sukses! ✅', gabim: false });
      setEmail('');
      setFjalëkalimi('');
      setEmri('');
      // Profili përditësohet automatikisht nga AppContext (onAuthStateChanged)
    } catch (err) {
      const m = err?.code || err?.message || String(err);
      let teksti = 'Gabim: ' + m;
      if (m.includes('email-already-in-use')) teksti = 'Ky email është regjistruar tashmë — provoni hyrjen.';
      else if (m.includes('user-not-found')) teksti = 'Email-i nuk u gjet. Regjistrohuni fillimisht.';
      else if (m.includes('wrong-password') || m.includes('invalid-credential')) teksti = 'Fjalëkalim i pasaktë.';
      else if (m.includes('weak-password')) teksti = 'Fjalëkalimi duhet të ketë të paktën 6 shenja.';
      else if (m.includes('operation-not-allowed')) teksti = 'Hyrja me Email/Fjalëkalim s\u2019është aktivizuar te Firebase Console (Authentication → Email/Password).';
      else if (m.includes('network')) teksti = 'S\u2019u arrit Firebase — kontrollojeni internetin.';
      setMesazhi({ tekst: teksti, gabim: true });
    } finally {
      setDukeDërguar(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ backgroundColor: stiliKartelës, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: `1px solid ${korniza}`, padding: '30px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', textAlign: 'center', color: stiliTekstit }}>Llogaria juaj 👤</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#8e8e93', textAlign: 'center' }}>
          Ruaj favorites, vlerëso biznese dhe ndiq rezervimet (Phase 2+)
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[['regjistro', 'Regjistrohu'], ['hyrje', 'Hyr']].map(([id, etiketa]) => (
            <button key={id} onClick={() => { setModalimi(id); setMesazhi({ tekst: '', gabim: false }); }}
              style={{ flex: 1, padding: '11px', borderRadius: '12px', border: `1px solid ${modali === id ? '#3b82f6' : korniza}`, backgroundColor: modali === id ? '#3b82f6' : 'transparent', color: modali === id ? '#fff' : stiliTekstit, fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              {etiketa}
            </button>
          ))}
        </div>

        {mesazhi.tekst && (
          <div style={{ padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: '700', textAlign: 'center', backgroundColor: mesazhi.gabim ? '#ff3b3020' : '#34c75920', color: mesazhi.gabim ? '#ff3b30' : '#34c759', border: `1px solid ${mesazhi.gabim ? '#ff3b3040' : '#34c75940'}` }}>
            {mesazhi.tekst}
          </div>
        )}

        <form onSubmit={dërgo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {modali === 'regjistro' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Emri juaj</label>
              <input type="text" value={emri} onChange={(e) => setEmri(e.target.value)} placeholder="p.sh. Sjetmir"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@shembull.com" required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Fjalëkalim (të paktën 6 shenja)</label>
            <input type="password" value={fjalëkalimi} onChange={(e) => setFjalëkalimi(e.target.value)} placeholder="••••••••" required minLength={6}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={dukeDërguar}
            style={{ width: '100%', backgroundColor: '#3b82f6', color: '#fff', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: dukeDërguar ? 0.7 : 1 }}>
            {dukeDërguar ? 'Duke u përpunuar...' : modali === 'regjistro' ? 'Krijo llogarinë 🚀' : 'Hyr 🚀'}
          </button>
          {modali === 'regjistro' && (
            <p style={{ margin: 0, fontSize: '11px', color: '#8e8e93', textAlign: 'center', lineHeight: 1.5 }}>
              Duke u regjistruar pranoni <a href="#kushtet" style={{ color: '#3b82f6' }}>Kushtet</a> dhe <a href="#privatesia" style={{ color: '#3b82f6' }}>Politikën e Privatësisë</a>.
              Shënim: credentials ruhen te Firebase (server-side), jo në këtë kod.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Llogaria;
