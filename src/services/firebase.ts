import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Use the provisioned project config or provided credentials
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyA2uAqFbrMRYaZf3f-H_lWILppHWrD86_g",
  authDomain: firebaseConfigJson.authDomain || "oh-no-tv.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "oh-no-tv",
  storageBucket: firebaseConfigJson.storageBucket || "oh-no-tv.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "630662607752",
  appId: firebaseConfigJson.appId || "1:630662607752:web:d84957e1d5007912fd003d",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with explicit database ID from config if present
const databaseId =
  firebaseConfigJson.firestoreDatabaseId &&
  firebaseConfigJson.firestoreDatabaseId !== '(default)'
    ? firebaseConfigJson.firestoreDatabaseId
    : undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

