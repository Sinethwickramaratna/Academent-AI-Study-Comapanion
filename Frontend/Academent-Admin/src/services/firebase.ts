export const firebaseAdminServices = {
  authProvider: 'Firebase Authentication',
  database: 'Cloud Firestore',
  storage: 'Cloudinary asset bridge',
  messaging: 'Firebase Cloud Messaging',
}

export function getFirebaseEnvironmentLabel(): string {
  return import.meta.env.VITE_FIREBASE_PROJECT_ID || 'academent-production'
}
