import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useKategorite, useQyteteve } from './useKontenti';
import { regjistroAudit } from './audit';

// ===== REGJISTRIMI I BIZNESIT — WIZARD me 6 HAPA (spec B18) =====
// 1.Info 2.Kategori 3.Lokacion+GPS 4.Foto 5.Kontakt 6.Review & Submit
// Biznesi shkon me status 'pendshe' — e miraton admini
function ShtoBiznes() {
  const { darkMode, përdoruesi, userLocation, setBiznesiIzgjedhur } = useContext(AppContext);
  const { lista: kategoritë } = useKategorite();
  const { lista: qytetet } = useQyteteve();

  const [hapi, setHapi] = useState(1);
  const [form, setForm] = useState({
    emri: '', pershkrimi: '', oferta: '',
    kategoria: '',
    qyteti: '', adresa: '', lat: '', lng: '',
    foto: '',
    telefoni: '', whatsapp: '', website: '',
  });
  const [loading, setLoading] = useState(false);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });

  const hapet = [
    { id: 1, emri: 'Info' },
    { id: 2, emri: 'Kategoria' },
    { id: 3, emri: 'Lokacioni' },
    { id: 4, emri: 'Foto' },
    { id: 5, emri: 'Kontakti' },
    { id: 6, emri: 'Review' },
  ];

  const ndrysho = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Validimi i secilit hap
  const esIvlefshem = (h) => {
    if (h === 1) return form.emri.trim().length > 1;
    if (h === 2) return !!form.kategoria;
    if (h === 3) return !!form.qyteti.trim();
    if (h === 4) return true;
    if (h === 5) return !!form.telefoni.trim();
    return true;
  };

  const hapTjetër = () => {
    if (!esIvlefshem(hapi)) {
      setMesazhi({ tekst: 'Plotësoni fushat e detyruara të këtij hapi.', gabim: true });
      return;
    }
    setMesazhi({ tekst: '', gabim: false });
    setHapi((x) => Math.min(6, x + 1));
  };

  const dërgoTëDhënat = async (e) => {
    e.preventDefault();
    // ANTI-ABUZ (spec S12, S18): maksimum 5 biznese për përdorues
    if (përdoruesi) {
      try {
        const snap = await getDocs(query(collection(db, "bizneset"), where("uidPronari", "==", përdoruesi.uid)));
        if (snap.size >= 5) {
          setMesazhi({ tekst: `⛔ Kufiri u arrit: maksimum 5 biznese për llogari (keni ${snap.size}).`, gabim: true });
          return;
        }
      } catch (err) {
        console.warn('Kontrolli i kufirit s\u2019u krye:', err.message);
      }
    }
    setLoading(true);
    setMesazhi({ tekst: '', gabim: false });
    try {
      await addDoc(collection(db, "bizneset"), {
        emri: form.emri,
        pershkrimi: form.pershkrimi,
        kategoria: form.kategoria,
        qyteti: form.qyteti,
        adresa: form.adresa,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        foto: form.foto,
        oferta: form.oferta.trim(),
        telefoni: form.telefoni,
        whatsapp: form.whatsapp || form.telefoni,
        website: form.website,
        status: 'pendshe',
        shtuarMNga: përdoruesi ? përdoruesi.emri : 'Përdorues i panjohur',
        uidPronari: përdoruesi ? përdoruesi.uid : 'anonim',
        krijuarM: new Date().toISOString(),
      });
      regjistroAudit('shtim_biznesi', { emri: form.emri, kategoria: form.kategoria, qyteti: form.qyteti });
      setMesazhi({ tekst: `✅ "${form.emri}" u dërgua për miratim! Do të shfaqet publike sapo admini ta konfirmojë.`, gabim: false });
      setForm({ emri: '', pershkrimi: '', oferta: '', kategoria: '', qyteti: '', adresa: '', lat: '', lng: '', foto: '', telefoni: '', whatsapp: '', website: '' });
      setHapi(1);
    } catch (error) {
      console.error("Gabim gjatë shtimit:", error);
      setMesazhi({ tekst: 'Ndodhi një gabim me Firebase. Provoni përsëri!', gabim: true });
    } finally {
      setLoading(false);
    }
  };

  const stiliSfondit = darkMode ? '#111827' : '#f3f4f6';
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';

  const fusha = (etiketa, fushaEmri, tipi = 'text', placeholder = '', detyrueshme = false) => (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>
        {etiketa} {detyrueshme && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input type={tipi} name={fushaEmri} value={form[fushaEmri]} onChange={ndrysho} placeholder={placeholder}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  if (mesazhi.tekst && !mesazhi.gabim && mesazhi.tekst.includes('u dërgua')) {
    return (
      <div style={{ backgroundColor: stiliSfondit, minHeight: 'calc(100vh - 145px)', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '54px', marginBottom: '12px' }}>✅</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>U dërgua për miratim!</h2>
        <p style={{ color: '#8e8e93', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px auto' }}>{mesazhi.tekst}</p>
        <button onClick={() => setHapi(1)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
          Shto edhe një biznes
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: stiliSfondit, minHeight: 'calc(100vh - 145px)', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: stiliKartelës, padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: darkMode ? '1px solid #2d2d2d' : '1px solid #f2f2f7' }}>

        <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', textAlign: 'center', color: stiliTekstit }}>Shto Biznes të Ri 🏢</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#8e8e93', textAlign: 'center' }}>6 hapa të shpejtë — pas miratimit, biznesi shfaqet publike</p>

        {/* Indikator i hapeve */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {hapet.map((h) => (
            <div key={h.id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: '5px', borderRadius: '3px', backgroundColor: h.id <= hapi ? '#3b82f6' : (darkMode ? '#2d2d2d' : '#e5e7eb') }} />
              <span style={{ fontSize: '10px', fontWeight: '700', color: h.id === hapi ? '#3b82f6' : '#8e8e93', display: 'block', marginTop: '5px' }}>{h.emri}</span>
            </div>
          ))}
        </div>

        {mesazhi.gabim && (
          <div style={{ padding: '12px', borderRadius: '12px', marginBottom: '18px', fontSize: '13px', fontWeight: '700', textAlign: 'center', backgroundColor: '#ff3b3020', color: '#ff3b30', border: '1px solid #ff3b3040' }}>
            {mesazhi.tekst}
          </div>
        )}

        <form onSubmit={dërgoTëDhënat} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* HAPI 1 — INFO */}
          {hapi === 1 && (
            <>
              {fusha('Emri i Biznesit', 'emri', 'text', 'p.sh. Kafe Central', true)}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Përshkrimi</label>
                <textarea name="pershkrimi" value={form.pershkrimi} onChange={ndrysho} rows={3} placeholder="Çfarë ofron biznesi?"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              {fusha('🎁 Oferta aktuale (opsionale)', 'oferta', 'text', 'p.sh. -20% për të gjithë menynë deri në fundjavë')}
            </>
          )}

          {/* HAPI 2 — KATEGORIA */}
          {hapi === 2 && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Kategoria <span style={{ color: '#ef4444' }}>*</span></label>
              <select name="kategoria" value={form.kategoria} onChange={ndrysho}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: darkMode ? '#111827' : '#ffffff', color: stiliTekstit, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="">— Zgjidh kategorinë —</option>
                {kategoritë.map((k) => (
                  <option key={k.emri} value={k.emri}>{k.ikona ? k.ikona + ' ' : ''}{k.emri}</option>
                ))}
              </select>
            </div>
          )}

          {/* HAPI 3 — LOKACIONI */}
          {hapi === 3 && (
            <>
              {fusha('Qyteti', 'qyteti', 'text', 'p.sh. Prishtinë', true)}
              {fusha('Adresa', 'adresa', 'text', 'p.sh. Rruga e Dibrës 15')}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>{fusha('Gjerësia (lat)', 'lat', 'number', '42.6629')}</div>
                <div style={{ flex: 1 }}>{fusha('Gjatësia (lng)', 'lng', 'number', '21.1655')}</div>
              </div>
              {userLocation && (
                <button type="button" onClick={() => setForm({ ...form, lat: userLocation.lat.toFixed(6), lng: userLocation.lng.toFixed(6) })}
                  style={{ alignSelf: 'flex-start', backgroundColor: 'none', border: '1px solid #3b82f6', color: '#3b82f6', padding: '9px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  📍 Përdor lokacionin tim (GPS)
                </button>
              )}
            </>
          )}

          {/* HAPI 4 — FOTO */}
          {hapi === 4 && (
            <>
              {fusha('Foto (URL i imazhit)', 'foto', 'url', 'https://...  (opsional — nëse s\u2019ka, zgjidhet automatikisht sipas kategorisë)')}
              {form.foto && (
                <img src={form.foto} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px' }}
                  onError={(e) => (e.target.style.display = 'none')} />
              )}
              <p style={{ margin: 0, fontSize: '12px', color: '#8e8e93' }}>Opsional — nëse lëreni bosh, platforma zgjedh foto automatikisht sipas kategorisë.</p>
            </>
          )}

          {/* HAPI 5 — KONTAKTI */}
          {hapi === 5 && (
            <>
              {fusha('Telefoni', 'telefoni', 'tel', 'p.sh. +383 44 123 456', true)}
              {fusha('WhatsApp', 'whatsapp', 'tel', 'opsional — nëse s\u2019ka, përdoret telefoni')}
              {fusha('Website', 'website', 'url', 'opsional — p.sh. biznesi.com')}
            </>
          )}

          {/* HAPI 6 — REVIEW & SUBMIT */}
          {hapi === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '700', color: stiliTekstit }}>Kontrollo para se të dërgoni:</p>
              {[
                ['Emri', form.emri],
                ['Kategoria', form.kategoria],
                ['Qyteti', form.qyteti],
                ['Adresa', form.adresa],
                ['GPS', form.lat && form.lng ? `${form.lat}, ${form.lng}` : 's\u2019ka'],
                ['Telefoni', form.telefoni],
                ['Oferta', form.oferta || '—'],
                ['Foto', form.foto ? '✅' : 'automatike'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '10px', fontSize: '13px', padding: '7px 0', borderBottom: `1px solid ${darkMode ? '#2d2d2d' : '#f2f2f7'}` }}>
                  <span style={{ color: '#8e8e93', fontWeight: '700', minWidth: '80px' }}>{k}:</span>
                  <span style={{ color: stiliTekstit, wordBreak: 'break-word' }}>{v || '—'}</span>
                </div>
              ))}
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#8e8e93', lineHeight: 1.5 }}>
                ℹ️ Biznesi do të shihet nga admini para publikimit (status: <b>Pendshe</b>). Kjo na lejon të evitojmë dubletat dhe spam-in.
              </p>
            </div>
          )}

          {/* NAVIGIMI */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {hapi > 1 && (
              <button type="button" onClick={() => setHapi((x) => x - 1)}
                style={{ flex: 1, backgroundColor: 'transparent', border: `1px solid ${stiliInputit}`, color: stiliTekstit, padding: '13px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                ← E para
              </button>
            )}
            {hapi < 6 ? (
              <button type="button" onClick={hapTjetër}
                style={{ flex: 2, backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                Tjetër →
              </button>
            ) : (
              <button type="submit" disabled={loading}
                style={{ flex: 2, backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Duke u dërguar...' : 'Dërgo për miratim 🚀'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShtoBiznes;
