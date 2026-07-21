import { useEffect, useState } from 'react';
import { db } from "./firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

function ListaBizneseve({ darkMode }) {
  const [bizneset, setBizneset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kerko, setKerko] = useState('');

  const merrBizneset = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "bizneset"));
      const lista = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBizneset(lista);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    merrBizneset();
  }, []);

  const votoBiznesinLive = async (id, yjetERe) => {
    try {
      await updateDoc(doc(db, "bizneset", id), { yjet: yjetERe });
      setBizneset(bizneset.map(b => b.id === id ? { ...b, yjet: yjetERe } : b));
    } catch (error) {
      console.error(error);
    }
  };

  const fshijBiznesin = async (id) => {
    if (!window.confirm("A jeni i sigurt?")) return;
    try {
      await deleteDoc(doc(db, "bizneset", id));
      setBizneset(bizneset.filter(b => b.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const biznesetEFiltruara = bizneset.filter((b) => {
    const t = kerko.toLowerCase().trim();
    return (b.emri || '').toLowerCase().includes(t) || (b.qyteti || '').toLowerCase().includes(t) || (b.kategoria || '').toLowerCase().includes(t);
  });

  // Funksion i ri me EMOJI Premium që nuk dështojnë kurrë dhe nuk varen nga serveri
  const merrEmojiKategorie = (kat) => {
    const k = (kat || "").toLowerCase().trim();
    if (k === "kafene") return "☕";
    if (k === "restorant") return "🍔";
    if (k === "furrë" || k === "furre") return "🥐";
    if (k === "butik") return "👕";
    if (k === "market") return "🛒";
    if (k === "sallon bukurie") return "✂️";
    if (k === "auto sallon") return "🚗";
    if (k === "hotel") return "🏨";
    return "🏢";
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: darkMode ? '#fff' : '#666' }}>🔄 Duke ngarkuar bizneset live...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: darkMode ? '#fff' : '#1c1c1e' }}>Eksploro Kosovën 🇽🇰</h2>
        <button onClick={merrBizneset} style={{ padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', backgroundColor: darkMode ? '#262626' : '#e3f2fd', color: darkMode ? '#60a5fa' : '#007bff', border: 'none', fontWeight: '700', fontSize: '13px' }}>🔄 Rifresko ({bizneset.length})</button>
      </div>
      
      <div style={{ position: 'relative', marginBottom: '25px' }}>
        <input placeholder="🔍 Kërko biznes, qytet ose kategori..." value={kerko} onChange={e => setKerko(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid', borderColor: darkMode ? '#2d2d2d' : '#e5e5ea', boxSizing: 'border-box', fontSize: '16px', backgroundColor: darkMode ? '#1c1c1e' : '#f2f2f7', color: darkMode ? '#fff' : '#000', outline: 'none' }} />
      </div>

      {biznesetEFiltruara.length === 0 ? (
        <p style={{ color: '#8e8e93', textAlign: 'center', marginTop: '30px' }}>Nuk u gjet asnjë lokacion.</p>
      ) : (
        biznesetEFiltruara.map((b) => {
          const kahuKerkimit = `${b.emri} ${b.qyteti} Kosovo`;
          const linkuDirekt = `https://google.com{encodeURIComponent(kahuKerkimit)}`;
          const vleresimiAktual = Number(b.yjet) || 0;
          
          return (
            <div key={b.id} style={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff', padding: '15px', borderRadius: '20px', marginBottom: '16px', border: '1px solid', borderColor: darkMode ? '#2d2d2d' : '#f2f2f7', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.04)' }}>
              
              {/* Kutia e re moderne me EMOJI të madh në vend të fotos së thyer */}
              <div style={{ 
                width: '75px', 
                height: '75px', 
                borderRadius: '14px', 
                backgroundColor: darkMode ? '#262626' : '#f2f2f7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '36px' 
              }}>
                {merrEmojiKategorie(b.kategoria)}
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '8px', backgroundColor: darkMode ? '#262626' : '#f2f2f7', color: darkMode ? '#a1a1aa' : '#636366', fontSize: '10px', fontWeight: '700', marginBottom: '4px' }}>{b.kategoria || 'Biznes'}</span>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: darkMode ? '#fff' : '#1c1c1e' }}>{b.emri}</h3>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#8e8e93' }}>📍 {b.qyteti}</p>
                
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((ylli) => (
                    <span key={ylli} onClick={() => votoBiznesinLive(b.id, ylli)} style={{ fontSize: '16px', cursor: 'pointer', color: ylli <= vleresimiAktual ? '#ffcc00' : (darkMode ? '#4b5563' : '#d1d1d6') }}>★</span>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '75px' }}>
                <a href={linkuDirekt} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', backgroundColor: '#34c759', color: '#fff', padding: '8px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', textAlign: 'center' }}>Harta 🗺️</a>
                {b.telefoni && <a href={`tel:${b.telefoni}`} style={{ textDecoration: 'none', backgroundColor: darkMode ? '#262626' : '#007bff', color: '#fff', padding: '8px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', textAlign: 'center' }}>Thirr</a>}
                <button onClick={() => fshijBiznesin(b.id)} style={{ color: '#ff3b30', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Fshij</button>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}

export default ListaBizneseve;
