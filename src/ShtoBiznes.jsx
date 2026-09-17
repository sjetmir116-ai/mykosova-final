import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useKategorite, useQyteteve } from './useKontenti';
import { regjistroAudit } from './audit';
import Foto from './Foto';
import QytetiManual from './QytetiManual';
import { ekzekutoNgjarjen } from './analytics';
import { MAP_CATEGORIES, kerkoNeGooglePlaces, normalizoQytetin } from './googlePlaces';

const FORM_FILLIMTAR = {
  emri: '', pershkrimi: '', oferta: '',
  kategoria: '',
  qyteti: '', adresa: '', lat: '', lng: '',
  foto: '',
  telefoni: '', whatsapp: '', website: '',
};

const MESAZHET_GOOGLE = {
  'MUNGON_KEY': 'Vendosni dhe ruani Google Places API Key para kërkimit.',
  'API_I_PAKTIVIZUAR': 'Places API (New) nuk është aktivizuar ose ky key nuk ka leje.',
  'KEY_I_GABUAR': 'API key nuk është i vlefshëm ose kërkesa nuk u pranua.',
  'GABIM_RRJETI': 'Kërkimi në Google dështoi. Kontrolloni lidhjen dhe provoni përsëri.',
};

// ===== REGJISTRIMI I BIZNESIT — WIZARD me 6 HAPA (spec B18) =====
// 1.Info 2.Kategori 3.Lokacion+GPS 4.Foto 5.Kontakt 6.Review & Submit
// Biznesi shkon me status 'pendshe' — e miraton admini
function ShtoBiznes() {
  const { darkMode, përdoruesi, userLocation, setBiznesiIzgjedhur, riprovoGPS, vendndodhja } = useContext(AppContext);
  const { lista: kategoritë } = useKategorite();
  const { lista: qytetet } = useQyteteve();

  const [hapi, setHapi] = useState(1);
  const [form, setForm] = useState(FORM_FILLIMTAR);
  const [loading, setLoading] = useState(false);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleResults, setGoogleResults] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleKey, setGoogleKey] = useState(() => (
    typeof localStorage !== 'undefined' ? localStorage.getItem('GOOGLE_PLACES_API_KEY') || '' : ''
  ));
  const [googleKeyRuajtur, setGoogleKeyRuajtur] = useState(() => (
    typeof localStorage !== 'undefined' && !!localStorage.getItem('GOOGLE_PLACES_API_KEY')
  ));

  const hapet = [
    { id: 1, emri: 'Info' },
    { id: 2, emri: 'Kategoria' },
    { id: 3, emri: 'Lokacioni' },
    { id: 4, emri: 'Foto' },
    { id: 5, emri: 'Kontakti' },
    { id: 6, emri: 'Review' },
  ];

  const ndrysho = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const ruajGoogleKey = () => {
    const key = googleKey.trim();
    if (!key) {
      localStorage.removeItem('GOOGLE_PLACES_API_KEY');
      setGoogleKeyRuajtur(false);
      setGoogleError('Shkruani API key para se ta ruani.');
      return;
    }
    localStorage.setItem('GOOGLE_PLACES_API_KEY', key);
    setGoogleKeyRuajtur(true);
    setGoogleError('');
  };

  const kerkoBiznesin = async () => {
    if (!googleQuery.trim()) {
      setGoogleError('Shkruani emrin e biznesit që dëshironi të kërkoni.');
      return;
    }
    setGoogleLoading(true);
    setGoogleError('');
    setGoogleResults([]);
    try {
      const rezultatet = await kerkoNeGooglePlaces(googleQuery);
      setGoogleResults(rezultatet);
      if (!rezultatet.length) setGoogleError('Nuk u gjet asnjë biznes. Provoni një emër tjetër.');
    } catch (error) {
      setGoogleError(MESAZHET_GOOGLE[error.message] || MESAZHET_GOOGLE['GABIM_RRJETI']);
    } finally {
      setGoogleLoading(false);
    }
  };

  const zgjidhBiznesinGoogle = (place) => {
    const emri = typeof place.displayName === 'string' ? place.displayName : place.displayName?.text;
    const adresa = place.formattedAddress || '';
    setForm((f) => ({
      ...f,
      emri: emri || f.emri,
      kategoria: MAP_CATEGORIES[place.primaryType] || f.kategoria,
      qyteti: normalizoQytetin(adresa) || f.qyteti,
      adresa: adresa || f.adresa,
      lat: place.location?.latitude != null ? String(place.location.latitude) : f.lat,
      lng: place.location?.longitude != null ? String(place.location.longitude) : f.lng,
      telefoni: place.internationalPhoneNumber || f.telefoni,
      whatsapp: place.internationalPhoneNumber || f.whatsapp,
      website: place.websiteUri || f.website,
    }));
    setGoogleQuery(emri || googleQuery);
    setGoogleResults([]);
    setGoogleError('');
    setHapi(1);
  };

  // Pas suksesit pastrohet edhe mesazhi; përndryshe ekrani i suksesit
  // do të vazhdonte të renderohej edhe pasi përdoruesi shtypte butonin.
  const handleShtoEdheNje = () => {
    setMesazhi({ tekst: '', gabim: false });
    setHapi(1);
    setForm(FORM_FILLIMTAR);
    setGoogleQuery('');
    setGoogleResults([]);
    setGoogleError('');
  };

  // BUTONI "POZICIONI IM" (kërkesa e përdoruesit): merr pozicionin e biznesit nga
  // GPS-i (ose qyteti manual) — PA shkruar asnjë numër lat/lng
  const merrPozicionin = () => {
    if (userLocation) {
      setForm((f) => ({
        ...f,
        lat: userLocation.lat.toFixed(6),
        lng: userLocation.lng.toFixed(6),
        qyteti: f.qyteti || (userLocation.burimi === 'manual' ? userLocation.qyteti : f.qyteti),
      }));
    } else {
      riprovoGPS(); // kërkon GPS-in — kur mbërrin, përdoruesi shtyp përsëri
    }
  };

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
      ekzekutoNgjarjen('shtim_biznesi', { emri: form.emri, kategoria: form.kategoria });
      setMesazhi({ tekst: `✅ "${form.emri}" u dërgua për miratim! Do të shfaqet publike sapo admini ta konfirmojë.`, gabim: false });
      setForm(FORM_FILLIMTAR);
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
        <button onClick={handleShtoEdheNje} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
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

        {/* Plotësimi automatik me Places API (New) */}
        <section style={{ marginBottom: '22px', padding: '16px', borderRadius: '16px', border: `1px solid ${darkMode ? '#7c3aed70' : '#ddd6fe'}`, backgroundColor: darkMode ? '#7c3aed18' : '#f5f3ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <strong style={{ color: stiliTekstit, fontSize: '15px' }}>⚡ Auto nga Google</strong>
            <span style={{ color: googleKeyRuajtur ? '#16a34a' : '#8e8e93', fontSize: '11px', fontWeight: '700' }}>
              {googleKeyRuajtur ? '● Key u ruajt' : '○ Kërkon API key'}
            </span>
          </div>
          <p style={{ margin: '0 0 12px', color: '#8e8e93', fontSize: '12px', lineHeight: 1.45 }}>
            Gjej biznesin dhe plotëso të dhënat automatikisht. API key ruhet vetëm në këtë browser.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '9px' }}>
            <input type="password" value={googleKey} onChange={(e) => { setGoogleKey(e.target.value); setGoogleKeyRuajtur(false); }} placeholder="Google Places API Key"
              aria-label="Google Places API Key"
              style={{ minWidth: 0, flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, outline: 'none' }} />
            <button type="button" onClick={ruajGoogleKey}
              style={{ border: 'none', borderRadius: '10px', padding: '10px 13px', backgroundColor: '#7c3aed', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>
              Ruaj
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="search" value={googleQuery} onChange={(e) => setGoogleQuery(e.target.value)} placeholder="p.sh. Restaurant Liburnia Prishtinë"
              aria-label="Kërko biznesin në Google"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); kerkoBiznesin(); } }}
              style={{ minWidth: 0, flex: 1, padding: '11px 12px', borderRadius: '10px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, outline: 'none' }} />
            <button type="button" onClick={kerkoBiznesin} disabled={googleLoading}
              style={{ border: 'none', borderRadius: '10px', padding: '10px 14px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '800', cursor: googleLoading ? 'wait' : 'pointer', opacity: googleLoading ? 0.7 : 1 }}>
              {googleLoading ? '...' : 'Kërko'}
            </button>
          </div>

          {googleError && <p role="alert" style={{ margin: '10px 0 0', color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>{googleError}</p>}

          {googleResults.length > 0 && (
            <div style={{ display: 'grid', gap: '7px', marginTop: '10px', maxHeight: '230px', overflowY: 'auto' }}>
              {googleResults.map((place) => {
                const emri = typeof place.displayName === 'string' ? place.displayName : place.displayName?.text;
                return (
                  <button key={place.id} type="button" onClick={() => zgjidhBiznesinGoogle(place)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, textAlign: 'left', cursor: 'pointer' }}>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: '800' }}>{emri || 'Biznes pa emër'}</span>
                    <span style={{ display: 'block', marginTop: '3px', color: '#8e8e93', fontSize: '11px', lineHeight: 1.35 }}>{place.formattedAddress || 'Adresë e padisponueshme'}{place.rating ? ` · ⭐ ${place.rating}` : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

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

          {/* HAPI 3 — LOKACIONI (pa numra: vetëm butoni "Pozicioni im") */}
          {hapi === 3 && (
            <>
              {fusha('Qyteti', 'qyteti', 'text', 'p.sh. Prishtinë', true)}
              {fusha('Adresa', 'adresa', 'text', 'p.sh. Rruga e Dibrës 15')}
              <button type="button" onClick={merrPozicionin}
                style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', backgroundColor: form.lat ? '#16a34a' : '#3b82f6', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                {userLocation ? '📍 Pozicioni im' : '📍 Pozicioni im — duke kërkuar GPS...'}
              </button>
              {form.lat ? (
                <p style={{ margin: 0, color: '#16a34a', fontWeight: '800', fontSize: '13px' }}>
                  ✅ Pozicioni u ruajt: {vendndodhja || '...'} — biznesi do të shfaqet te harta
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '12px', color: '#8e8e93' }}>
                  Shtyp butonin — pozicioni merret vetë, s'ke për të shkruar asnjë numër.
                </p>
              )}
              {!userLocation && (
                <div>
                  <p style={{ margin: '8px 0 6px', fontSize: '12px', color: '#8e8e93' }}>GPS nuk u merr? Zgjidh qytetin e biznesit:</p>
                  <QytetiManual />
                </div>
              )}
            </>
          )}

          {/* HAPI 4 — FOTO */}
          {hapi === 4 && (
            <>
              {fusha('Foto (URL i imazhit)', 'foto', 'url', 'https://...  (opsional — nëse s\u2019ka, zgjidhet automatikisht sipas kategorisë)')}
              {form.foto && (
                <Foto src={form.foto} alt="Preview" ikona="📷" lartesia="160px" style={{ borderRadius: '12px', fontSize: '42px' }} />
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
