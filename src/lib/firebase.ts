
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { clientConfig } from "./config";

if (!clientConfig.apiKey) {
  throw new Error(
    "Firebase API key is missing. Please make sure to create a .env file with your Firebase project credentials."
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(clientConfig) : getApp();
const auth = getAuth(app);
// Explicitly connect to the 'vehiclecheck-db' database instance.
const db = getFirestore(app, 'vehiclecheck-db');

export { app, auth, db };
