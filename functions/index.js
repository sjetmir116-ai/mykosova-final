// ===== MYKOSOVA CLOUD FUNCTIONS — EKSPORTET PUBLIKE =====
const { onSchedule } = require('firebase-functions/v2/scheduler');
const getAdmin = require('./src/admin-lazy');
const { regjistroAudit } = require('./src/audit');
const { config } = require('./src/config');

// Webhook (Paddle → kjo)
exports.apiWebhook = require('./src/webhook').apiWebhook;

// Callables (Business Panel → kjo)
exports.nisPagesen = require('./src/subscriptions').nisPagesen;
exports.hapPortalin = require('./src/subscriptions').hapPortalin;
exports.anuloSubscription = require('./src/subscriptions').anuloSubscription;
exports.riperditStatistikat = require('./src/stats').riperditStatistikat;

// ===== SCHEDULED: pastron ofertat e skaduara (1 herë/ditë, 03:00 UTC) =====
exports.riperditOfertat = onSchedule({ schedule: '0 3 * * *', region: 'europe-west1' }, async () => {
  const db = getAdmin().firestore();
  const sot = new Date().toISOString().split('T')[0];
  const snap = await db.collection('offers').where('vlenDeri', '!=', '').where('vlenDeri', '<', sot).get();
  let fshe = 0;
  for (const d of snap.docs) {
    await d.ref.delete();
    fshe++;
  }
  if (fshe > 0) {
    await regjistroAudit('system', 'system', 'ofertat_skaduar_fshirë', { numri: fshe });
  }
  return { fshe };
});

// ===== SCHEDULED: dunning — abonimet overdue përtej grace period → canceled (1 herë/ditë, 04:00 UTC) =====
exports.kontrolloDunning = onSchedule({ schedule: '0 4 * * *', region: 'europe-west1' }, async () => {
  const db = getAdmin().firestore();
  const kufiri = Date.now() - config.gracePeriodDite * 24 * 60 * 60 * 1000;
  const snap = await db
    .collection('subscriptions')
    .where('status', '==', 'overdue')
    .where('statusPerditësuarM', '<', new Date(kufiri))
    .get();
  let anuluar = 0;
  for (const d of snap.docs) {
    const sub = d.data();
    await d.ref.update({
      status: 'canceled',
      arsyeja: 'dunning: pagesa e dështuar përtej grace period (' + config.gracePeriodDite + ' ditë)',
      statusPerditësuarM: db.FieldValue.serverTimestamp(),
    });
    if (sub.biznesiId) {
      await db.collection('bizneset').doc(sub.biznesiId).update({
        paketa: 'basic',
        paketaStatus: 'canceled',
        paketaPerditësuarM: db.FieldValue.serverTimestamp(),
      });
    }
    await regjistroAudit(sub.uidPronari || 'system', 'system', 'abatem_dunning_canceled', {
      biznesiId: sub.biznesiId, subscriptionId: d.id,
    });
    anuluar++;
  }
  return { anuluar };
});
