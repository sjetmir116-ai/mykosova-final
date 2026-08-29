import { useState, useContext, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppContext } from './AppContext';
import { useBizneset } from './useBizneset';
import HomeScreen from './HomeScreen';
import HartaScreen from './HartaScreen';
import ShtoBiznes from './ShtoBiznes';
import SmartSearch from './SmartSearch';
import ListaBizneseve from './ListaBizneseve';
import EmergencyScreen from './EmergencyScreen';
import Asistenti from './asistenti';
import Llogaria from './Llogaria';
import Legal from './Legal';
import BiznesiDetaji from './BiznesiDetaji';
import TripScreen from './TripScreen';
import BiznesiPanel from './biznesi/BiznesiPanel';
import AdminLayout from './admin/AdminLayout';

// Ekranet kryesore të aplikacionit (rruga "/")
function EkraniKryesor() {
  const { darkMode, setDarkMode, gjuha, setGjuha, përdoruesi, biznesiIzgjedhur, setBiznesiIzgjedhur, t } = useContext(AppContext);
  const navigate = useNavigate();
  const [ekraniAktual, setEkraniAktual] = useState('ballina');
  const { bizneset } = useBizneset();

  // LINKU I NDAJUR (Faza 2): #biznesi=Emri → hap direkt detajin e biznesit
  const linkuTeprocesuar = useRef(false);
  useEffect(() => {
    if (linkuTeprocesuar.current || bizneset.length === 0) return;
    const m = (window.location.hash || '').match(/biznesi=([^&]+)/);
    if (!m) { linkuTeprocesuar.current = true; return; }
    const emri = decodeURIComponent(m[1]);
    const b = bizneset.find((x) => String(x.emri).toLowerCase() === emri.toLowerCase());
    linkuTeprocesuar.current = true;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (b) setBiznesiIzgjedhur(b);
    else setEkraniAktual('lista');
  }, [bizneset, setBiznesiIzgjedhur]);

  // Stilet globale sipas temës
  const stiliNav = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';
  const vijaNdarse = darkMode ? '#2d2d2d' : '#e5e7eb';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: darkMode ? '#111827' : '#f3f4f6' }}>

      {/* Headeri dhe Menuja e Lundrimit (Navbar) */}
      <nav style={{ backgroundColor: stiliNav, borderBottom: `1px solid ${vijaNdarse}`, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'sans-serif', position: 'sticky', top: 0, zIndex: 2000 }}>

        {/* Logoja dhe emri me përkthim dinamik — çon te Ballina */}
        <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setEkraniAktual('ballina')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🇽🇰</span>
            <span style={{ fontWeight: '900', fontSize: '20px', color: '#3b82f6', letterSpacing: '0.5px' }}>MyKosova</span>
          </div>
          <small style={{ fontSize: '10px', color: '#8e8e93', marginTop: '2px', fontWeight: 'bold' }}>{t('madeInKosovo')}</small>
        </div>

        {/* Butonat e ekranit me përkthim dinamik */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setEkraniAktual('ballina')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'ballina' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'ballina' ? '#fff' : '#8e8e93' }}
          >
            {t('ballina')} 🏠
          </button>

          <button
            onClick={() => setEkraniAktual('harta')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'harta' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'harta' ? '#fff' : '#8e8e93' }}
          >
            {gjuha === 'sq' ? 'Harta 🗺️' : gjuha === 'en' ? 'Map 🗺️' : gjuha === 'fr' ? 'Carte 🗺️' : gjuha === 'de' ? 'Karte 🗺️' : 'Mappa 🗺️'}
          </button>

          <button
            onClick={() => setEkraniAktual('shto')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'shto' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'shto' ? '#fff' : '#8e8e93' }}
          >
            {gjuha === 'sq' ? 'Shto Biznes 🏢' : gjuha === 'en' ? 'Add Business 🏢' : gjuha === 'fr' ? 'Ajouter 🏢' : gjuha === 'de' ? 'Hinzufügen 🏢' : 'Aggiungi 🏢'}
          </button>

          <button
            onClick={() => setEkraniAktual('kerko')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'kerko' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'kerko' ? '#fff' : '#8e8e93' }}
          >
            {t('kategorite')} 🔍
          </button>

          <button
            onClick={() => setEkraniAktual('lista')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'lista' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'lista' ? '#fff' : '#8e8e93' }}
          >
            {t('lista')} 📋
          </button>

          <button
            onClick={() => setEkraniAktual('urgjenca')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'urgjenca' ? '#dc2626' : 'transparent', color: ekraniAktual === 'urgjenca' ? '#fff' : '#ef4444' }}
          >
            {t('urgjenca')}
          </button>

          <button
            onClick={() => setEkraniAktual('trip')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'trip' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'trip' ? '#fff' : '#8e8e93' }}
          >
            Trip 🏔️
          </button>

          <button
            onClick={() => setEkraniAktual('asistenti')}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'asistenti' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'asistenti' ? '#fff' : '#8e8e93' }}
          >
            {t('asistenti')} 🤖
          </button>
        </div>

        {/* Paneli i përzgjedhjes së 5 Gjuhëve dhe Butoni Dark Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={gjuha}
            onChange={(e) => setGjuha(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${vijaNdarse}`, backgroundColor: stiliNav, color: stiliTekstit, fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="sq">🇦🇱 SQ</option>
            <option value="en">🇬 EN</option>
            <option value="fr">🇫🇷 FR</option>
            <option value="de">🇩 DE</option>
            <option value="it">🇮🇹 IT</option>
          </select>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: darkMode ? '#2d2d2d' : '#f3f4f6', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Butoni i Panelit të Biznesit */}
          <button
            onClick={() => navigate('/biznesi')}
            title="Paneli i Biznesit"
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: darkMode ? '#2d2d2d' : '#f3f4f6', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            🏢
          </button>

          {/* Butoni i Llogarisë */}
          <button
            onClick={() => setEkraniAktual('llogaria')}
            title={përdoruesi ? përdoruesi.emri : 'Hyr ose regjistrohu'}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: përdoruesi ? '#3b82f6' : darkMode ? '#2d2d2d' : '#f3f4f6', color: përdoruesi ? '#fff' : darkMode ? '#fff' : '#000', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}
          >
            {përdoruesi ? (përdoruesi.emri || 'P')[0].toUpperCase() : '👤'}
          </button>

          {/* Butoni i Panelit Admin */}
          <button
            onClick={() => navigate('/admin')}
            title="Paneli Admin"
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: darkMode ? '#2d2d2d' : '#f3f4f6', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ⚙️
          </button>
        </div>
      </nav>

      {/* Renderimi i Ekranit të Zgjedhur — Profili i biznesit e zëvendëson çdo ekran kur hapet */}
      <div style={{ flex: 1 }}>
        {biznesiIzgjedhur ? (
          <BiznesiDetaji biznesi={biznesiIzgjedhur} />
        ) : (
          <>
            {ekraniAktual === 'ballina' && <HomeScreen setEkrani={setEkraniAktual} />}
            {ekraniAktual === 'harta' && <HartaScreen setEkrani={setEkraniAktual} />}
            {ekraniAktual === 'shto' && <ShtoBiznes />}
            {ekraniAktual === 'kerko' && <SmartSearch />}
            {ekraniAktual === 'lista' && <ListaBizneseve />}
            {ekraniAktual === 'urgjenca' && <EmergencyScreen />}
            {ekraniAktual === 'trip' && <TripScreen />}
            {ekraniAktual === 'asistenti' && <Asistenti />}
            {ekraniAktual === 'llogaria' && <Llogaria />}
            {ekraniAktual === 'legal' && <Legal faqe="privacy" />}
            {ekraniAktual === 'legalKushtet' && <Legal faqe="terms" />}
          </>
        )}
      </div>

      {/* Footer me linket juridikore */}
      <footer style={{ padding: '14px 20px', borderTop: `1px solid ${vijaNdarse}`, display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '12px', color: '#8e8e93', backgroundColor: darkMode ? '#111827' : '#ffffff', flexWrap: 'wrap', alignItems: 'center' }}>
        <span>MyKosova 🇽 v1.0.1</span>
        <button onClick={() => setEkraniAktual('legal')} style={{ background: 'none', border: 'none', color: '#8e8e93', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
          Privatësia
        </button>
        <button onClick={() => setEkraniAktual('legalKushtet')} style={{ background: 'none', border: 'none', color: '#8e8e93', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
          Kushtet e Përdorimit
        </button>
        <a href="/test-siguria.html" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontSize: '12px', fontWeight: '700', textDecoration: 'none', padding: '3px 10px', border: '1px solid #16a34a40', borderRadius: '10px' }} title="Faqja e testeve të sigurisë (S1)">
          🧪 Testi i sigurisë
        </a>
      </footer>

    </div>
  );
}

// Rruga e aplikacionit: / = app-i, /admin = paneli
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EkraniKryesor />} />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="/biznesi" element={<BiznesiPanel />} />
        <Route path="*" element={<EkraniKryesor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
