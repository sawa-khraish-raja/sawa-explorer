import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase config from Firebase Console
// Go to: https://console.firebase.google.com/project/sawa-explorer/settings/general
// Scroll to "Your apps" and copy the config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "sawa-explorer.firebaseapp.com",
  projectId: "sawa-explorer",
  storageBucket: "sawa-explorer.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
