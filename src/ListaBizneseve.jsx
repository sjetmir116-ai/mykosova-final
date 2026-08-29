import React, { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import { useBizneset, merrMapsUrl } from './useBizneset';
import { gjejFotoAutomatikisht } from './biznesFoto';
import RatingStars from './RatingStars';

function ListaBizneseve() {
  const { setBiznesiIzgjedhur } = useContext(AppContext);
  const { bizneset, loading } = useBizneset();
  const [kerkimi, setKerkimi] = useState('');

  const paAkcente = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const biznesetEFiltruara = bizneset.filter((b) => {
    const fjala = paAkcente(kerkimi);
    if (!fjala) return true;
    return paAkcente(b.emri).includes(fjala) || paAkcente(b.qyteti).includes(fjala) || paAkcente(b.kategoria).includes(fjala);
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '5px', fontSize: '28px', fontWeight: 'bold' }}>Lista e Bizneseve 📋</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '25px' }}>
        {loading ? 'Duke ngarkuar...' : `${biznesetEFiltruara.length} vende të regjistruara në MyKosova`}
      </p>

      <input
        type="text"
        placeholder="Kërko sipas emrit, qytetit ose kategorisë..."
        value={kerkimi}
        onChange={(e) => setKerkimi(e.target.value)}
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
        {biznesetEFiltruara.map((biznesi) => {
          const imazhiPërfundimtar = (biznesi.foto && String(biznesi.foto).trim().length > 5 && String(biznesi.foto).startsWith('http'))
            ? biznesi.foto
            : gjejFotoAutomatikisht(biznesi.emri, biznesi.kategoria);

          return (
            <div key={biznesi.id} onClick={() => setBiznesiIzgjedhur(biznesi)}
              style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.1s' }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
              <img src={imazhiPërfundimtar} alt={biznesi.emri} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <span style={{ display: 'inline-block', padding: '3px 8px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{biznesi.kategoria || 'Biznes'}</span>
                  {biznesi.verifikuar && (
                    <span style={{ display: 'inline-block', padding: '3px 8px', backgroundColor: '#16a34a15', color: '#16a34a', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>✓ E VERIFIKUAR</span>
                  )}
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#1f2937', fontWeight: 'bold' }}>{biznesi.emri}</h3>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RatingStars biznesiId={typeof biznesi.id === 'string' ? biznesi.id : null} vleresimiAktual={biznesi.yllatNumer || biznesi.vleresimi || 0} />
                  </div>
                  <p style={{ margin: '8px 0 5px 0', color: '#6b7280', fontSize: '14px' }}>📍 {biznesi.qyteti}{biznesi.adresa ? ` — ${biznesi.adresa}` : ''}</p>
                  {biznesi.oferta ? (
                    <p style={{ margin: '4px 0 0 0', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>{biznesi.oferta}</p>
                  ) : null}
                </div>
                <button onClick={(e) => { e.stopPropagation(); window.open(merrMapsUrl(biznesi), '_blank'); }} style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '15px' }}>
                  Navigo 🧭
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && biznesetEFiltruara.length === 0 && (
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px' }}>
          Nuk u gjet asnjë biznes për "{kerkimi}". Provo me: hotel, restorant, karburant, Suharekë...
        </p>
      )}
    </div>
  );
}

export default ListaBizneseve;
