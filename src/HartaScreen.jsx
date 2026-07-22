import React, { useContext } from 'react';
import { AppContext } from './AppContext';

function HartaScreen() {
  const { darkMode, userLocation, gpsError } = useContext(AppContext);

  // Ngjyrat sipas temës Light/Dark
  const ngjyraTekstit = darkMode ? '#ffffff' : '#111827';
  const ngjyraNëntekstit = darkMode ? '#9ca3af' : '#4b5563';
  const sfondiKutise = darkMode ? '#1f2937' : '#ffffff';
  const korniza = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '10px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Titulli i Ekranit */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: ngjyraTekstit, margin: '0 0 4px 0' }}>Harta Dixhitale 🗺️</h2>
        <p style={{ fontSize: '14px', color: ngjyraNëntekstit, margin: 0 }}>
          Gjej bizneset dhe pikat më të afërta në kohë reale.
        </p>
      </div>

      {/* Statusi i GPS-it */}
      <div style={{ backgroundColor: sfondiKutise, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📍</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: ngjyraTekstit }}>Lokacioni Juaj</h4>
            <p style={{ margin: 0, fontSize: '12px', color: ngjyraNëntekstit }}>
              {userLocation ? `Gjerësia: ${userLocation.lat.toFixed(4)}, Gjatësia: ${userLocation.lng.toFixed(4)}` : 'Duke kërkuar GPS...'}
            </p>
          </div>
        </div>
        <div>
          {gpsError ? (
            <span style={{ fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '10px', fontWeight: '600' }}>
              ⚠️ GPS i fikur
            </span>
          ) : userLocation ? (
            <span style={{ fontSize: '12px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '10px', fontWeight: '600' }}>
              ● Aktiv
            </span>
          ) : (
            <span style={{ fontSize: '12px', backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '10px', fontWeight: '600' }}>
              ⏳ Duke u ngarkuar
            </span>
          )}
        </div>
      </div>

      {/* Kutia e Hartës (Iframe e thjeshtësuar e Kosovës ose Google Maps placeholder) */}
      <div style={{ width: '100%', height: '450px', backgroundColor: '#e5e7eb', borderRadius: '24px', overflow: 'hidden', border: `1px solid ${korniza}`, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', position: 'relative' }}>
        <iframe 
          title="MyKosova Map"
          src="https://google.com" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

    </div>
  );
}

export default HartaScreen;
