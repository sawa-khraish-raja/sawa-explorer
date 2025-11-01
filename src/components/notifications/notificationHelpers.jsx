import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 *  FIXED: Create notification with proper title and message
 */
export async function createNotification({
  recipient_email,
  recipient_type = 'traveler',
  type,
  title,
  message,
  link,
  related_booking_id,
  related_offer_id,
  related_conversation_id,
}) {
  try {
    console.log('🔔 Creating notification:', {
      recipient_email,
      type,
      title,
      message,
    });

    //  Validate required fields
    if (!recipient_email) {
      console.error(' Cannot create notification: missing recipient_email');
      return null;
    }

    if (!title || !message) {
      console.error(' Cannot create notification: missing title or message');
      return null;
    }

    //  Create notification using service role (bypass RLS)
    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email,
      recipient_type,
      type,
      title,
      message,
      link: link || null,
      related_booking_id: related_booking_id || null,
      related_offer_id: related_offer_id || null,
      related_conversation_id: related_conversation_id || null,
      read: false,
    });

    console.log(' Notification created:', notification.id);
    return notification;
  } catch (error) {
    console.error(' Error creating notification:', error);
    return null;
  }
}

/**
 *  FIXED: Notification templates with proper titles and messages
 */
export const NOTIFICATION_TEMPLATES = {
  BOOKING_CREATED: (bookingId, city) => ({
    title: ' Booking Request Submitted',
    message: `Your booking request for ${city} has been submitted. Hosts will start sending offers soon!`,
    link: `/MyOffers?booking=${bookingId}`,
    type: 'booking_request',
  }),

  OFFER_RECEIVED: (bookingId, hostName, city) => ({
    title: '🎉 New Offer Received',
    message: `${hostName} sent you an offer for your trip to ${city}. Check it out!`,
    link: `/MyOffers?booking=${bookingId}`,
    type: 'offer_received',
  }),

  OFFER_ACCEPTED: (bookingId, travelerName) => ({
    title: '✨ Offer Accepted',
    message: `${travelerName} accepted your offer! The booking is now confirmed.`,
    link: `/HostDashboard?booking=${bookingId}`,
    type: 'offer_accepted',
  }),

  BOOKING_CONFIRMED: (bookingId, city) => ({
    title: '🎊 Booking Confirmed',
    message: `Your booking for ${city} has been confirmed! Get ready for your amazing trip.`,
    link: `/MyOffers?booking=${bookingId}`,
    type: 'booking_confirmed',
  }),

  BOOKING_CANCELLED: (bookingId, city) => ({
    title: ' Booking Cancelled',
    message: `Your booking for ${city} has been cancelled.`,
    link: `/MyOffers?booking=${bookingId}`,
    type: 'booking_cancelled',
  }),

  MESSAGE_RECEIVED: (conversationId, senderName) => ({
    title: '💬 New Message',
    message: `You have a new message from ${senderName}`,
    link: `/Messages?conversation_id=${conversationId}`,
    type: 'message_received',
  }),

  HOST_ASSIGNED: (hostEmail, officeName) => ({
    title: '🏢 Assigned to Office',
    message: `You have been assigned to ${officeName}. Welcome to the team!`,
    link: '/HostDashboard',
    type: 'host_assigned_to_office',
  }),

  ADVENTURE_BOOKING: (adventureTitle, travelerName) => ({
    title: '🎉 New Adventure Booking',
    message: `${travelerName} booked your adventure: ${adventureTitle}`,
    link: '/HostAdventures',
    type: 'booking_request',
  }),
};

/**
 *  Send notification using template
 */
export async function sendNotificationFromTemplate(
  templateName,
  recipient_email,
  recipient_type,
  templateData
) {
  const template = NOTIFICATION_TEMPLATES[templateName];

  if (!template) {
    console.error(` Unknown template: ${templateName}`);
    return null;
  }

  const notification = template(...(Array.isArray(templateData) ? templateData : [templateData]));

  return createNotification({
    recipient_email,
    recipient_type,
    ...notification,
  });
}

export const NotificationHelpers = {
  async onOfferAccepted(offer, booking) {
    if (!offer?.host_email || !booking) return;

    const travelerName = booking.traveler_name || booking.traveler_email || 'Traveler';
    await createNotification({
      recipient_email: offer.host_email,
      recipient_type: 'host',
      type: 'offer_accepted',
      title: '✨ Offer Accepted',
      message: `${travelerName} accepted your offer for booking ${booking.id}.`,
      link: `/HostDashboard?booking=${booking.id}`,
      related_booking_id: booking.id,
      related_offer_id: offer.id,
    });
  },
  async onBookingConfirmed(booking) {
    if (!booking) return;

    if (booking.traveler_email) {
      await createNotification({
        recipient_email: booking.traveler_email,
        recipient_type: 'traveler',
        type: 'booking_confirmed',
        title: '🎊 Booking Confirmed',
        message: `Your booking in ${booking.city || 'your destination'} is confirmed!`,
        link: `/MyOffers?booking=${booking.id}`,
        related_booking_id: booking.id,
      });
    }

    if (booking.host_email) {
      await createNotification({
        recipient_email: booking.host_email,
        recipient_type: 'host',
        type: 'booking_confirmed',
        title: '🎉 Booking Confirmed',
        message: `A traveler confirmed booking ${booking.id}.`,
        link: `/HostDashboard?booking=${booking.id}`,
        related_booking_id: booking.id,
      });
    }
  },
  async onReelLiked(reelId, hostEmail) {
    if (!hostEmail) return;
    await createNotification({
      recipient_email: hostEmail,
      recipient_type: 'host',
      type: 'reel_liked',
      title: '❤️ Someone liked your reel',
      message: 'Your travel reel just received a new like.',
      link: '/HostDashboard?tab=reels',
      related_conversation_id: reelId,
    });
  },
};

export function notifyNewMessage(senderName, previewText) {
  toast.info(`New message from ${senderName}`, {
    description: previewText,
    duration: 4000,
  });
}
