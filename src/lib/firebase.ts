// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC03RauSYpjVpUlDHN_7mgWdLOTut-eOeA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hint-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hint-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hint-hub.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "754731993500",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:754731993500:web:bb5e2abe651f6e8b97e059",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-W1BWBR5WLZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 