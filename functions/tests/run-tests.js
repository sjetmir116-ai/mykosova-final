// ===== RUNNER I TESTEVE LOKALE =====
console.log('=== TESTET E SIGURISË & LOGJIKA — MyKosova Functions ===\n');

const sig = require('./test-paddle-signature');
console.log('\n--- Bilancimi i makines së gjendjes ---');
const billing = require('./test-billing');

console.log('\n=== IMPORTUESI MASIV (Google Places → Firestore) ===');
const bulk = require('./test-bulk-import');

// Testet e importuesit kanë pjesë asinkrone (klienti + Firestore fals).
bulk
  .ekzekuto()
  .then(() => {
    const teGjitha = [...sig.rezultate, ...billing.rezultate, ...bulk.rezultate];
    const kaluan = teGjitha.filter((t) => t.ok).length;
    const dështuan = teGjitha.length - kaluan;

    console.log(`\n=== PËRFUNDIMI: ${kaluan} të kaluara, ${dështuan} GABIME ${dështuan ? '⚠️' : '✅ GJITHÇKA SAKTË'} ===`);
    process.exit(dështuan > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error('❌ Dështim i papritur te testet:', e);
    process.exit(1);
  });
