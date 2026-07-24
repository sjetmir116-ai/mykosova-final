import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { gjejFotoAutomatikisht } from './biznesFoto'; 
import RatingStars from './RatingStars'; 

function ListaBizneseve() {
  const [bizneset, setBizneset] = useState([]);
  const [kerkimi, setKerkimi] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bizneset"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBizneset(lista);
    });
    return () => unsub();
  }, []);

  const biznesetEFiltruara = bizneset.filter(b => 
    b.emri?.toLowerCase().includes(kerkimi.toLowerCase()) || 
    b.qyteti?.toLowerCase().includes(kerkimi.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '5px', fontSize: '28px', fontWeight: 'bold' }}>Kërkimi Inteligjent 🔍</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '25px' }}>Gjeni kafene, restorante apo dyqane kudo në Kosovë</p>

      <input 
        type="text" 
        placeholder="Kërko sipas emrit ose qytetit..." 
        value={kerkimi}
        onChange={(e) => setKerkimi(e.target.value)}
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
        {biznesetEFiltruara.map((biznesi) => {
          const imazhiPërfundimtar = (biznesi.foto && biznesi.foto.trim().length > 5 && biznesi.foto.startsWith('http'))
            ? biznesi.foto
            : gjejFotoAutomatikisht(biznesi.emri, biznesi.kategoria);

          return (
            <div key={biznesi.id} style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
              <img src={imazhiPërfundimtar} alt={biznesi.emri} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <span style={{ display: 'inline-block', padding: '3px 8px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{biznesi.kategoria || 'Biznes'}</span>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#1f2937', fontWeight: 'bold' }}>{biznesi.emri}</h3>
                  <RatingStars biznesiId={biznesi.id} vleresimiAktual={biznesi.yllatNumer} />
                  <p style={{ margin: '8px 0 5px 0', color: '#6b7280', fontSize: '14px' }}>📍 {biznesi.qyteti}</p>
                </div>
                <button onClick={() => window.open(`https://google.com{biznesi.lat},${biznesi.lng}`, '_blank')} style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '15px' }}>
                  Navigo 🧭
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ListaBizneseve;
