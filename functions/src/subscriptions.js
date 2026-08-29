// ===== SUBSCRIPTIONS — CALLABLES PËR BUSINESS PANEL =====
// Siguria: roli verifikohet SERVER-SIDE nga përdoruesit/{uid} (jo nga claims klienti)
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const getAdmin = require('./admin-lazy');
const { config } = require('./config');
const paddle = require('./providers/paddle');
const { regjistroAudit } = require('./audit');

const PAKETAT_E_LEJUESHME = ['gold', 'premium']; // basic = falas, s'kërkon pagesë
const STATUS_TE_BLOKUAR = ['pending', 'active', 'overdue', 'expiring'];

async function merrProfili(uid) {
  const d = await getAdmin().firestore().collection('përdoruesit').doc(uid).get();
  return d.exists ? d.data() : null;
}

// Verifikon se përdoruesi është pronar (ose admin) i biznesit
async function verifikoPronaren(e, biznesiId) {
  if (!e.auth) throw new HttpsError('unauthenticated', 'Duhet të jeni i loguar');
  const prof = await merrProfili(e.auth.uid);
  if (!prof) throw new HttpsError('permission-denied', 'Profili nuk u gjet');
  const biz = await getAdmin().firestore().collection('bizneset').doc(biznesiId).get();
  if (!biz.exists) throw new HttpsError('not-found', 'Biznesi nuk u gjet');
  const esAdmin = ['admin', 'super_admin', 'moderator'].includes(prof.roli);
  if (biz.data().uidPronari !== e.auth.uid && !esAdmin) {
    throw new HttpsError('permission-denied', 'S\u2019juni pronar i këtij biznesi');
  }
  return { uid: e.auth.uid, email: e.auth.token?.email || prof.email, prof, biznesi: biz.data() };
}

// NIS PAGESËN — krijon checkout tek Paddle dhe kthen URL-në
exports.nisPagesen = onCall({ region: 'europe-west1' }, async (e) => {
  const { biznesiId, paketa } = e.data || {};
  if (!biznesiId || !PAKETAT_E_LEJUESHME.includes(paketa)) {
    throw new HttpsError('invalid-argument', 'Kërkesë e pavlefshme (biznesiId + paketa: gold|premium)');
  }
  const { uid, email, biznesi } = await verifikoPronaren(e, biznesiId);

  // ANTI-DUPLICATE: biznesi s'ka subscription aktiv/në pranim
  const ekz = await getAdmin()
    .firestore()
    .collection('subscriptions')
    .where('biznesiId', '==', biznesiId)
    .where('status', 'in', STATUS_TE_BLOKUAR)
    .get();
  if (ekz.size > 0) {
    throw new HttpsError('failed-precondition', 'Ky biznes ka tashmë një abetim aktiv ose në pranim');
  }

  const priceId = config.paddle.prices[paketa];
  if (!priceId) {
    throw new HttpsError('failed-precondition', 'Çmimi për këtë paketë s\u2019është konfiguruar ende (S2.2)');
  }

  const customData = JSON.stringify({ biznesiId, uidPronari: uid, paketa });
  const url = await paddle.krijonCheckout({ priceId, customData });
  await regjistroAudit(uid, email, 'pagesa_nisur', { biznesiId, paketa });
  return { url };
});

// HAP PORTALIN — ri-novimi/ndërrimi i kartelës/anulimi nga biznesi (faqja e Paddle)
exports.hapPortalin = onCall({ region: 'europe-west1' }, async (e) => {
  if (!e.auth) throw new HttpsError('unauthenticated', 'Duhet të jeni i loguar');
  return { url: paddle.hapPortal() };
});

// ANULO ATEMININ — menjëherë ose në fund të periodit
exports.anuloSubscription = onCall({ region: 'europe-west1' }, async (e) => {
  const { biznesiId, menjehere = false } = e.data || {};
  if (!biznesiId) throw new HttpsError('invalid-argument', 'Mungon biznesiId');
  const { uid, email } = await verifikoPronaren(e, biznesiId);

  const db = getAdmin().firestore();
  const subSnap = await db
    .collection('subscriptions')
    .where('biznesiId', '==', biznesiId)
    .where('status', 'in', ['active', 'overdue'])
    .get();
  if (subSnap.size === 0) {
    throw new HttpsError('not-found', 'Ky biznes s\u2019ka abetim aktiv');
  }
  const sub = subSnap.docs[0];

  await paddle.anuloSubscription(sub.id, { menjehere });
  await db.collection('subscriptions').doc(sub.id).update({
    status: menjehere ? 'canceled' : 'expiring',
    arsyeja: menjehere ? 'anulim menjëherë nga biznesi' : 'anulim në fund të periodit',
    statusPerditësuarM: db.FieldValue.serverTimestamp(),
  });
  await db.collection('bizneset').doc(biznesiId).update({
    paketa: 'basic',
    paketaStatus: menjehere ? 'canceled' : 'expiring',
    paketaPerditësuarM: db.FieldValue.serverTimestamp(),
  });
  await regjistroAudit(uid, email, 'abatem_anuluar', { biznesiId, menjehere });
  return { mire: true, statusi: menjehere ? 'canceled' : 'expiring' };
});
