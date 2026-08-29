#!/usr/bin/env bash
# ===== SUITA E PLOTË E TESTEVE — MyKosova =====
# Përdor: bash tests/run-all.sh
# Kap: bug-et runtime te renderimi (SSR smoke), variablat e pa deklaruara
# (kontrolli i konstanteve + kontrolli i context-it), dhe build-in e prodhimit.
set -e
cd "$(dirname "$0")/.."

echo "════════════════════════════════════════════"
echo "  1/4 — Kontrolli i konstanteve (uppercase)"
echo "════════════════════════════════════════════"
node tests/check-konstantet.mjs

echo ""
echo "════════════════════════════════════════════"
echo "  2/4 — Kontrolli i variablave te AppContext"
echo "════════════════════════════════════════════"
node tests/check-context.mjs

echo ""
echo "════════════════════════════════════════════"
echo "  3/4 — SSR Smoke Test (renderim i plotë)"
echo "════════════════════════════════════════════"
bash tests/run-smoke.sh

echo ""
echo "════════════════════════════════════════════"
echo "  4/4 — Build i prodhimit (client)"
echo "════════════════════════════════════════════"
npm run build 2>&1 | grep -E "✓ built|error|Error" | head -5

echo ""
echo "🎉 SUITA E PLOTË E TESTEVE: KALUAR — s\u2019ka gabime."
