import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
  type AuthProvider,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function loadConfig(): FirebaseClientConfig {
  const config: Omit<FirebaseClientConfig, "measurementId"> = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const missing = Object.entries(config)
    .filter(([, value]) => value.trim() === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase client environment variables: ${missing.join(", ")}`,
    );
  }

  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  return measurementId
    ? { ...config, measurementId }
    : config;
}

let firebaseApp: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(loadConfig());
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  auth.languageCode = typeof window !== "undefined" ? navigator.language : "en";
  return auth;
}

export function getFirestoreClient(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export function getGoogleProvider(): AuthProvider {
  return provider;
}

