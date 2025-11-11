
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { serverConfig } from './config';
import type { App } from 'firebase-admin/app';

let app: App;

if (!getApps().length) {
  const { projectId, clientEmail, privateKey } = serverConfig;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase server configuration is incomplete. Please check your environment variables for FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      // Explicitly specify the database URL to connect to the correct instance
      // databaseURL: `https://${projectId}.firebaseio.com`,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error);
    // Re-throw a more informative error to aid in debugging.
    throw new Error(`Firebase admin initialization failed: ${error.message}`);
  }
} else {
  app = getApp();
}

// Connect to the specific 'vehiclecheck-db' Firestore instance.
const adminDb = getFirestore(app, 'vehiclecheck-db');
const adminAuth = getAuth(app);

export { adminDb, adminAuth };
