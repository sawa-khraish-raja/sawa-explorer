import { getToken, onMessage } from 'firebase/messaging';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { messaging } from '@/config/firebase';
import { saveDeviceToken } from '@/utils/firestore';

import { useAppContext } from '../context/AppContext';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function FCMProvider({ children }) {
  const { user } = useAppContext();
  const fetchedTokenRef = useRef(null);

  useEffect(() => {
    if (!messaging || typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

    let unsubscribeOnMessage = () => {};
    let isMounted = true;

    const registerMessaging = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        const registration =
          existing || (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));

        if (!user) return;

        const permission = Notification.permission;
        if (permission === 'denied') {
          console.warn('Push notifications permission denied by user');
          return;
        }

        let granted = permission === 'granted';
        if (!granted) {
          const result = await Notification.requestPermission();
          granted = result === 'granted';
        }

        if (!granted) {
          console.warn('Notification permission not granted');
          return;
        }

        if (!VAPID_KEY) {
          console.warn('VITE_FIREBASE_VAPID_KEY is not set; skipping push registration');
          return;
        }

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token && fetchedTokenRef.current !== token) {
          await saveDeviceToken(user.id, user.email, token);
          fetchedTokenRef.current = token;
        }

        unsubscribeOnMessage = onMessage(messaging, (payload) => {
          const { title, body, link } = payload?.data || {};
          toast.info(title || payload?.notification?.title || 'SAWA', {
            description: body || payload?.notification?.body,
            duration: 5000,
            action: link
              ? {
                  label: 'Open',
                  onClick: () => window.open(link, '_blank'),
                }
              : undefined,
          });
        });
      } catch (error) {
        if (isMounted) {
          console.error('FCM registration error:', error);
        }
      }
    };

    registerMessaging();

    return () => {
      isMounted = false;
      unsubscribeOnMessage();
    };
  }, [user?.id]);

  return <>{children}</>;
}
