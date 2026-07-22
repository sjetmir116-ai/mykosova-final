import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

function ListaBizneseve() {
  const [bizneset, setBizneset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kerko, setKerko] = useState('');

  // Tërheqja e të dhënave nga Firebase
  const merrBizneset = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'bizneset'));
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBizneset(lista);
    } catch (error) {
      console.error("Gabim gjatë marrjes së bizneseve:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    merrBizneset();
  }, []);

  // Funksioni për fshirjen e biznesit
  const fshijBiznesin = async (id) => {
    if (window.confirm("A jeni të sigurt që dëshironi ta fshini këtë biznes?")) {
      try {
        await deleteDoc(doc(db, 'bizneset', id));
        setBizneset(bizneset.filter(b => b.id !== id));
      } catch (error) {
        console.error("Gabim gjatë fshirjes:", error);
      }
    }
  };

  // Filtrimi i bizneseve sipas kërkimit
  const biznesetEFiltruara = bizneset.filter(b => 
    b.emri?.toLowerCase().includes(kerko.toLowerCase()) ||
    b.qyteti?.toLowerCase().includes(kerko.toLowerCase()) ||
    b.kategoria?.toLowerCase().includes(kerko.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Headeri dhe Butoni Rifresko */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>
          Eksploro Kosovën <span style={{ fontSize: '16px', fontWeight: '500', color: '#6b7280', verticalAlign: 'middle', marginLeft: '5px' }}>XK</span>
        </h1>
        <button 
          onClick={merrBizneset} 
          style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s' }}
        >
          🔄 Rifresko ({bizneset.length})
        </button>
      </div>

      {/* Inputi i Kërkimit i përmirësuar */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#9ca3af' }}>🔍</span>
        <input 
          type="text" 
          placeholder="Kërko biznes, qytet ose kategori..." 
          value={kerko}
          onChange={(e) => setKerko(e.target.value)}
          style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid #e5e7eb', fontSize: '16px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s', boxSizing: 'border-box' }} 
        />
      </div>

      {/* Loading State */}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>Duke ngarkuar bizneset...</p>}

      {/* Lista e Bizneseve me Kartela Moderne */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!loading && biznesetEFiltruara.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>Nuk u gjet asnjë biznes.</p>
        )}
        
        {biznesetEFiltruara.map((b) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', transition: 'transform 0.2s' }}>
            
            {/* Pjesa e majtë: Logo dhe Detajet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#f3f4f6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContext: 'center', fontSize: '28px', justifyContent: 'center' }}>
                {b.kategoria === 'Kafene' ? '☕' : '🏢'}
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                  {b.kategoria || 'Biznes'}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: '4px 0 2px 0' }}>{b.emri || 'Pa emër'}</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📍 {b.qyteti || 'Kosovë'}
                </p>
                <div style={{ color: '#fbbf24', marginTop: '4px', fontSize: '14px' }}>⭐⭐⭐⭐⭐</div>
              </div>
            </div>

            {/* Pjesa e djathtë: Butonat e Veprimit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <button style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Harta 🗺️
              </button>
              <button style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                Thirr
              </button>
              <button 
                onClick={() => fshijBiznesin(b.id)} 
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none', padding: '2px 5px' }}
              >
                Fshij
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default ListaBizneseve;
