// ===== STATS — COUNTER TË ATOMIC (zgjidh S1-Remaining #6) =====
// Client-i s'mund t'i rrit këto nga browser-i (rules v2.0) — i rrit vetëm pronari
// nëpërmjet këtij callable (increment atomic server-side)
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const getAdmin = require('./admin-lazy');
const { regjistroAudit } = require('./audit');

const FUSHAT_E_LEJUESHME = ['shikime', 'klikTelefoni', 'klikWhatsApp', 'klikNavigo'];

exports.riperditStatistikat = onCall({ region: 'europe-west1' }, async (e) => {
  const { biznesiId, fusha, sasia = 1 } = e.data || {};
  if (!biznesiId || !FUSHAT_E_LEJUESHME.includes(fusha)) {
    throw new HttpsError('invalid-argument', 'Fusha e pavlefshme. Lejuar: ' + FUSHAT_E_LEJUESHME.join(', '));
  }
  if (!e.auth) throw new HttpsError('unauthenticated', 'Duhet të jeni i loguar');
  if (sasia < 1 || sasia > 10) throw new HttpsError('invalid-argument', 'Sasia duhet të jetë 1-10');

  const db = getAdmin().firestore();
  const biz = await db.collection('bizneset').doc(biznesiId).get();
  if (!biz.exists) throw new HttpsError('not-found', 'Biznesi nuk u gjet');
  const prof = await db.collection('përdoruesit').doc(e.auth.uid).get();
  const esAdmin = prof.exists && ['admin', 'super_admin', 'moderator'].includes(prof.data().roli);
  if (biz.data().uidPronari !== e.auth.uid && !esAdmin) {
    throw new HttpsError('permission-denied', 'Vetëm pronari i biznesit mund të përditësojë statistikat');
  }

  await db.collection('bizneset').doc(biznesiId).update({ [fusha]: db.FieldValue.increment(sasia) });
  return { mire: true, fusha, sasia };
});
