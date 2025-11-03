import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { currentUser: firebaseUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Fetch user profile from Firestore when Firebase user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!firebaseUser) {
        console.log('🔴 No Firebase user found');
        setUser(null);
        setUserLoading(false);
        return;
      }

      // Fetch user data from Firestore before setting loading to false
      // This ensures role_type and permissions are loaded before routing decisions
      try {
        setUserLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || userDoc.data().full_name,
            profile_photo: firebaseUser.photoURL || userDoc.data().profile_photo,
            ...userDoc.data(),
          };

          setUser(userData);
        } else {
          console.log('⚠️ No Firestore document found - using basic data');
          // Set basic user data if no Firestore doc exists
          const basicUserData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || '',
            profile_photo: firebaseUser.photoURL || '',
            role_type: 'user',
            host_approved: false,
          };
          setUser(basicUserData);
        }
      } catch (error) {
        console.error('❌ Failed to fetch user profile:', error);
        // Set basic user data on error
        const basicUserData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || '',
          profile_photo: firebaseUser.photoURL || '',
          role_type: 'user',
          host_approved: false,
        };
        setUser(basicUserData);
      } finally {
        // Only set loading to false after Firestore fetch completes
        setUserLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [firebaseUser, authLoading]);

  const value = useMemo(
    () => ({
      user,
      userLoading: authLoading || userLoading,
      isHost: !!user?.host_approved,
      isAdmin: user?.role_type === 'admin' || user?.role === 'admin',
      isOffice: user?.role_type === 'office',
    }),
    [user, userLoading, authLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
