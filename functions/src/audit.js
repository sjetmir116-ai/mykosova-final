// ===== AUDIT LOG =====
// Regjistron veprimet kryesore te koleksioni auditLogs (i lexuar nga Paneli Admin)
const getAdmin = require('./admin-lazy');

async function regjistroAudit(uid, email, veprimi, detajet = {}) {
  try {
    const db = getAdmin().firestore();
    await db.collection('auditLogs').add({
      uid: uid || 'system',
      email: email || '',
      veprimi: String(veprimi),
      detajet: detajet || {},
      koha: db.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // Audit nuk e bllokon kurrë fluxin kryesor
    console.error('S\u2019u regjistruar te audit:', e.message);
  }
}

module.exports = { regjistroAudit };
