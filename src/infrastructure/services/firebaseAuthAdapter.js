import { onAuthStateChanged, signOut, updateProfile, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';

const AUTH_EVENT = 'sawa:auth:open';
const RETURN_URL_KEY = 'sawa:return_to';

function waitForAuthUser() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

async function fetchUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
  } catch (error) {
    console.error('Failed to fetch Firestore user profile:', error);
  }
  return {};
}

async function mergeAuthData(firebaseUser) {
  if (!firebaseUser) {
    return null;
  }

  const [profile, tokenResult] = await Promise.all([
    fetchUserProfile(firebaseUser.uid),
    getIdTokenResult(firebaseUser).catch(() => null),
  ]);

  const claims = tokenResult?.claims ?? {};

  const roleFromClaims = claims.role_type || claims.role || profile.role_type || profile.role;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    full_name: profile.full_name || firebaseUser.displayName || firebaseUser.email || '',
    display_name: profile.display_name || firebaseUser.displayName || '',
    profile_photo: profile.profile_photo || firebaseUser.photoURL || '',
    role_type: roleFromClaims || 'user',
    role: roleFromClaims || 'user',
    host_approved: profile.host_approved ?? false,
    ...profile,
  };
}

async function updateFirestoreProfile(uid, updates) {
  if (!uid) {
    throw new Error('Cannot update profile without a user id');
  }

  const data = {
    ...updates,
    updated_at: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export const firebaseAuthAdapter = {
  async me() {
    const firebaseUser = await waitForAuthUser().catch((error) => {
      console.error('Error waiting for auth state:', error);
      return null;
    });

    if (!firebaseUser) {
      return null;
    }

    return mergeAuthData(firebaseUser);
  },

  async logout() {
    await signOut(auth);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(RETURN_URL_KEY);
      } catch (error) {
        console.warn('Unable to remove auth return url on logout:', error);
      }
    }
    return true;
  },

  async redirectToLogin(returnTo) {
    if (typeof window !== 'undefined') {
      if (returnTo) {
        try {
          window.sessionStorage.setItem(RETURN_URL_KEY, returnTo);
        } catch (error) {
          console.warn('Unable to persist auth return url:', error);
        }
      }

      window.dispatchEvent(
        new CustomEvent(AUTH_EVENT, {
          detail: { tab: 'login' },
        })
      );
    }
  },

  async updateMe(updates = {}) {
    const firebaseUser = await waitForAuthUser();

    if (!firebaseUser) {
      throw new Error('Not authenticated');
    }

    const profileUpdates = {};

    if (updates.full_name && updates.full_name !== firebaseUser.displayName) {
      profileUpdates.displayName = updates.full_name;
    }

    if (updates.profile_photo && updates.profile_photo !== firebaseUser.photoURL) {
      profileUpdates.photoURL = updates.profile_photo;
    }

    if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(firebaseUser, profileUpdates).catch((error) => {
        console.warn('Failed to update Firebase Auth profile:', error);
      });
    }

    const firestoreUpdates = {
      ...updates,
      full_name:
        updates.full_name || firebaseUser.displayName || updates.display_name || firebaseUser.email,
      profile_photo:
        updates.profile_photo || profileUpdates.photoURL || firebaseUser.photoURL || '',
    };

    await updateFirestoreProfile(firebaseUser.uid, firestoreUpdates);

    return mergeAuthData(auth.currentUser);
  },

  getReturnUrl() {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.sessionStorage.getItem(RETURN_URL_KEY);
    } catch {
      return null;
    }
  },

  clearReturnUrl() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.removeItem(RETURN_URL_KEY);
    } catch (error) {
      console.warn('Unable to clear auth return url:', error);
    }
  },
};

export const AUTH_MODAL_EVENT = AUTH_EVENT;
