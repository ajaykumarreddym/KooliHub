import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getMessaging, Messaging } from "firebase/messaging";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-peDNnwnXIU7g5nPBXhi-GUebTKhUUWQ",
  authDomain: "koolihub.firebaseapp.com",
  projectId: "koolihub",
  storageBucket: "koolihub.firebasestorage.app",
  messagingSenderId: "609901106592",
  appId: "1:609901106592:web:856d26499d09a86ad7c0c5",
  measurementId: "G-LPPGJ45CCC",
};

// Web push certificate
export const VAPID_KEY =
  "BF-wfIHKzO_zWkZdW9_FRwFZE3nOPyOFJdN6Hk9CxxIsI9ACEQ8OvjTHtXNQ8PC8GqLE-4VFtv7kkUKzsP2vlmM";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services only in browser environment
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
    auth = getAuth(app);
    firestore = getFirestore(app);

    // Initialize messaging only if supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.warn("Firebase services initialization failed:", error);
  }
}

export { app, analytics, messaging, auth, firestore };
export default app;
