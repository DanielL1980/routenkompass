import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Firebase-Initialisierung - Werte kommen aus .env (siehe .env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Datenbank-ID "routenkompass" statt "(default)", da sie in der Firebase Console
// als benannte Firestore-Datenbank angelegt wurde (Multi-Database-Feature)
export const db = getFirestore(app, 'routenkompass');
// Region muss mit der Region der deployten Cloud Functions uebereinstimmen (europe-west3)
export const functions = getFunctions(app, 'europe-west3');
