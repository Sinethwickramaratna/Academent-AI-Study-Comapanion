let firebaseAdmin = null;
let firebaseApp = null;

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
};

const getFirebaseProjectId = (serviceAccount) =>
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  serviceAccount?.project_id ||
  serviceAccount?.projectId ||
  null;

export async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    const adminModule = await import("firebase-admin");
    firebaseAdmin = adminModule.default || adminModule;
  } catch (error) {
    const setupError = new Error("firebase-admin is required for backend notifications. Run npm install in the backend folder.");
    setupError.cause = error;
    throw setupError;
  }

  if (!firebaseAdmin.apps.length) {
    const serviceAccount = parseServiceAccount();
    const projectId = getFirebaseProjectId(serviceAccount);
    const credential = serviceAccount
      ? firebaseAdmin.credential.cert(serviceAccount)
      : firebaseAdmin.credential.applicationDefault();

    firebaseApp = firebaseAdmin.initializeApp({
      credential,
      ...(projectId ? { projectId } : {}),
    });
  } else {
    firebaseApp = firebaseAdmin.app();
  }

  return firebaseAdmin;
}

export async function getAdminApp() {
  await getFirebaseAdmin();
  return firebaseApp;
}

export async function getAdminDb() {
  const admin = await getFirebaseAdmin();
  return admin.firestore();
}

export async function getAdminMessaging() {
  const admin = await getFirebaseAdmin();
  return admin.messaging();
}

export async function verifyFirebaseIdToken(idToken) {
  const admin = await getFirebaseAdmin();
  return admin.auth().verifyIdToken(idToken);
}
