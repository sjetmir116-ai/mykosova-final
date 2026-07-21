import { useState, useEffect, useContext } from 'react';
import { AppContext } from './context/AppContext';
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

function SmartSearch() {
  const { darkMode } = useContext(AppContext);
  const [bizneset, setBizneset] = useState([]);
  const [kërkimi, setKërkimi] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error("Gabim gjatë kërkimit:", error);
        setLoading(false);
      }
    };
    merrBizneset();
  }, []);

  // Logjika e filtrimit inteligjent
  const biznesetEFiltruara = bizneset.filter((b) => {
    const fjalaKyçe = kërkimi.toLowerCase();
    return (
      (b.emri?.toLowerCase() || '').includes(fjalaKyçe) ||
      (b.kategoria?.toLowerCase() || '').includes(fjalaKyçe) ||
      (b.qyteti?.toLowerCase() || '').includes(fjalaKyçe)
    );
  });

  // Stilet vizuale bazuar në temën Dark/Light
  const stiliSfondit = darkMode ? '#111827' : '#f3f4f6';
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';

  return (
    <div style={{ backgroundColor: stiliSfondit, minHeight: 'calc(100vh - 145px)', padding: '40px 20px', fontFamily: 'sans-serif', color: stiliTekstit }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <h2 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: '800', textAlign: 'center' }}>Kërkimi Inteligjent 🔍</h2>
        <p style={{ margin: '0 0 25px 0', fontSize: '14px', color: '#8e8e93', textAlign: 'center' }}>Gjeni kafene, restorante apo dyqane kudo në Kosovë</p>

        {/* Inputi i Kërkimit */}
        <div style={{ marginBottom: '30px' }}>
          <input 
            type="text" 
            value={kërkimi} 
            onChange={(e) => setKërkimi(e.target.value)} 
            placeholder="Kërko sipas emrit, qytetit ose kategorisë..." 
            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, fontSize: '15px', outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
          />
        </div>

        {/* Lista e Rezultateve */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#8e8e93', fontWeight: '600' }}>Duke ngarkuar bizneset...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {biznesetEFiltruara.length > 0 ? (
              biznesetEFiltruara.map((b) => (
                <div key={b.id} style={{ backgroundColor: stiliKartelës, padding: '20px', borderRadius: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: darkMode ? '1px solid #2d2d2d' : '1px solid #f2f2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#3b82f6', backgroundColor: '#3b82f615', padding: '4px 8px', borderRadius: '6px' }}>
                      {b.kategoria || 'Biznes'}
                    </span>
                    <h3 style={{ margin: '8px 0 4px 0', fontSize: '18px', fontWeight: '800' }}>🏢 {b.emri}</h3>
                    <p style={{ margin: '0', fontSize: '13px', color: '#8e8e93' }}>📍 {b.qyteti}</p>
                  </div>
                  
                  <a 
                    href={`https://google.com{encodeURIComponent(b.emri + " " + b.qyteti + " Kosovo")}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', backgroundColor: '#3b82f6', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}
                  >
                    Shiko 🚀
                  </a>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#8e8e93', marginTop: '20px' }}>Nuk u gjet asnjë biznes për "{kërkimi}"</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default SmartSearch;
