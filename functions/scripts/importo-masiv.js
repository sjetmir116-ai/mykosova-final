#!/usr/bin/env node
// ===== IMPORTUESI MASIV — CLI =====
// Rruga MË E SHPEJTË për lansim: pa deploy, pa timeout, pa panel.
// Përdor Admin SDK-në → shkruan direkt 'aprovar' (rules-i s'e lejon këtë nga klienti).
//
// PËRGATITJA
//   cd functions && npm install
//   export GOOGLE_APPLICATION_CREDENTIALS=/rruga/te/service-account.json
//   export GOOGLE_PLACES_API_KEY=AIza...
//
// PËRDORIMI
//   node scripts/importo-masiv.js --qytetet=Prishtinë --kategorite=Restorante --prove
//   node scripts/importo-masiv.js --te-gjitha-qytetet --kategorite=Restorante,Kafene --strategjia=plote
//
// FLAMUJT
//   --qytetet=A,B            --te-gjitha-qytetet
//   --kategorite=A,B         --te-gjitha-kategorite
//   --strategjia=shpejt|rrjete|plote     (parazgjedhje: shpejt)
//   --statusi=auto|aprovar|pendshe       (parazgjedhje: auto)
//   --qeliza-km=2.5          --maks-faqe=3
//   --maks-kerkesa=400       --maks-biznese=1000
//   --pa-foto                --perditeso
//   --prove                  (dry-run: s'shkruan asgjë)
//   --json                   (dalje JSON për skripta të tjera)
//   --ndihme

const crypto = require('crypto');
const path = require('path');

const { PlacesClient } = require('../src/places/client');
const { normalizoKerkesen, vleresoPlanin, GabimPlani } = require('../src/places/plani');
const { emratEQyteteve } = require('../src/places/qytetet');
const { emratEKategorive } = require('../src/places/kategorite');
const { ekzekutoImportin } = require('../src/bulkImport');

// ---------- parsimi i argumenteve ----------
function lexoArgumentet(argv) {
  const f = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const pa = arg.slice(2);
    const i = pa.indexOf('=');
    if (i === -1) f[pa] = true;
    else f[pa.slice(0, i)] = pa.slice(i + 1);
  }
  return f;
}

const NDIHMA = `
🚀 IMPORTUESI MASIV — Google Places → Firestore (MyKosova)

  node scripts/importo-masiv.js [flamuj]

BURIMI
  --qytetet=Prishtinë,Prizren     Qytetet (ndarës: presje)
  --te-gjitha-qytetet             Të gjitha ${emratEQyteteve().length} qytetet e katalogut
  --kategorite=Restorante,Kafene  Kategoritë
  --te-gjitha-kategorite          Të gjitha ${emratEKategorive().length} kategoritë

STRATEGJIA
  --strategjia=shpejt   Text Search me pyetje sinonime (i shpejtë, ~100-300/qytet)
  --strategjia=rrjete   Nearby mbi rrjetë qelizash (shterrues, më i shtrenjtë)
  --strategjia=plote    Të dyja (rekomandohet për qytetet kryesore)
  --qeliza-km=2.5       Brinja e qelizës për 'rrjete'/'plote' (më e vogël = më e plotë)
  --maks-faqe=3         Faqe të Text Search (maks 3 = 60 rezultate)

RUAJTJA
  --statusi=auto        auto (skor cilësie) | aprovar | pendshe
  --pa-foto             Mos merr fotot (kursen 1 thirrje API për biznes)
  --perditeso           Rifresko bizneset ekzistuese në vend që t'i kapërcejë
  --prove               DRY-RUN: tërheq nga Google, s'shkruan asgjë

KUFIJTË (mbrojtje nga faturat surprizë)
  --maks-kerkesa=400    Tavani i thirrjeve në Google Places
  --maks-biznese=1000   Tavani i bizneseve të shkruara

TJERA
  --json                Dalje JSON      --ndihme   Kjo faqe

QYTETET   : ${emratEQyteteve().join(', ')}
KATEGORITË: ${emratEKategorive().join(', ')}

SHEMBUJ
  # Provë — sa restorante ka Prishtina, pa shkruar asgjë
  node scripts/importo-masiv.js --qytetet=Prishtinë --kategorite=Restorante --prove

  # Lansimi: 7 qytetet kryesore, 3 kategoritë kryesore
  node scripts/importo-masiv.js \\
    --qytetet=Prishtinë,Prizren,Pejë,Gjakovë,Ferizaj,Gjilan,Mitrovicë \\
    --kategorite=Restorante,Kafene,Hotele --strategjia=plote --maks-biznese=2000
`;

function ndarese() {
  return '─'.repeat(58);
}

function formatoNumeratorin(n) {
  return [
    ['Vende të gjetura (me dublikatë)', n.vendeTeGjetura],
    ['Vende unike të përpunuara', n.vendeUnike],
    ['✅ Të shtuara', n.teShtuara],
    ['   └─ aprovar (publike)', n.teAprovuara],
    ['   └─ pendshe (për moderim)', n.tePendshe],
    ['🔄 Të përditësuara', n.tePerditesuara],
    ['⏭️  Dublikatë (Google ID)', n.dublikateGoogle],
    ['⏭️  Dublikatë (emër+qytet)', n.dublikateEmri],
    ['⚠️  Telefon i dyfishtë → pendshe', n.dublikateTelefoni],
    ['⏭️  Të anashkaluara', n.teAnashkaluara],
    ['❌ Gabime', n.gabime],
    ['📷 Foto të marra', n.fotoTeMarra],
    ['💸 Thirrje Google Places', n.kerkesaApi],
  ]
    .map(([e, v]) => `  ${e.padEnd(34)} ${String(v).padStart(6)}`)
    .join('\n');
}

async function kryesore() {
  const f = lexoArgumentet(process.argv.slice(2));

  if (f.ndihme || f.help || f.h) {
    console.log(NDIHMA);
    process.exit(0);
  }

  const jsonDalje = Boolean(f.json);
  const log = (...a) => { if (!jsonDalje) console.log(...a); };

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  if (!apiKey) {
    console.error('❌ Mungon GOOGLE_PLACES_API_KEY.\n   export GOOGLE_PLACES_API_KEY=AIza...');
    process.exit(1);
  }

  let kerkesa;
  try {
    kerkesa = normalizoKerkesen({
      qytetet: f['te-gjitha-qytetet'] ? emratEQyteteve() : f.qytetet,
      kategorite: f['te-gjitha-kategorite'] ? emratEKategorive() : f.kategorite,
      strategjia: f.strategjia,
      statusi: f.statusi,
      qelizaKm: f['qeliza-km'],
      maksFaqe: f['maks-faqe'],
      maksKerkesaApi: f['maks-kerkesa'],
      maksBiznese: f['maks-biznese'],
      merrFotot: !f['pa-foto'],
      perditeso: Boolean(f.perditeso),
      prove: Boolean(f.prove),
    });
  } catch (e) {
    if (e instanceof GabimPlani) {
      console.error(`❌ ${e.message}`);
      process.exit(1);
    }
    throw e;
  }

  const vleresimi = vleresoPlanin(kerkesa);

  log(ndarese());
  log('🚀 IMPORTUESI MASIV — Google Places → Firestore');
  log(ndarese());
  log(`  Qytetet    : ${kerkesa.qytetet.join(', ')}`);
  log(`  Kategoritë : ${kerkesa.kategorite.join(', ')}`);
  log(`  Strategjia : ${kerkesa.strategjia}${kerkesa.strategjia !== 'shpejt' ? ` (qeliza ${kerkesa.qelizaKm} km)` : ''}`);
  log(`  Statusi    : ${kerkesa.statusi}${kerkesa.statusi === 'auto' ? ' (skor cilësie ≥ 8 → aprovar)' : ''}`);
  log(`  Fotot      : ${kerkesa.merrFotot ? 'po' : 'jo'}   Përditësim: ${kerkesa.perditeso ? 'po' : 'jo'}`);
  log(ndarese());
  log(`  Taskа: ${vleresimi.taskat}  ·  thirrje kërkimi: ~${vleresimi.kerkesaKerkimi}  ·  tavan: ${kerkesa.maksKerkesaApi}`);
  if (!vleresimi.brendaKufirit) {
    log(`  ⚠️  Plani e kalon tavanin — importi do të ndalet te ${kerkesa.maksKerkesaApi} thirrje.`);
    log('      Rrite me --maks-kerkesa=N ose vazhdo duke e rinisur komandën.');
  }
  if (kerkesa.prove) log('  🧪 PROVË (dry-run) — asgjë NUK do të shkruhet te Firestore.');
  log(ndarese());

  // Admin SDK ngarkohet VETËM tani — që --ndihme dhe validimi të punojnë pa credentials.
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
      console.error('❌ Mungojnë credentials.\n   export GOOGLE_APPLICATION_CREDENTIALS=/rruga/te/service-account.json');
      process.exit(1);
    }
    admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'my-kosova' });
  }
  const db = admin.firestore();

  log('📇 Duke ngarkuar indeksin e bizneseve ekzistuese...');
  const klienti = new PlacesClient({ apiKey });

  let rreshtiIFundit = '';
  const fillimi = Date.now();

  const rez = await ekzekutoImportin({
    db,
    klienti,
    crypto,
    kerkesa,
    // CLI-ja s'ka timeout → një kalim i vetëm deri në fund.
    buxhetiMs: Number.MAX_SAFE_INTEGER,
    autori: 'Importuesi masiv (CLI)',
    uidPronari: 'sistemi',
    onProgres: async ({ numeratori, kursori, taskat }) => {
      if (jsonDalje) return;
      const perqindja = Math.round(((kursori.task + 1) / taskat) * 100);
      const rreshti = `  ⏳ ${String(perqindja).padStart(3)}%  task ${kursori.task + 1}/${taskat}  ·  +${numeratori.teShtuara} shtuar  ·  ${numeratori.dublikateGoogle + numeratori.dublikateEmri} dublikatë  ·  ${numeratori.kerkesaApi} thirrje`;
      if (rreshti !== rreshtiIFundit) {
        process.stdout.write(`\r${rreshti.padEnd(100)}`);
        rreshtiIFundit = rreshti;
      }
    },
  });

  if (!jsonDalje && rreshtiIFundit) process.stdout.write('\n');

  const sekonda = Math.round((Date.now() - fillimi) / 1000);

  if (jsonDalje) {
    console.log(JSON.stringify({ ...rez, sekonda }, null, 2));
    process.exit(rez.numeratori.gabime > 0 ? 1 : 0);
  }

  log(ndarese());
  log(rez.perfunduar ? '✅ IMPORTI PËRFUNDOI' : `⏸️  IMPORTI U NDAL (${rez.ndalesa})`);
  log(ndarese());
  log(formatoNumeratorin(rez.numeratori));
  log(`  ${'Kohëzgjatja'.padEnd(34)} ${String(sekonda + 's').padStart(6)}`);
  log(ndarese());

  const arsyet = Object.entries(rez.arsyet || {});
  if (arsyet.length) {
    log('  Arsyet e anashkalimit:');
    for (const [a, n] of arsyet.sort((x, y) => y[1] - x[1])) log(`    · ${a}: ${n}`);
    log(ndarese());
  }

  if (rez.mostra?.length) {
    log(`  Mostra (${rez.mostra.length} nga ${rez.numeratori.vendeUnike}):`);
    for (const m of rez.mostra.slice(0, 15)) {
      const shenja = m.status === 'aprovar' ? '✅' : '⏳';
      log(`    ${shenja} ${m.emri} — ${m.kategoria}, ${m.qyteti} (skor ${m.skori})`);
    }
    log(ndarese());
  }

  if (rez.gabimet?.length) {
    log('  ❌ Gabime:');
    for (const g of rez.gabimet) log(`    · ${g}`);
    log(ndarese());
  }

  if (!rez.perfunduar) {
    log('  ↻ Rinise të njëjtën komandë për të vazhduar (dublikatat kapërcehen automatikisht).');
    if (rez.ndalesa === 'kufiri_kerkesave') log(`    Ose rrite tavanin: --maks-kerkesa=${kerkesa.maksKerkesaApi * 2}`);
    if (rez.ndalesa === 'kufiri_bizneseve') log(`    Ose rrite tavanin: --maks-biznese=${kerkesa.maksBiznese * 2}`);
    log(ndarese());
  }

  if (kerkesa.prove) {
    log('  🧪 Ishte PROVË — asgjë s\u2019u shkrua. Hiq --prove për import real.');
    log(ndarese());
  } else if (rez.numeratori.tePendshe > 0) {
    log(`  👉 ${rez.numeratori.tePendshe} biznese presin te /admin → Menaxho Bizneset (filtri ⏳ Pendshe).`);
    log(ndarese());
  }

  process.exit(0);
}

kryesore().catch((e) => {
  console.error(`\n❌ ${e?.kodi ? `[${e.kodi}] ` : ''}${e?.message || e}`);
  if (process.env.DEBUG) console.error(e);
  process.exit(1);
});
