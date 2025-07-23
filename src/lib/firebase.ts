// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC03RauSYpjVpUlDHN_7mgWdLOTut-eOeA",
  authDomain: "hint-hub.firebaseapp.com",
  projectId: "hint-hub",
  storageBucket: "hint-hub.appspot.com", 
  messagingSenderId: "754731993500",
  appId: "1:754731993500:web:bb5e2abe651f6e8b97e059",
  measurementId: "G-W1BWBR5WLZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 