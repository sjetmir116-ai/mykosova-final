import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { regjistroAudit } from './audit';

// ===== AUTENTIKIMI QYNDËSOR — Firebase Auth =====
// - Fjalëkalimet ruhen server-side te Firebase (kurrë në kod ose në Firestore)
// - Profili: koleksioni `përdoruesit`, doc id = uid
// - Bootstrap: përdoruesi i PARË që regjistrohet bëhet ADMIN (kontrollon koleksioni `konfigurimi`)
// - Role: 'admin' · 'moderator' · 'user'

export function merrPërdoruesinAktual() {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : null;
}

// Lexon profilin nga Firestore
export async function merrProfilin(uid) {
  try {
    const snap = await getDoc(doc(db, 'përdoruesit', uid));
    if (snap.exists()) return { uid, ...snap.data() };
  } catch (e) {
    console.warn('Profil s\u2019u lexua:', e.message);
  }
  return null;
}

// Regjistrim i përdoruesit të ri (me bootstrap për adminin e parë)
export async function regjistroPërdoruesin({ emri, email, fjalëkalimi }) {
  if (!fjalëkalimi || fjalëkalimi.length < 6) {
    throw new Error('auth/weak-password');
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), fjalëkalimi);
  const uid = cred.user.uid;
  const emailNorm = cred.user.email.toLowerCase();

  // Bootstrap: nëse s'ka asnjë admin ende, ky bëhet admini kryesor
  let roli = 'user';
  try {
    const snap = await getDoc(doc(db, 'konfigurimi', 'global'));
    if (!snap.exists()) roli = 'admin';
  } catch (e) {
    console.warn('Bootstrap-i s\u2019u kryer (mundësisht rregulla):', e.message);
  }

  // RENDITJA E SIGURISË (rules v2): fillimisht profilli i përdoruesit
  // (rules verifikon !bootstrapIkryer() në momentin e shkruarjes së këtij dokumenti),
  // pastaj dokumenti i konfigurimit
  await setDoc(doc(db, 'përdoruesit', uid), {
    uid,
    email: emailNorm,
    emri: (emri || emailNorm.split('@')[0]).trim(),
    roli,
    krijuarM: serverTimestamp(),
  });

  if (roli === 'admin') {
    try {
      await setDoc(doc(db, 'konfigurimi', 'global'), {
        adminiKryesor: emailNorm,
        krijuarM: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Konfigurimi i bootstrap-it s\u2019u shkruar:', e.message);
    }
  }

  regjistroAudit('regjistrim', { email: emailNorm, roli });
  return { uid, email: emailNorm, emri: (emri || emailNorm.split('@')[0]).trim(), roli };
}

// Hyrje e përdoruesit ekzistues
export async function hyrPërdoruesin({ email, fjalëkalimi }) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), fjalëkalimi);
  const uid = cred.user.uid;
  let profil = await merrProfilin(uid);

  // Ripërtjekje: profilli mungon (regjistrim i kryer gjysmë, p.sh. kur rules-et ishin të mbyllura)
  if (!profil) {
    profil = await ripërtjekProfilin(uid, cred.user.email);
  }

  regjistroAudit('hyrje', { email: profil.email, roli: profil.roli });
  return profil;
}

// Nëse asnjë bootstrap s'është kryer kurrë (konfigurimi/global mungon), ky përdorues bëhet admin
async function ripërtjekProfilin(uid, email) {
  const emailNorm = String(email).toLowerCase();
  const defaulti = { uid, email: emailNorm, emri: emailNorm.split('@')[0], roli: 'user' };
  try {
    const snap = await getDoc(doc(db, 'konfigurimi', 'global'));
    if (!snap.exists()) {
      // Asnjë admin s'është krijuar kurrë → ky përdorues bëhet admini kryesor
      // RENDITJA E SIGURISË (rules v2): fillimisht profilli, pastaj konfigurimi
      const profil = { ...defaulti, roli: 'admin', krijuarM: serverTimestamp() };
      await setDoc(doc(db, 'përdoruesit', uid), profil);
      try {
        await setDoc(doc(db, 'konfigurimi', 'global'), { adminiKryesor: emailNorm, krijuarM: serverTimestamp() });
      } catch (e) {
        console.warn('Konfigurimi i bootstrap-it s\u2019u shkruar:', e.message);
      }
      regjistroAudit('regjistrim', { email: emailNorm, roli: 'admin', bootstrap: 'riprerjekje' });
      return profil;
    }
  } catch (e) {
    console.warn('Ripërtjekja e profilit s\u2019u krye:', e.message);
  }
  return defaulti;
}

// Dalje
export async function dali() {
  regjistroAudit('dalje', {});
  await signOut(auth);
}

// A është roli i dhënë admin-ose (admin / moderator / super_admin)?
export function esAdminOse(rol) {
  return ['admin', 'super_admin', 'moderator'].includes(rol);
}
