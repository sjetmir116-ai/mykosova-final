import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { regjistroPërdoruesin, hyrPërdoruesin, esAdminOse, merrPërdoruesinAktual, dali } from '../auth';

// ===== SHTRESA E HYRJES SË ADMINIT =====
// Logjika e re (pa query-liste që e bllokojnë rules-et):
//   1) Provo HYRJE (llogaria ekziston) — me ripërtjekje të bootstrap-it nëse profilli mungon
//   2) Vetëm nëse "user-not-found" → REGJISTRIM (persona i parë bëhet admin)

// A ka tashmë admin? (vetëm nëse jemi të autentikuar; ndryshe null = e panjohur)
export async function kaAdminen() {
  try {
    const snap = await getDoc(doc(db, 'konfigurimi', 'global'));
    return snap.exists();
  } catch {
    return null;
  }
}

// Kthen { sukses, mesazhi, admini, paDrejte }
export async function provonHyrjen(email, fjalëkalimi, emri = '') {
  try {
    let profil;
    try {
      profil = await hyrPërdoruesin({ email, fjalëkalimi });
    } catch (err) {
      const kodi = String(err?.code || err?.message || '');
      if (kodi.includes('user-not-found')) {
        // Llogaria s'ekziston ende → regjistrimi i parë (bootstrap admin)
        profil = await regjistroPërdoruesin({ emri, email, fjalëkalimi });
      } else if (kodi.includes('wrong-password') || kodi.includes('invalid-credential')) {
        return { sukses: false, mesazhi: 'Fjalëkalim i pasaktë.' };
      } else if (kodi.includes('operation-not-allowed')) {
        return { sukses: false, mesazhi: 'Hyrja me Email/Fjalëkalim nuk është e aktivizuar te Firebase Console (Authentication → Email/Password → Enable).' };
      } else if (kodi.includes('permission-denied')) {
        return { sukses: false, mesazhi: 'Security rules s\u2019janë publikuar ende. Hap Firebase Console → Firestore → Rules → vendos rules-et → Publish.' };
      } else {
        throw err;
      }
    }

    if (profil.roli === 'iPezulluar') {
      return { sukses: false, paDrejte: true, mesazhi: 'Kjo llogari është e PEZULLUAR nga admini. Kontaktoni mbështetjen.' };
    }
    if (!esAdminOse(profil.roli)) {
      return { sukses: false, paDrejte: true, mesazhi: `Kjo llogari (${profil.email}) nuk ka të drejtë admin.` };
    }
    return { sukses: true, admini: profil };
  } catch (err) {
    return { sukses: false, mesazhi: mesazhiGabimit(err) };
  }
}

// Sesioni i adminit: bazohet te Firebase Auth (asnjë sekret në klient)
export function merrSesionin() {
  const u = merrPërdoruesinAktual();
  if (!u) return null;
  return { email: u.email, uid: u.uid, emri: u.email.split('@')[0] };
}

export function daleNgaPaneli() {
  dali().catch(() => {});
}

function mesazhiGabimit(err) {
  const m = err?.code || err?.message || String(err);
  if (m.includes('user-not-found')) return 'Email-i nuk u gjet. Regjistrohuni ose kontrollojeni.';
  if (m.includes('wrong-password') || m.includes('invalid-credential')) return 'Fjalëkalim i pasaktë.';
  if (m.includes('weak-password')) return 'Fjalëkalimi duhet të ketë të paktën 6 shenja.';
  if (m.includes('email-already-in-use')) return 'Ky email është regjistruar tashmë — provoni hyrjen.';
  if (m.includes('invalid-email')) return 'Email i pavlefshëm.';
  if (m.includes('operation-not-allowed')) return 'Hyrja me Email/Fjalëkalim nuk është e aktivizuar te Firebase (Console → Authentication → Email/Password).';
  if (m.includes('network')) return 'S\u2019u arrit Firebase — kontrollojeni internetin.';
  return 'Gabim: ' + m;
}
