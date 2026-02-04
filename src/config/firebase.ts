// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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
  if (!value || value.trim() === '') {
    // Debug: Log what we're getting
    console.error(`Environment variable ${name} is missing or empty`);
    console.error('Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_FIREBASE')));
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please set this in:\n` +
      `- Vercel: Settings → Environment Variables\n` +
      `- Local: Create a .env.local file with ${name}=your-value\n` +
      `Note: Restart dev server after creating .env.local`
    );
  }
  return value.trim();
}

// Get all environment variables
const apiKey = getEnvVar('VITE_FIREBASE_API_KEY');
const authDomain = getEnvVar('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID');
const storageBucket = getEnvVar('VITE_FIREBASE_STORAGE_BUCKET');
const messagingSenderId = getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID');
const appId = getEnvVar('VITE_FIREBASE_APP_ID');
const measurementId = getEnvVar('VITE_FIREBASE_MEASUREMENT_ID');

// Validate API key format (should start with AIza)
if (!apiKey.startsWith('AIza')) {
  console.error('Invalid API key format. Firebase API keys should start with "AIza"');
  throw new Error('Invalid Firebase API key format. Please check your VITE_FIREBASE_API_KEY environment variable.');
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
};

// Debug: Log config (without sensitive data) - only in dev
if (import.meta.env.DEV) {
  console.log('Firebase Config Status:', {
    apiKey: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
    authDomain: authDomain || 'MISSING',
    projectId: projectId || 'MISSING',
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyValid: apiKey?.startsWith('AIza') || false,
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD
  });
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  console.error('Firebase initialization error:', error);
  console.error('Firebase config used:', {
    apiKey: apiKey.substring(0, 10) + '...',
    authDomain,
    projectId
  });
  throw new Error(
    `Failed to initialize Firebase: ${error.message}\n` +
    `Please verify your environment variables are set correctly.`
  );
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize App Check if configured
const appCheckKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;
if (typeof window !== 'undefined' && appCheckKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Firebase App Check initialization skipped:', error);
    }
  }
}

// Initialize Analytics (only in browser environment)
let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics already initialized or not available
    if (import.meta.env.DEV) {
      console.warn('Firebase Analytics initialization skipped:', error);
    }
  }
}

export { analytics };
export default app;
