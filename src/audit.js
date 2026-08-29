import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ===== AUDIT LOG =====
// Çdo veprim kritik regjistrohet: KUSH (uid/email) + KUR (serverTimestamp) + ÇFARË (veprimi + detajet)
// Veprimet: regjistrim, hyrje, dalje, miratim, rifuzim, fshirje, ndryshim, sinkronizim, kontent...
// Shikohet nga admini te Paneli → "Audit Log"

export function regjistroAudit(veprimi, detajet = {}) {
  try {
    const u = auth.currentUser;
    addDoc(collection(db, 'auditLogs'), {
      uid: u ? u.uid : 'anonim',
      email: u ? u.email : 'anonim',
      veprimi: String(veprimi),
      detajet: detajet || {},
      koha: serverTimestamp(),
    });
  } catch (e) {
    // Audit nuk duhet të bllokkojë kurrë aplikacionin
    console.warn('S\u2019u regjistruar te audit log:', e.message);
  }
}
