import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPhMJk0SbTeBuGB3RVqbhxop_MkBZoqLA",
  authDomain: "sawa-explorer.firebaseapp.com",
  projectId: "sawa-explorer",
  storageBucket: "sawa-explorer.firebasestorage.app",
  messagingSenderId: "643815524231",
  appId: "1:643815524231:web:3d387c3619311c5c7ef522",
  measurementId: "G-1NHD938BBY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore with the "test" database
// Change to 'production' for production environment
export const db = initializeFirestore(app, {
  databaseId: 'test'
});

// Initialize Firebase Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
