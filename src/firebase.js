import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

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

// Inicializimi i Analytics
const analytics = getAnalytics(app);
