import { createClient } from '@base44/sdk';
import { firebaseAuthAdapter } from '@/services/firebaseAuthAdapter';
import { bookingEntity } from '@/services/firebaseEntities/bookingEntity';
import { notificationEntity } from '@/services/firebaseEntities/notificationEntity';
import { notificationPreferencesEntity } from '@/services/firebaseEntities/notificationPreferencesEntity';

// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: '68e8bf2aebfc9660599d11a9',
  requiresAuth: false, // Temporarily disabled for local testing - set to true for production
});

base44.auth = firebaseAuthAdapter;

base44.entities = {
  ...(base44.entities || {}),
  Booking: bookingEntity,
  Notification: notificationEntity,
  NotificationPreferences: notificationPreferencesEntity,
};

base44.asServiceRole = {
  ...(base44.asServiceRole || {}),
  auth: firebaseAuthAdapter,
  entities: {
    ...(base44.asServiceRole?.entities || {}),
    Booking: bookingEntity,
    Notification: notificationEntity,
    NotificationPreferences: notificationPreferencesEntity,
  },
};
