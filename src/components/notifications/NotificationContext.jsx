import { createContext, useContext } from 'react';

import { useApp } from '../context/AppContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const appContext = useApp();

  return <NotificationContext.Provider value={appContext}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
