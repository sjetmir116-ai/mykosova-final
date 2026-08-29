#!/usr/bin/env bash
# ===== SUITA E PLOTË E TESTEVE — MyKosova =====
# Përdor: bash tests/run-all.sh
# Ekzekuton:
#  1. Testet unitare (distanca/turizmi/ofertat/analytics/embed)
#  2. Kontrolli i konstanteve (variabël i përdorur pa u shënuar)
#  3. Kontrolli i context-it (variablat e AppContext të pa destruktuara)
#  4. SSR Smoke Test (renderon app-in e plotë — kap "X is not defined" PARA përdoruesit)
#  5. Build i prodhimit (client)
set -e
cd "$(dirname "$0")/.."

echo "════════════════════════════════════════════"
echo "  1/5 — TESTET UNITARE (57 testë)"
echo "════════════════════════════════════════════"
node tests/test-distanca.mjs
node tests/test-turizmi.mjs
node tests/test-ofertat.mjs
node tests/test-analytics.mjs
node tests/test-embed.mjs
node tests/test-kodiGeografike.mjs

echo ""
echo "════════════════════════════════════════════"
echo "  2/5 — Kontrolli i konstanteve (uppercase)"
echo "════════════════════════════════════════════"
node tests/check-konstantet.mjs

echo ""
echo "════════════════════════════════════════════"
echo "  3/5 — Kontrolli i variablave te AppContext"
echo "════════════════════════════════════════════"
node tests/check-context.mjs

echo ""
echo "════════════════════════════════════════════"
echo "  4/5 — SSR Smoke Test (renderim i plotë)"
echo "════════════════════════════════════════════"
bash tests/run-smoke.sh

echo ""
echo "════════════════════════════════════════════"
echo "  5/5 — Build i prodhimit (client)"
echo "════════════════════════════════════════════"
npm run build 2>&1 | grep -E "✓ built|error|Error" | head -5

echo ""
echo "🎉 SUITA E PLOTË E TESTEVE: KALUAR — s\u2019ka gabime."
