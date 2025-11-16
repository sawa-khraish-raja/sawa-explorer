import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createContext, useContext, useState, useEffect } from 'react';

import { auth, db } from '@/config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      console.log('Starting signup...');
      setError(null);

      console.log('Creating user in Firebase Auth...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log(' User created in Firebase Auth');

      // Update profile and create Firestore document in parallel
      // Use Promise.allSettled to not block on failures
      const promises = [];

      if (displayName) {
        console.log('Updating profile with display name...');
        const profilePromise = updateProfile(result.user, { displayName })
          .then(() => console.log(' Profile updated'))
          .catch((err) => {
            console.error(' Profile update failed:', err);
            // Don't throw - profile update is non-critical
          });
        promises.push(profilePromise);
      }

      // Create user document in Firestore
      console.log('Creating user document in Firestore...');
      const firestorePromise = setDoc(doc(db, 'users', result.user.uid), {
        full_name: displayName,
        email: email,
        role_type: 'user',
        host_approved: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
        .then(() => console.log(' User document created in Firestore'))
        .catch((err) => {
          console.error(' Firestore document creation failed:', err);
          // Don't throw - we can create it later
        });
      promises.push(firestorePromise);

      // Wait for both operations with a timeout
      await Promise.race([
        Promise.allSettled(promises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Signup operations timed out')), 10000)
        ),
      ]).catch((err) => {
        console.warn(' Some signup operations did not complete:', err.message);
        // Don't throw - user is already created
      });

      console.log('Signup complete!');
      return result;
    } catch (err) {
      console.error(' Signup error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      return signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      return signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      return sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      return updateProfile(auth.currentUser, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
