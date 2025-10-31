import React from 'react';

// ✅ DISABLED - All notifications now in NotificationBell only
export default function NotificationManager() {
  return null;
}

export const showNotification = () => {
  console.warn('⚠️ showNotification is deprecated. Check NotificationBell for all notifications.');
  return;
};