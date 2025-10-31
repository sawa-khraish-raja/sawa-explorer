import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const currentUser = await base44.auth.me();
        return currentUser;
      } catch (error) {
        console.warn('Failed to fetch user:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const value = useMemo(() => ({
    user,
    userLoading,
    isHost: !!user?.host_approved,
    isAdmin: user?.role_type === 'admin' || user?.role === 'admin',
    isOffice: user?.role_type === 'office',
  }), [user, userLoading]);

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