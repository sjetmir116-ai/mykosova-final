// ===== SSR SMOKE TEST (kap gabimet runtime te renderimi) =====
// Renderon app-in E PLOTË server-side. Çdo ReferenceError si
// "gpsStatus is not defined" ose "ATRAKSIOET_LOKALE is not defined"
// kapet KËTU — para se ta shohë përdoruesi.
// Ekzekutohet me: shih tests/run-smoke.sh
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App.jsx';
import { AppProvider } from '../src/AppContext.jsx';

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
  return html;
}
