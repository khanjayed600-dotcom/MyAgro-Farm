/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const LOCAL_STORAGE_KEY = 'myagro_firebase_custom_config';

/**
 * Retrieve active Firebase configuration from:
 * 1. Vite Environment variables (for Netlify and local .env)
 * 2. Saved user config in localStorage (for instant setup without rebuilding)
 */
export function getFirebaseConfig(): FirebaseConfigOptions | null {
  // Check Vite Env variables first
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
    };
  }

  // Check LocalStorage custom config
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read custom Firebase config from localStorage:', e);
  }

  return null;
}

export function saveCustomFirebaseConfig(config: FirebaseConfigOptions): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  // Reload window to re-initialize app with new credentials
  window.location.reload();
}

export function clearCustomFirebaseConfig(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  window.location.reload();
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

const currentConfig = getFirebaseConfig();

if (currentConfig && currentConfig.apiKey && currentConfig.projectId) {
  try {
    if (!getApps().length) {
      app = initializeApp(currentConfig);
    } else {
      app = getApp();
    }
    
    // Connect to Firestore
    if (currentConfig.firestoreDatabaseId && currentConfig.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, currentConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }

    // Connect to Firebase Auth
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Validate connection asynchronously as required by guidelines
    testFirestoreConnection(db);
  } catch (err) {
    console.error('Failed to initialize Firebase with current config:', err);
  }
}

async function testFirestoreConnection(database: Firestore) {
  try {
    await getDocFromServer(doc(database, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is unreachable.');
    }
  }
}

export function isFirebaseConfigured(): boolean {
  return db !== null && auth !== null;
}

export { app, db, auth, googleProvider };
