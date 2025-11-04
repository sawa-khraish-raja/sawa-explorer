importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBPhMJk0SbTeBuGB3RVqbhxop_MkBZoqLA',
  authDomain: 'sawa-explorer.firebaseapp.com',
  projectId: 'sawa-explorer',
  storageBucket: 'sawa-explorer.firebasestorage.app',
  messagingSenderId: '643815524231',
  appId: '1:643815524231:web:3d387c3619311c5c7ef522',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, link } = payload?.data || {};

  const notificationTitle = title || 'SAWA Notification';
  const notificationOptions = {
    body: body || payload.notification?.body,
    icon: icon || '/icons/icon-192x192.png',
    data: { link: link || '/' },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.link || '/';
  event.waitUntil(self.clients.openWindow(targetUrl));
});
