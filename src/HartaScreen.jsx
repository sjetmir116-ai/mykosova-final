import React, { useContext } from 'react';
import { AppContext } from './AppContext';

function HartaScreen() {
  const { darkMode, userLocation, gpsError } = useContext(AppContext);

  // Koordinatat zyrtare: nëse nuk ka kapur GPS, vendoset default lokacioni i fundit
  const lat = userLocation ? userLocation.lat : 42.3590;
  const lng = userLocation ? userLocation.lng : 20.8304;

  // Lidhja universale e saktë për Google Maps pa thonjëza të gabuara
  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=14&output=embed`;

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ color: darkMode ? '#ffffff' : '#1f2937', marginBottom: '4px' }}>Harta Dixhitale 🗺️</h2>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Gjej bizneset dhe pikat më të afërta në kohë reale.</p>

      {/* Paneli i koordinatave GPS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: darkMode ? '#1f2937' : '#ffffff', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div>
          <span style={{ fontWeight: 'bold', color: darkMode ? '#ffffff' : '#1f2937' }}>📍 Lokacioni Juaj</span>
          <br />
          <small style={{ color: '#9ca3af' }}>Gjerësia: {lat.toFixed(4)}, Gjatësia: {lng.toFixed(4)}</small>
        </div>
        <span style={{ backgroundColor: gpsError ? '#fef2f2' : '#e6f4ea', color: gpsError ? '#dc2626' : '#137333', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
          {gpsError ? 'Gabim GPS' : '● Aktiv'}
        </span>
      </div>

      {/* Kontenitori i Hartës Live me IFRAME (Zgjidhja përfundimtare) */}
      <div style={{ width: '100%', height: '450px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#e5e7eb' }}>
        <iframe
          title="MyKosova Live Map"
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}

export default HartaScreen;
