import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';
import { kaAdminen, provonHyrjen } from './auth';

// FAQJA E HYRJES SË ADMINIT
// - Nëse s'ka admin ende: regjistrimi i parë (bëhet admini kryesor)
// - Nëse ka: hyrje me email + fjalëkalim (Firebase Auth)
// Pas suksesit, AppContext përditësohet automatikisht dhe paneli hapet.
function Hyrja() {
  const { darkMode } = useContext(AppContext);
  const [dukeKontrolluar, setDukeKontrolluar] = useState(true);
  const [adminenEksistojne, setAdminenEksistojne] = useState(false);
  const [email, setEmail] = useState('');
  const [fjalëkalimi, setFjalëkalimi] = useState('');
  const [emri, setEmri] = useState('');
  const [dukeDërguar, setDukeDërguar] = useState(false);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });

  useEffect(() => {
    kaAdminen()
      .then((v) => setAdminenEksistojne(v))
      .catch((e) => setMesazhi({ tekst: 'S\u2019u arrit Firebase: ' + e.message, gabim: true }))
      .finally(() => setDukeKontrolluar(false));
  }, []);

  const dërgo = async (e) => {
    e.preventDefault();
    if (!email.trim() || !fjalëkalimi) {
      setMesazhi({ tekst: 'Plotësoni email-in dhe fjalëkalimin.', gabim: true });
      return;
    }
    setDukeDërguar(true);
    setMesazhi({ tekst: '', gabim: false });
    const rez = await provonHyrjen(email, fjalëkalimi, emri.trim());
    if (!rez.sukses) {
      setMesazhi({ tekst: rez.mesazhi, gabim: true });
      setDukeDërguar(false);
    }
    // Në sukses: AppContext (onAuthStateChanged) e hap panelin automatikisht
  };

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: darkMode ? '#111827' : '#f3f4f6', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: stiliKartelës, padding: '35px 30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: `1px solid ${korniza}`, width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🛡️</div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: stiliTekstit }}>Paneli Admin</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
            {adminenEksistojne === true
              ? 'Hyrni me kredencialet tuaja të adminit'
              : adminenEksistojne === false
                ? '👋 Kjo është hyrja e parë — persona i pari që regjistrohet bëhet admini kryesor i MyKosova'
                : 'Hyj ose regjistrohu — persona i pari që regjistrohet bëhet admini kryesor'}
          </p>
        </div>

        {mesazhi.tekst && (
          <div style={{ padding: '12px', borderRadius: '12px', marginBottom: '18px', fontSize: '13px', fontWeight: '700', textAlign: 'center', backgroundColor: mesazhi.gabim ? '#ff3b3020' : '#34c75920', color: mesazhi.gabim ? '#ff3b30' : '#34c759', border: `1px solid ${mesazhi.gabim ? '#ff3b3040' : '#34c75940'}` }}>
            {mesazhi.tekst}
          </div>
        )}

        {dukeKontrolluar ? (
          <p style={{ textAlign: 'center', color: '#8e8e93', fontSize: '14px' }}>Duke kontestruar regjistrin e adminëve...</p>
        ) : (
          <form onSubmit={dërgo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!adminenEksistojne && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Emri juaj</label>
                <input type="text" value={emri} onChange={(e) => setEmri(e.target.value)} placeholder="p.sh. Sjetmir"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@shembull.com" required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Fjalëkalim {adminenEksistojne ? '' : '(të paktën 6 shenja)'}</label>
              <input type="password" value={fjalëkalimi} onChange={(e) => setFjalëkalimi(e.target.value)} placeholder="••••••••" required minLength={6}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={dukeDërguar}
              style={{ width: '100%', backgroundColor: adminenEksistojne ? '#3b82f6' : '#16a34a', color: '#fff', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: dukeDërguar ? 0.7 : 1 }}>
              {dukeDërguar ? 'Duke u përpunuar...' : adminenEksistojne ? 'Hyr në Panel 🚀' : 'Udheheq Panelin 🚀'}
            </button>
            {!adminenEksistojne && (
              <p style={{ margin: 0, fontSize: '11px', color: '#8e8e93', textAlign: 'center', lineHeight: 1.5 }}>
                ⚠️ Vendi i parë që plotëson këtë formular do ta kontrollojë të gjithë panelin. Ruajni mirë fjalëkalimin.
                Credentials ruhen te Firebase (server-side).
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default Hyrja;
