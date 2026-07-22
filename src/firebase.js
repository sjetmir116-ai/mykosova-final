import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8",
  authDomain: "://firebaseapp.com",
  projectId: "mykosova-final",
  storageBucket: "://appspot.com",
  messagingSenderId: "105", 
  appId: "1:105"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
