import { base44 } from '@/api/base44Client';

/**
 * Creates or retrieves an existing conversation between host and traveler
 * @param {Object} params
 * @param {string} params.travelerEmail - Traveler's email
 * @param {string} params.hostEmail - Host's email
 * @param {string} params.bookingId - Booking ID
 * @returns {Promise<Object>} Conversation object
 */
export async function createOrGetConversation({ travelerEmail, hostEmail, bookingId }) {
  try {
    console.log('[conversationHelper] Looking for conversation:', {
      bookingId,
      hostEmail,
      travelerEmail,
    });

    // 1) Try to find existing conversation by bookingId
    const existingConversations = await base44.entities.Conversation.filter({
      booking_id: bookingId,
    });

    if (existingConversations && existingConversations.length > 0) {
      // Check if this host is already in the conversation
      const existingConv = existingConversations.find(
        (conv) => Array.isArray(conv.host_emails) && conv.host_emails.includes(hostEmail)
      );

      if (existingConv) {
        console.log('[conversationHelper] Found existing conversation:', existingConv.id);
        return existingConv;
      }
    }

    // 2) Create a new conversation
    console.log('[conversationHelper] Creating new conversation');
    const newConversation = await base44.entities.Conversation.create({
      booking_id: bookingId,
      traveler_email: travelerEmail,
      host_emails: [hostEmail],
      last_message_preview: 'Offer accepted - Chat opened',
      last_message_timestamp: new Date().toISOString(),
      unread_by_traveler: false,
      unread_by_hosts: [],
    });

    console.log('[conversationHelper] Created conversation:', newConversation.id);

    // 3) Send a system welcome message (optional, friendly)
    await base44.entities.Message.create({
      conversation_id: newConversation.id,
      sender_email: 'system@sawa.app',
      original_text: 'Chat opened after offer acceptance. You can now communicate directly!',
      translated_text: 'تم فتح المحادثة بعد قبول العرض. يمكنكم الآن التواصل مباشرة!',
      target_lang: 'ar',
      read_by: [],
    });

    return newConversation;
  } catch (error) {
    console.error('[conversationHelper] Error:', error);
    throw error;
  }
}

/**
 * Notify both parties that chat is ready
 * @param {Object} conversation
 * @param {string} hostEmail
 * @param {string} travelerEmail
 */
export async function notifyParticipantsAboutChat(conversation, hostEmail, travelerEmail) {
  try {
    // Notify traveler
    await base44.entities.Notification.create({
      recipient_email: travelerEmail,
      recipient_type: 'traveler',
      type: 'message_received',
      title: 'Your offer was accepted!',
      message: 'The host has accepted your offer. Start chatting now!',
      link: `/Messages?conversation_id=${conversation.id}`,
      related_conversation_id: conversation.id,
      related_booking_id: conversation.booking_id,
    });

    // Notify host
    await base44.entities.Notification.create({
      recipient_email: hostEmail,
      recipient_type: 'host',
      type: 'message_received',
      title: 'Chat opened with traveler',
      message: 'You can now chat with the traveler about their trip.',
      link: `/HostDashboard?conversation_id=${conversation.id}`,
      related_conversation_id: conversation.id,
      related_booking_id: conversation.booking_id,
    });

    console.log('[conversationHelper] Notifications sent to both parties');
  } catch (error) {
    console.error('[conversationHelper] Failed to send notifications:', error);
  }
}
