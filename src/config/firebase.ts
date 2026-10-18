import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Configuration for XD-Short Studio
 * Project ID: xd-short
 */
export const firebaseConfig = {
  apiKey: "AIzaSyD7FrogJfzV__stRJBB2hhP6NRAWR_4ogg",
  authDomain: "xd-short.firebaseapp.com",
  projectId: "xd-short",
  storageBucket: "xd-short.firebasestorage.app",
  messagingSenderId: "545214005812",
  appId: "1:545214005812:web:6f3bcbf00d28ff95040061",
  measurementId: "G-18HY7NGYQV"
} as const;

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

