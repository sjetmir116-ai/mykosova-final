import { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { usePaketa } from '../paketa';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { regjistroAudit } from '../audit';

// ===== PAKETAT ADMIN (spec A14, B17) =====
// Admini ndryshon çmimin/features/limitet — pa ndryshuar kod (rregullorja: packages/global)
function PaketaAdmin() {
  const { darkMode } = useContext(AppContext);
  const { paketa } = usePaketa();
  const [forma, setForma] = useState({});
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [mesazhi, setMesazhi] = useState('');

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const vlera = (kyçi, fusha) => forma[kyçi]?.[fusha] ?? paketa[kyçi]?.[fusha] ?? '';
  const ndrysho = (kyçi, fusha, v) => setForma((prev) => ({ ...prev, [kyçi]: { ...prev[kyçi], [fusha]: v } }));

  const ruaj = async () => {
    setDukeRuajtur(true);
    setMesazhi('');
    try {
      // Ruaj vetëm fushat e ndryshuara (cmimi, emri, features)
      const payload = {};
      for (const kyçi of ['basic', 'gold', 'premium']) {
        if (forma[kyçi]) payload[kyçi] = { ...forma[kyçi] };
      }
      await setDoc(doc(db, 'packages', 'global'), { ...payload, perditësuar: serverTimestamp() }, { merge: true });
      regjistroAudit('paketa_ndryshim', { paketat: Object.keys(forma) });
      setMesazhi('✅ Paketat u ruajtën — tani vlen për të gjithë platformën.');
      setForma({});
    } catch (err) {
      setMesazhi('❌ ' + err.message);
    } finally {
      setDukeRuajtur(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>💳 Paketat</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          Ndrysho çmimet dhe features — <b>pa ndryshuar kod</b> (rregullorja A14)
        </p>
      </div>

      {mesazhi && (
        <div style={{ padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', backgroundColor: mesazhi.startsWith('✅') ? '#16a34a15' : '#ef444415', color: mesazhi.startsWith('✅') ? '#16a34a' : '#ef4444', border: `1px solid ${mesazhi.startsWith('✅') ? '#16a34a40' : '#ef444440'}` }}>
          {mesazhi}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {Object.entries(paketa).map(([kyçi, p]) => (
          <div key={kyçi} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '20px' }}>
            <b style={{ fontSize: '15px', color: p.ngjyra, fontWeight: '800' }}>{p.ikona} {p.emri}</b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Çmimi (€/muaj) — 0 = FALAS</label>
                <input type="number" min="0" value={vlera(kyçi, 'cmimi')} onChange={(e) => ndrysho(kyçi, 'cmimi', Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Features (një në rresht)</label>
                <textarea rows={8} value={vlera(kyçi, 'features')} onChange={(e) => ndrysho(kyçi, 'features', e.target.value.split('\n'))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={ruaj} disabled={dukeRuajtur || Object.keys(forma).length === 0}
        style={{ alignSelf: 'flex-start', backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '13px 26px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', opacity: dukeRuajtur || Object.keys(forma).length === 0 ? 0.5 : 1 }}>
        {dukeRuajtur ? 'Duke ruajtur...' : '💾 Ruaj paketat'}
      </button>
    </div>
  );
}

export default PaketaAdmin;
