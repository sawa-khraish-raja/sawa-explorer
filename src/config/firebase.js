import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBPhMJk0SbTeBuGB3RVqbhxop_MkBZoqLA',
  authDomain: 'sawa-explorer.firebaseapp.com',
  projectId: 'sawa-explorer',
  storageBucket: 'sawa-explorer.firebasestorage.app',
  messagingSenderId: '643815524231',
  appId: '1:643815524231:web:3d387c3619311c5c7ef522',
  measurementId: 'G-1NHD938BBY',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

const databaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID || 'test';
export const db = getFirestore(app, databaseId);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Functions
export const functions = getFunctions(app);

export const messaging =
  typeof window !== 'undefined'
    ? getMessaging(app)
    : null;

// Initialize Firebase Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
