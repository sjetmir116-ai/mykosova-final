import { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { CITET_GPS } from './qyteteGPS';

// ===== PIKA E REFERENCËS MANUALE (kur GPS-i refuzohet) =====
// Përdoruesi zgjedh qytetin ku është → distancat llogariten nga qendra e atij qyteti.
// Rezultati shënohet GJITHMONË qartë "MANUAL — jo GPS" (kurrë "nga ju").
export default function QytetiManual() {
  const { zgjidhQytetinManual } = useContext(AppContext);
  const [qyteti, setQyteti] = useState('');

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <select
        value={qyteti}
        onChange={(e) => setQyteti(e.target.value)}
        aria-label="Zgjidh qytetin ku jeni"
        style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#111827', fontSize: '13px', fontWeight: '600', cursor: 'pointer', outline: 'none', maxWidth: '220px' }}
      >
        <option value="">— Qyteti ku jeni —</option>
        {CITET_GPS.map((c) => (
          <option key={c.emri} value={c.emri}>{c.emri}</option>
        ))}
      </select>
      <button
        onClick={() => qyteti && zgjidhQytetinManual(qyteti)}
        disabled={!qyteti}
        style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', backgroundColor: qyteti ? '#3b82f6' : '#d1d5db', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: qyteti ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
      >
        🏙️ Përdor {qyteti || 'qytetin'} (MANUAL)
      </button>
    </div>
  );
}
