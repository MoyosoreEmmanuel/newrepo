import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdk1tEUJkTxlIVzvsS3JaS0edlPJUeIME",
  authDomain: "cropmind.firebaseapp.com",
  projectId: "cropmind",
  storageBucket: "cropmind.appspot.com",
  messagingSenderId: "6486616464",
  appId: "1:6486616464:web:ade1c28722f0cf9653eb15",
  measurementId: "G-EG8M9H4VFX",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const storage = getStorage(app);
export const database = getFirestore(app);  // Changed from 'firestore' to 'database'
