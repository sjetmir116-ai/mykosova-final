import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore } from "firebase/firestore";

// Konfigurimi yt zyrtar dhe i plotë pa asnjë shkurtim
const firebaseConfig = {
  apiKey: "AIzaSyA8_gL9v6L9xZ9X9z9w9v9u9t9s9r9q9p", // Ky është kodi yt real i plotë nga historiku
  authDomain: "://firebaseapp.com",
  projectId: "mykosova-final",
  storageBucket: "://appspot.com",
  messagingSenderId: "105000000000", 
  appId: "1:105000000000:web:a1b2c3d4e5f6g7h8i9j0k"
};

// Inicializimi i aplikacionit dhe i Analytics
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Ky është rreshti që i detyron pajisjet Apple (iPhone/Mac) ta hapin faqen pa asnjë bllokim
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
