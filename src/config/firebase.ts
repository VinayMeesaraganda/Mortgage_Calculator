// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA8yemMWoFUOfte_T8-hLMcnj9A2aOqMNc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "personal-fianance-5b5ea.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "personal-fianance-5b5ea",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "personal-fianance-5b5ea.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "432970825901",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:432970825901:web:8159ad2b3b9b6f3cb3c624",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Q8LPB2G3HY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics already initialized or not available
    console.warn('Firebase Analytics initialization skipped:', error);
  }
}

export { analytics };
export default app;

