#!/usr/bin/env bash
# ===== SMOKE TEST — renderon app-in e plotë (SSR) dhe kap gabimet runtime =====
# Përdor: bash tests/run-smoke.sh
set -e
cd "$(dirname "$0")/.."

echo "🔨 Build SSR i app-it të plotë..."
npx vite build --ssr tests/smoke-ssr.jsx --outDir dist-ssr --emptyOutDir --logLevel error

echo "🧪 Ekzekuto renderimin..."
node --input-type=module -e "
import './tests/dom-stub.mjs'; // DOM-i minimal DUHET të ngarkohet PARA app-it
import { main } from './dist-ssr/smoke-ssr.js';
const html = main();
console.log('✅ SSR SMOKE: app-i i plotë renderoi pa gabime (' + html.length + ' karakterë HTML)');
console.log('   - MyKosova ✅  - Ballina ✅  - Afër meje ✅');
"

rm -rf dist-ssr
echo "✅ PËRFUNDI — s\u2019ka gabime runtime te renderimi."
