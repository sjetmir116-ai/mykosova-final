import { useState } from 'react';

// ===== FOTO me FALLBACK të qartë (dhe të qëndrueshme) =====
// Problemi që zgjidh:
//  1. URL i keq/pa internet → ikona e metë imazhi (e pamëshirshme)
//  2. Pattern-i e.target.style.display='none' mbivendoset nga React te re-render
//     (p.sh. kur GPS-i përditëson lokacionin çdo pak sekonda)
// Zgjidhje: state-based — nëse imazhi dështon:
//  • mode 'ikona'  → shfaqet gradient + ikona e dhënë (për atraksionet/bizneset)
//  • mode 'hiq'    → shfaqet asgjë (për fotot e vlerësimeve)
export default function Foto({ src, alt = '', ikona = '📷', lartesia = '170px', gjerësia = '100%', mode = 'ikona', style = {} }) {
  const [gabim, setGabim] = useState(false);
  const valid = !!src && String(src).trim().startsWith('http');

  if (!valid || gabim) {
    if (mode === 'hiq') return null;
    return (
      <div
        aria-label={alt}
        style={{
          width: gjerësia,
          height: lartesia,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 55%, #60a5fa 100%)',
          fontSize: '56px',
          userSelect: 'none',
          ...style,
        }}
      >
        {ikona}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: gjerësia, height: lartesia, objectFit: 'cover', display: 'block', ...style }}
      onError={() => setGabim(true)}
    />
  );
}
