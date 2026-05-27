import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCGHHPFx7pwdUJV1zYNVlUKYuLPCd-mEig",
  authDomain: "lunchbox-486614.firebaseapp.com",
  projectId: "lunchbox-486614",
  storageBucket: "lunchbox-486614.firebasestorage.app",
  messagingSenderId: "873077214935",
  appId: "1:873077214935:web:87b22ef42c2f53e6ee2a92",
  measurementId: "G-9LCYLR1EVE"
};

// Initialize Firebase App (Server/Client safe checks)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics conditionally (only in client browser environment)
export const initAnalytics = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};
