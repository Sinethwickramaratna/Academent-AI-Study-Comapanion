// Import necessary Firebase SDK modules
import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Access Vite's client-side environment variables
const env = import.meta.env;

// Firebase configuration settings populated from environment variables
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App instance. 
// Checks if there are already initialized apps (helps avoid duplicate app initialization errors, e.g. during HMR in dev servers).
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize and export Authentication service
export const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Session persistance set successfully");
  })
  .catch((error) => {
    console.error("Error setting persistance: ", error);
  });

// Initialize and export Firestore database service
export const db = getFirestore(app);

// Export the base App instance
export { app };

