// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
// Note: Firebase API keys are public by design and safe to expose in client-side code.
// Security is enforced through Firestore Security Rules, not API keys.
// 
// REQUIRED: Set these as environment variables:
// - Vercel: Settings → Environment Variables → Add each VITE_FIREBASE_* variable
// - Local: Create a .env file with these variables (see .env.example)
//
// Environment variables are REQUIRED - no fallback values for security best practices.

function getEnvVar(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please set this in:\n` +
      `- Vercel: Settings → Environment Variables\n` +
      `- Local: Create a .env file with ${name}=your-value`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
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

