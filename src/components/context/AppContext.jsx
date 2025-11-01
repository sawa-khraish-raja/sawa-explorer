import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

      console.log('🟢 Firebase user found:', firebaseUser.email);

      // Immediately set basic user data from Firebase Auth (fast!)
      const basicUserData = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        full_name: firebaseUser.displayName || '',
        profile_photo: firebaseUser.photoURL || '',
        role_type: 'user',
        host_approved: false
      };

      // Set user immediately with basic data
      setUser(basicUserData);
      setUserLoading(false);

      // Then fetch additional data from Firestore in background
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          console.log('✅ User document found in Firestore - updating');
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || userDoc.data().full_name,
            profile_photo: firebaseUser.photoURL || userDoc.data().profile_photo,
            ...userDoc.data()
          };
          console.log('👤 Updated user data:', userData);
          setUser(userData); // Update with Firestore data
        } else {
          console.log('⚠️ No Firestore document found');
        }
      } catch (error) {
        console.error('❌ Failed to fetch user profile:', error);
        // Keep the basic user data we already set
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [firebaseUser, authLoading]);

  const value = useMemo(() => ({
    user,
    userLoading: authLoading || userLoading,
    isHost: !!user?.host_approved,
    isAdmin: user?.role_type === 'admin' || user?.role === 'admin',
    isOffice: user?.role_type === 'office',
  }), [user, userLoading, authLoading]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};