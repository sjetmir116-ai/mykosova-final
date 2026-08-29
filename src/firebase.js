import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCo720b5hAPjp-taEH78nMs5G7DSE8FKGk",
  authDomain: "my-kosova.firebaseapp.com",
  databaseURL: "https://my-kosova-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-kosova",
  storageBucket: "my-kosova.firebasestorage.app",
  messagingSenderId: "766501162220",
  appId: "1:766501162220:web:211fb4f10fa55fdf2d29c9",
  measurementId: "G-SL8JVCJGK8"
};

// Inicializimi i aplikacionit
const app = initializeApp(firebaseConfig);

// Eksportimi i Firestore për t'u përdorur në skedarët e tjerë
export const db = getFirestore(app);

// Eksportimi i Auth (llogaritë e përdoruesve + adminit — credentials server-side te Firebase)
export const auth = getAuth(app);

// Eksportimi i Functions (pagesat: nisPagesen, hapPortalin, anuloSubscription, riperditStatistikat)
export const fcn = getFunctions(app);

// Inicializimi i Analytics — VETËM në mjedise që e mbështetin (browser me cookies).
// Pattern-i zyrtar i Firebase: pa guard, shton "window is not defined" te
// service worker, SSR ose mjedise pa cookies. (Nuk përdoret ende nga UI — Faza 3.4)
let analytics = null;
try {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn('Analytics s\u2019u inicializua (mjedis i pamështetur):', e.message);
}
export { analytics };
