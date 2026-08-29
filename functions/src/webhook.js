// ===== WEBHOOK — PUNKTI I HYRJES SË EVENT-EVE TË PADDLE =====
// Siguria: 1) verifikim signature  2) idempotency (anti double-delivery)
//         3) vetëm billing.js prekë Firestore
const { onRequest } = require('firebase-functions/v2/https');
const { verifikoWebhook } = require('./providers/paddle');
const { apikoNgaEvent } = require('./billing');
const getAdmin = require('./admin-lazy');

exports.apiWebhook = onRequest({ region: 'europe-west1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ gabim: 'Vetëm POST' });
    return;
  }

  // 1) VERIFIKIMI I SIGNATURES (event pa signature të vlefshme = refuzohet 100%)
  const rawBody = req.rawBody || '';
  const v = verifikoWebhook(rawBody, req.headers['paddle-signature']);
  if (!v.valide) {
    console.warn('Webhook i refuzuar: ' + v.gabim);
    res.status(400).json({ gabim: v.gabim });
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    res.status(400).json({ gabim: 'JSON i pavlefshëm' });
    return;
  }

  const eventId = event.notification_id;
  if (!eventId) {
    res.status(400).json({ gabim: 'Event pa notification_id' });
    return;
  }

  const db = getAdmin().firestore();

  // 2) IDEMPOTENCE — nëse event-i u morë më parë, s\u2019u përpunon dy herë (anti-aktivizim-dyfish)
  const dupe = await db.runTransaction(async (tx) => {
    const ref = db.collection('webhookEvents').doc(eventId);
    const snap = await tx.get(ref);
    if (snap.exists) return true;
    tx.set(ref, { marrurM: new Date().toISOString(), trajtuar: false });
    return false;
  }).catch((e) => {
    // Nëse transaction dështon (rrjetë), vazhdojmë por rreziku i dyfishit mbetet i vogël
    console.error('Idempotency transaction dështoi:', e.message);
    return false;
  });

  if (dupe) {
    res.status(200).json({ mire: true, dupe: true });
    return;
  }

  // 3) PËRPUNIMI
  try {
    const rez = await apikoNgaEvent(event);
    await db.collection('webhookEvents').doc(eventId).update({ trajtuar: true });
    console.log('Webhook i përpunuar: ' + event.event + ' → ' + JSON.stringify(rez));
    res.status(200).json({ mire: true, ...rez });
  } catch (e) {
    console.error('Gabim te përpunimi i webhook: ' + e.message);
    // Fshij marker-in që Paddle e riprovon (retry) — pa marker do ta shpallte "dupe"
    await db.collection('webhookEvents').doc(eventId).delete().catch(() => {});
    res.status(500).json({ gabim: 'Dështim përpunimi — do riprovohet nga Paddle' });
  }
});
