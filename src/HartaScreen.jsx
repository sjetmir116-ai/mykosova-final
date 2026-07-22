import { useEffect, useState, useContext } from 'react';
import { AppContext } from './context/AppContext';
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
// Importet për hartën reale
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Rregullimi i ikonave standarde të Leaflet për të shmangur gabimet gjatë build-it
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cloudflare.com',
  iconUrl: 'https://cloudflare.com',
  shadowUrl: 'https://cloudflare.com',
});

// Komponent për të lëvizur hartën automatikisht kur ndryshon lokacioni i përdoruesit
function NdryshoQendren({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function HartaScreen() {
  const { darkMode, userLocation } = useContext(AppContext);
  const [bizneset, setBizneset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sateliteMode, setSateliteMode] = useState(false);
  const [biznesiIZgjedhur, setBiznesiIZgjedhur] = useState(null);

  const qendraKosoves = { lat: 42.6629, lng: 21.1655 };
  const latAktuale = userLocation ? userLocation.lat : qendraKosoves.lat;
  const lngAktuale = userLocation ? userLocation.lng : qendraKosoves.lng;
  const pozicioniAktual = [latAktuale, lngAktuale];

  useEffect(() => {
    const merrBiznesetEPlota = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bizneset"));
        const lista = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            ...data,
            lat: Number(data.lat) || (latAktuale + (Math.random() - 0.5) * 0.1),
            lng: Number(data.lng) || (lngAktuale + (Math.random() - 0.5) * 0.1)
          });
        });
        setBizneset(lista);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    merrBiznesetEPlota();
  }, [latAktuale, lngAktuale]);

  const llogaritDistancenKM = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: darkMode ? '#fff' : '#666' }}>🗺️ Duke sinkronizuar hartën reale...</div>;

  // Stilet e hartave (Standarde ose Satelitore/Dark)
  const urlHarta = sateliteMode 
    ? 'https://{s}://{x}&y={y}&z={z}' 
    : (darkMode 
        ? 'https://{s}://{z}/{x}/{y}{r}.png' 
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'); 

  const subdomainsHarta = sateliteMode ? ['mt0', 'mt1', 'mt2', 'mt3'] : ['a', 'b', 'c', 'd'];

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 145px)', fontFamily: 'sans-serif' }}>
      
      <MapContainer 
        center={pozicioniAktual} 
        zoom={10} 
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          url={urlHarta}
          subdomains={subdomainsHarta}
          attribution='&copy; OpenStreetMap'
        />
        
        <NdryshoQendren center={pozicioniAktual} />

        {/* Mbyllja e thjeshtë e Markerit pa gabime */}
        <Marker position={pozicioniAktual}>
          <Popup><b>Unë jam këtu</b></Popup>
        </Marker>

        {bizneset.map((b) => {
          const dist = llogaritDistancenKM(latAktuale, lngAktuale, b.lat, b.lng);
          const kohaEstimo = Math.round(dist * 1.5); 

          return (
            <Marker 
              key={b.id} 
              position={[b.lat, b.lng]} 
              eventHandlers={{
                click: () => setBiznesiIZgjedhur({ ...b, dist, kohaEstimo })
              }}
            >
              <Popup>
                <div style={{ fontWeight: 'bold' }}>{b.emri}</div>
                <div>{dist} KM larg meje</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1500 }}>
        <button 
          onClick={() => setSateliteMode(!sateliteMode)}
          style={{ width: '45px', height: '45px', borderRadius: '12px', border: 'none', backgroundColor: darkMode ? '#1c1c1e' : '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer', fontSize: '20px', color: darkMode ? '#fff' : '#000' }}
        >
          {sateliteMode ? '🗺️' : '🛰️'}
        </button>
      </div>

      {biznesiIZgjedhur && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px', right: '20px',
          backgroundColor: darkMode ? '#1c1c1e' : '#ffffff',
          borderRadius: '24px', padding: '20px', zIndex: 1600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: darkMode ? '1px solid #2d2d2d' : '1px solid #f2f2f7',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: darkMode ? '#fff' : '#000'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#3b82f6', backgroundColor: '#3b82f615', padding: '4px 8px', borderRadius: '8px' }}>
              {biznesiIZgjedhur.kategoria || 'Biznes'}
            </span>
            <h3 style={{ margin: '8px 0 4px 0', fontSize: '18px', fontWeight: '800' }}>🏢 {biznesiIZgjedhur.emri}</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#8e8e93' }}>📍 {biznesiIZgjedhur.qyteti}</p>
            
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: '700', color: '#34c759' }}>
              <span>📏 {biznesiIZgjedhur.dist} KM</span>
              <span>🚗 ~{biznesiIZgjedhur.kohaEstimo} min</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a 
              href={`https://google.com{encodeURIComponent(biznesiIZgjedhur.emri + " " + biznesiIZgjedhur.qyteti + " Kosovo")}`}
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', backgroundColor: '#34c759', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}
            >
              Navigo 🚀
            </a>
            <button 
              onClick={() => setBiznesiIZgjedhur(null)}
              style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Mbyll
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default HartaScreen;
