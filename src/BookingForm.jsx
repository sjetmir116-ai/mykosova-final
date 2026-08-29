import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { shtoBooking } from './useBookings';

// ===== BOOKING FORM (spec K1-K3) =====
// Hoteli: data + ora + guest + dhoma · Restoranti: data + ora + guest · Aktiviteti: data + pjesëmarrës
function BookingForm({ biznesi, lloji, onMbarim }) {
  const { darkMode, përdoruesi } = useContext(AppContext);
  const sot = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(sot);
  const [ora, setOra] = useState('14:00');
  const [guest, setGuest] = useState(2);
  const [dhoma, setDhoma] = useState('1');
  const [shenim, setShenim] = useState('');
  const [dukeDërguar, setDukeDërguar] = useState(false);
  const [mesazhi, setMesazhi] = useState('');

  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const korniza = darkMode ? '#374151' : '#e5e7eb';

  const dërgo = async (e) => {
    e.preventDefault();
    if (përdoruesi?.roli === 'iPezulluar') { setMesazhi('⛔ Llogaria juaj është e pezulluar — s\u2019mund të rezervoni.'); return; }
    if (!data) return;
    setDukeDërguar(true);
    setMesazhi('');
    try {
      await shtoBooking({ biznesi, lloji, data, ora, guest, dhoma, shenim, përdoruesi });
      setMesazhi('✅ Rezervimi u dërgua! Biznesi do ta konfirmojë — statusin e ndiqni te Llogaria → Rezervimet.');
      onMbarim?.();
    } catch (err) {
      console.error('Gabim booking:', err);
      setMesazhi('❌ S\u2019u dërgua: ' + err.message);
    } finally {
      setDukeDërguar(false);
    }
  };

  return (
    <form onSubmit={dërgo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Data</label>
          <input type="date" min={sot} value={data} onChange={(e) => setData(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>{lloji === 'restorant' ? 'Ora e ngrënies' : 'Ora e mbërritjes'}</label>
          <input type="time" value={ora} onChange={(e) => setOra(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>
            {lloji === 'aktivitet' ? 'Pjesëmarrës' : 'Guests'}
          </label>
          <input type="number" min="1" max="50" value={guest} onChange={(e) => setGuest(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {lloji === 'hotel' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Dhoma</label>
            <select value={dhoma} onChange={(e) => setDhoma(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#ffffff', color: stiliTekstit, fontSize: '14px', outline: 'none' }}>
              <option value="1">1 dhomë</option>
              <option value="2">2 dhoma</option>
              <option value="3">3 dhoma</option>
            </select>
          </div>
        )}
      </div>
      <input type="text" value={shenim} onChange={(e) => setShenim(e.target.value)} placeholder="Shënim (opsional) — p.sh. krevat i dyfishtë, ushqim veçanor..."
        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
      <button type="submit" disabled={dukeDërguar}
        style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', opacity: dukeDërguar ? 0.6 : 1 }}>
        {dukeDërguar ? 'Duke dërguar...' : 'Dërgo rezervimin ✅'}
      </button>
      {mesazhi && <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: mesazhi.startsWith('✅') ? '#16a34a' : '#ef4444', lineHeight: 1.5 }}>{mesazhi}</p>}
    </form>
  );
}

export default BookingForm;
