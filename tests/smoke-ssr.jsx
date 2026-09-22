// ===== SSR SMOKE TEST (kap gabimet runtime te renderimi) =====
// Renderon app-in E PLOTË server-side. Çdo ReferenceError si
// "gpsStatus is not defined" ose "ATRAKSIOET_LOKALE is not defined"
// kapet KËTU — para se ta shohë përdoruesi.
// Ekzekutohet me: shih tests/run-smoke.sh
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App.jsx';
import { AppProvider } from '../src/AppContext.jsx';
import ImportMasiv from '../src/admin/ImportMasiv.jsx';

// Paneli i adminit nuk renderohet nga App-i pa hyrje, prandaj kontrollohet veç.
// Mbron rrugën e përkohshme "import direkt nga browseri" nga regresionet.
function kontrolloImportMasiv() {
  const html = renderToString(
    <AppProvider>
      <ImportMasiv />
    </AppProvider>
  );
  if (!html.includes('Ekzekuto Importin direkt nga Browseri')) {
    throw new Error('SSR: butoni \u201cEkzekuto Importin direkt nga Browseri\u201d mungon te ImportMasiv!');
  }
  if (!html.includes('GOOGLE_PLACES_API_KEY')) {
    throw new Error('SSR: fusha e \u00e7el\u00ebsit GOOGLE_PLACES_API_KEY mungon te ImportMasiv!');
  }
  return html;
}

export function main() {
  const html = renderToString(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
  // Verifikime të thjeshta se app-i renderoi vërtet
  if (!html.includes('MyKosova')) throw new Error('SSR: s\u2019u gjet "MyKosova" te HTML — app-i nuk renderoi!');
  if (!html.includes('Ballina')) throw new Error('SSR: s\u2019u gjet "Ballina" te HTML — navbar-i s\u2019u renderua!');
  if (!html.includes('Af\u00ebr meje')) throw new Error('SSR: s\u2019u gjet "Af\u00ebr meje" te HTML — seksioni GPS s\u2019u renderua!');
  kontrolloImportMasiv();
  return html;
}
