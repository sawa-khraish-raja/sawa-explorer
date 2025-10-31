import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    let credential;

    // Option 1: Using service account key file (easiest for development)
    try {
      const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
      console.log('✓ Using serviceAccountKey.json file');
    } catch (fileError) {
      // File not found, try other methods

      // Option 2: Using environment variable with full JSON
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
        console.log('✓ Using FIREBASE_SERVICE_ACCOUNT environment variable');
      }
      // Option 3: Using individual environment variables
      else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        });
        console.log('✓ Using individual Firebase environment variables');
      }
      // Option 4: Using default credentials (for Google Cloud environments)
      else {
        credential = admin.credential.applicationDefault();
        console.log('✓ Using application default credentials');
      }
    }

    // Get database ID from environment or use default
    const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';

    admin.initializeApp({
      credential: credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    // If using a non-default database, log it
    if (databaseId && databaseId !== '(default)') {
      console.log(`✓ Configured to use Firestore database: ${databaseId}`);
    }

    console.log('✓ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('✗ Error initializing Firebase Admin:', error.message);
    console.log('\nPlease set up Firebase credentials using one of these methods:');
    console.log('1. Create server/config/serviceAccountKey.json file');
    console.log('2. Set FIREBASE_SERVICE_ACCOUNT environment variable');
    console.log('3. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL');
  }
};

// Firestore instance cache
let firestoreInstance = null;

// Get Firestore database instance
// Returns the Firestore database instance based on FIRESTORE_DATABASE_ID env variable
const getFirestore = () => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const databaseId = process.env.FIRESTORE_DATABASE_ID;

  // For non-default database, we need to pass the database ID
  // Using the projectId/databaseId path format
  if (databaseId && databaseId !== '(default)') {
    // Initialize with specific database
    firestoreInstance = admin.firestore();
    firestoreInstance.settings({
      databaseId: databaseId,
      ignoreUndefinedProperties: true
    });
    console.log(`✓ Connected to Firestore database: ${databaseId}`);
  } else {
    // Use default database
    firestoreInstance = admin.firestore();
    console.log('✓ Connected to Firestore default database');
  }

  return firestoreInstance;
};

// Get Realtime Database instance
const getDatabase = () => {
  return admin.database();
};

// Get Auth instance
const getAuth = () => {
  return admin.auth();
};

export { initializeFirebase, getFirestore, getDatabase, getAuth, admin };
