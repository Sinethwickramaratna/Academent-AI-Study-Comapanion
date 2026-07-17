import { getApps, initializeApp } from 'firebase/app'
import type { FirebaseApp, FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
}

const requiredConfigKeys = ['apiKey', 'appId', 'authDomain', 'projectId'] as const

export const firebaseConfigStatus = {
  isConfigured: requiredConfigKeys.every((key) => Boolean(firebaseConfig[key])),
  missingKeys: requiredConfigKeys.filter((key) => !firebaseConfig[key]),
}

export const firebaseAdminServices = {
  authProvider: 'Firebase Authentication',
  database: 'Cloud Firestore',
  storage: 'Cloudinary asset bridge',
  messaging: 'Firebase Cloud Messaging',
}

export const firebaseApp: FirebaseApp | null = firebaseConfigStatus.isConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null

export function getFirebaseEnvironmentLabel(): string {
  return import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Firebase project not configured'
}
