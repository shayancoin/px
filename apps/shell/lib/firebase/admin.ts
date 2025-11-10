import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type AdminEnvConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket?: string;
};

function loadAdminConfig(): AdminEnvConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error("Missing Firebase admin environment variables.");
  }

  return {
    projectId,
    clientEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, "\n"),
    storageBucket,
  };
}

let adminApp: App | undefined;

export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  const { projectId, clientEmail, privateKey, storageBucket } = loadAdminConfig();

  adminApp = initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      storageBucket,
    },
    "kitchen-x-admin",
  );

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

