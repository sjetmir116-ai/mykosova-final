// ===== RUNNER I TESTEVE LOKALE =====
console.log('=== TESTET E SIGURISË & LOGJIKA — MyKosova Functions ===\n');

const sig = require('./test-paddle-signature');
console.log('\n--- Bilancimi i makines së gjendjes ---');
const billing = require('./test-billing');

const teGjitha = [...sig.rezultate, ...billing.rezultate];
const kaluan = teGjitha.filter((t) => t.ok).length;
const dështuan = teGjitha.length - kaluan;

console.log(`\n=== PËRFUNDIMI: ${kaluan} të kaluara, ${dështuan} GABIME ${dështuan ? '⚠️' : '✅ GJITHÇKA SAKTË'} ===`);
process.exit(dështuan > 0 ? 1 : 0);
