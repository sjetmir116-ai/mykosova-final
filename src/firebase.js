import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// Ky është konfigurimi yt i saktë që sapo kopjuam nga historiku:
const firebaseConfig = {
  apiKey: "AIzaSyA8...", // Ngjit këtu pjesën tënde të saktë nëse ndryshon nga kjo
  authDomain: "://firebaseapp.com",
  projectId: "mykosova-final",
  storageBucket: "://appspot.com",
  messagingSenderId: "105...", 
  appId: "1:105..."
};

const app = initializeApp(firebaseConfig);

// Ky është rreshti magjik që detyron Safari-n në iPhone dhe Mac ta hapi faqen super
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
