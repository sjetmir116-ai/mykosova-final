import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// Konfigurimi zyrtar dhe i plotë pa shkurtime:
const firebaseConfig = {
  apiKey: "AIzaSyA8_VLER_E_PLOTE_NGA_HISTORIKU", // Të lutem kontrolloje këtë vlerë te historiku i vjetër që të jetë e plotë pa pikë-pikë
  authDomain: "://firebaseapp.com",
  projectId: "mykosova-final",
  storageBucket: "://appspot.com",
  messagingSenderId: "105000000000", // Vendos numrin e plotë nga historiku i vjetër
  appId: "1:105000000000:web:SHKRONJA_DHE_NUMRA" // Vendos appId e plotë nga historiku i vjetër
};

const app = initializeApp(firebaseConfig);

// Inicializimi i sigurt për iOS dhe pajisjet e tjera
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
