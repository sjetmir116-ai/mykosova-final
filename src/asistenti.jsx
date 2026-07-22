import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from './AppContext';

function Asistenti() {
  const { darkMode } = useContext(AppContext);
  const [mesazhet, setMesazhet] = useState([
    { id: 1, tekst: "Përshëndetje! Unë jam asistenti virtual i My Kosova. Si mund t'ju ndihmoj sot? 🇽🇰", ngaAsistenti: true }
  ]);
  const [input, setInput] = useState('');
  const [dukeUFlisni, setDukeUFlisni] = useState(false);
  const mesazhetEndRef = useRef(null);

  // Autoscroll kur vjen një mesazh i ri
  useEffect(() => {
    mesazhetEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mesazhet]);

  const dërgoMesazh = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const mesazhiPërdoruesit = { id: Date.now(), tekst: input, ngaAsistenti: false };
    setMesazhet(prev => [...prev, mesazhiPërdoruesit]);
    setInput('');
    setDukeUFlisni(true);

    // Këtu simulohet përgjigjja e AI (Mund ta lidhni me Gemini/OpenAI API më vonë)
    setTimeout(() => {
      let pergjigjjaTekst = "Më vjen mirë që pyetët! Unë po mësohem çdo ditë e më shumë për pikat turistike, hotelet dhe bizneset në Kosovë. Së shpejti do t'ju ofroj informacione të detajuara në kohë reale. 🗺️";
      
      if (input.toLowerCase().includes('prizren')) {
        pergjigjjaTekst = "Prizreni është kryeqyteti historik i Kosovës! Ju sugjeroj të vizitoni Kalanë, Shadrvanin dhe të provoni ushqimet e shijshme te kafeneja 'dulis'. ☕";
      } else if (input.toLowerCase().includes('harta')) {
        pergjigjjaTekst = "Ju mund të klikoni butonin 'Harta 🗺️' në menunë e sipërme për të parë të gjitha bizneset dhe pikat strategjike të lokalizuara përmes GPS-it tuaj.";
      }

      setMesazhet(prev => [...prev, { id: Date.now() + 1, tekst: pergjigjjaTekst, ngaAsistenti: true }]);
      setDukeUFlisni(false);
    }, 1200);
  };

  // Ngjyrat sipas temës Light/Dark
  const sfondiChat = darkMode ? '#111827' : '#f9fafb';
  const kutiaMesazhitAI = darkMode ? '#1f2937' : '#ffffff';
  const tekstiAI = darkMode ? '#f3f4f6' : '#1f2937';
  const kornizaChat = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '10px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: sfondiChat, border: `1px solid ${kornizaChat}`, borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '550px', overflow: 'hidden' }}>
        
        {/* Headeri i Asistentit */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${kornizaChat}`, display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: darkMode ? '#1f2937' : '#ffffff' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>AI Asistenti</h3>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>● Online dhe i gatshëm</span>
          </div>
        </div>

        {/* Zona e Mesazheve */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mesazhet.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.ngaAsistenti ? 'flex-start' : 'flex-end' }}>
              <div style={{ 
                maxWidth: '75%', 
                padding: '12px 16px', 
                borderRadius: m.ngaAsistenti ? '18px 18px 18px 4px' : '18px 18px 4px 18px', 
                backgroundColor: m.ngaAsistenti ? kutiaMesazhitAI : '#3b82f6', 
                color: m.ngaAsistenti ? tekstiAI : '#ffffff',
                fontSize: '15px',
                lineHeight: '1.5',
                boxShadow: m.ngaAsistenti ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                border: m.ngaAsistenti ? `1px solid ${kornizaChat}` : 'none'
              }}>
                {m.tekst}
              </div>
            </div>
          ))}
          {dukeUFlisni && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '18px', backgroundColor: kutiaMesazhitAI, color: '#9ca3af', fontSize: '14px', fontStyle: 'italic', border: `1px solid ${kornizaChat}` }}>
                Asistenti po shkruan...
              </div>
            </div>
          )}
          <div ref={mesazhetEndRef} />
        </div>

        {/* Forma e Inputit për shkrim */}
        <form onSubmit={dërgoMesazh} style={{ padding: '16px', borderTop: `1px solid ${kornizaChat}`, display: 'flex', gap: '10px', backgroundColor: darkMode ? '#1f2937' : '#ffffff' }}>
          <input 
            type="text" 
            placeholder="Shkruaj një mesazh asistentit..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: `1px solid ${kornizaChat}`, fontSize: '15px', outline: 'none', backgroundColor: darkMode ? '#111827' : '#f3f4f6', color: darkMode ? '#ffffff' : '#000000', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '0 20px', borderRadius: '14px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: '0.2s' }}>
            Dërgo
          </button>
        </form>

      </div>
    </div>
  );
}

export default Asistenti;
