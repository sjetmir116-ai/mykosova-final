import { initializeApp } from "firebase/app";
import { initializeFirestore, initializeDb } from "firebase/firestore";

// Konfigurimi yt ekzistues i Firebase (Lere këtë pjesë saktësisht siç e ke në kompjuter)
const firebaseConfig = {
  apiKey: "API_KEY_YTI",
  authDomain: "PROJEKTI_://firebaseapp.com",
  projectId: "PROJEKTI_YTI",
  storageBucket: "PROJEKTI_://appspot.com",
  messagingSenderId: "ID_YTE",
  appId: "APP_ID_YTI"
};

// Inicializimi i aplikacionit
const app = initializeApp(firebaseConfig);

// ZGJIDHJA PËR IPHONE: Kjo i detyron pajisjet Apple të lidhen pa bllokime
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
