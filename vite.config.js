import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

// ===== KOLEKTORI I REZULTATEVE TË TESTEVE (vetëm dev-server, jo app) =====
// Faqja e testit (test-siguria.html) POST-ëon rezultatet këtu (same-origin,
// port 5173) dhe agjenti i lexon nga rezultate-testit.json
const kolektoriRezultate = {
  name: 'kolektori-rezultate-testit',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.method === 'POST' && req.url === '/rezultatet-testit') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            fs.writeFileSync('rezultate-testit.json', body);
            const r = JSON.parse(body);
            console.log('=== REZULTATET E TESTEVE U MORËN ===');
            console.log('mire=' + r.mire + ' gabim=' + r.gabim + ' roli=' + r.roli + ' kohe=' + r.kohe);
            (r.testet || []).forEach((t) => {
              console.log((t.ok ? '✅' : '❌') + ' ' + t.emri + ' → ' + t.rez + ' (pritur: ' + t.priturja + ')');
            });
          } catch (e) {
            console.error('Gabim në kolektor: ' + e.message);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end('{"mire":true}');
        });
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  // Rregullim për "Cannot read properties of null (reading 'useState')" —
  // shmang dy kopje të React në browser (shkaqi i gabimit "Invalid hook call")
  resolve: {
    dedupe: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  plugins: [
    react(),
    kolektoriRezultate,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      // ===== MANIFESTI I RI PWA — v1.0.17 =====
      // Shtuar: id, dir, lang, categories, display_override, shortcuts,
      // ikona 'maskable' të ndara + prefer_related_applications: false.
      manifest: {
        id: '/',
        name: 'My Kosova — Gjej, Rezervo, Udhëto',
        short_name: 'MyKosova',
        description: 'Super-platforma për Kosovën: Yellow Pages, Booking, Trip, Harta, Vlerësime dhe AI Asistent.',
        lang: 'sq',
        dir: 'ltr',
        theme_color: '#3b82f6',
        background_color: '#111827',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['travel', 'food', 'business', 'navigation'],
        prefer_related_applications: false,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Kërkim inteligjent',
            short_name: 'Kërko',
            description: 'Gjej biznese, hotele dhe restorante në Kosovë',
            url: '/',
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Harta & Afër meje',
            short_name: 'Harta',
            description: 'Bizneset më të afërta me pozitën tënde',
            url: '/?ekran=harta',
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Paneli i adminit',
            short_name: 'Admini',
            description: 'Menaxho bizneset, vlerësimet dhe importin masiv',
            url: '/admin',
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // Offline: faqja kryesore + asset-et; kërkesat e Firebase shkojnë live
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/admin/, /^\/biznesi/],
      },
    }),
  ],
  server: {
    allowedHosts: true,
  },
});
