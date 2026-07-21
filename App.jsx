import { useState, useContext } from 'react';
import { AppContext } from './context/AppContext';
import HartaScreen from './HartaScreen';
import ShtoBiznes from './ShtoBiznes';
import SmartSearch from './SmartSearch';
import Asistenti from './asistenti';

function App() {
  const { darkMode, setDarkMode } = useContext(AppContext);
  const [ekraniAktual, setEkraniAktual] = useState('harta');

  // Stilet globale sipas temës
  const stiliNav = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';
  const vijaNdarse = darkMode ? '#2d2d2d' : '#e5e7eb';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: darkMode ? '#111827' : '#f3f4f6' }}>
      
      {/* Headeri dhe Menuja e Lundrimit (Navbar) */}
      <nav style={{ backgroundColor: stiliNav, borderBottom: `1px solid ${vijaNdarse}`, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'sans-serif', position: 'sticky', top: 0, zIndex: 2000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setEkraniAktual('harta')}>
          <span style={{ fontSize: '24px' }}>🇽🇰</span>
          <span style={{ fontWeight: '900', fontSize: '20px', color: '#3b82f6', letterSpacing: '0.5px' }}>MyKosova</span>
        </div>

        {/* Butonat për të ndryshuar ekranet - KORRIGJUAR */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setEkraniAktual('harta')} 
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'harta' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'harta' ? '#fff' : '#8e8e93' }}
          >
            Harta 🗺️
          </button>
          
          <button 
            onClick={() => setEkraniAktual('shto')} 
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'shto' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'shto' ? '#fff' : '#8e8e93' }}
          >
            Shto Biznes 🏢
          </button>
          
          <button 
            onClick={() => setEkraniAktual('kerko')} 
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'kerko' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'kerko' ? '#fff' : '#8e8e93' }}
          >
            Kërko 🔍
          </button>
          
          <button 
            onClick={() => setEkraniAktual('asistenti')} 
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: ekraniAktual === 'asistenti' ? '#3b82f6' : 'transparent', color: ekraniAktual === 'asistenti' ? '#fff' : '#8e8e93' }}
          >
            Asistenti 🤖
          </button>
        </div>

        {/* Butoni për Ndryshimin e Temës (Light/Dark Mode) */}
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: darkMode ? '#2d2d2d' : '#f3f4f6', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>

      {/* Renderimi i Ekranit të Zgjedhur */}
      <div style={{ flex: 1 }}>
        {ekraniAktual === 'harta' && <HartaScreen />}
        {ekraniAktual === 'shto' && <ShtoBiznes />}
        {ekraniAktual === 'kerko' && <SmartSearch />}
        {ekraniAktual === 'asistenti' && <Asistenti />}
      </div>

    </div>
  );
}

export default App;
