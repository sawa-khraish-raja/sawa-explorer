import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { notificationEntity } from '@/services/firebaseEntities/notificationEntity';

/**
 * Firestore Helper Functions
 * Easy-to-use utilities for database operations
 */

// ========== CREATE OPERATIONS ==========

/**
 * Add a new document with auto-generated ID
 * @param {string} collectionName - The collection name (e.g., 'cities', 'bookings')
 * @param {object} data - The data to add
 * @returns {Promise<string>} - The new document ID
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log(` Document created in ${collectionName} with ID:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(` Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Create or update a document with a specific ID
 * @param {string} collectionName - The collection name
 * @param {string} docId - The document ID
 * @param {object} data - The data to set
 */
export const setDocument = async (collectionName, docId, data) => {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log(` Document set in ${collectionName}/${docId}`);
  } catch (error) {
    console.error(` Error setting document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

// ========== READ OPERATIONS ==========

/**
 * Get a single document by ID
 * @param {string} collectionName - The collection name
 * @param {string} docId - The document ID
 * @returns {Promise<object|null>} - The document data or null if not found
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`Document ${collectionName}/${docId} not found`);
      return null;
    }
  } catch (error) {
    console.error(` Error getting document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - The collection name
 * @returns {Promise<Array>} - Array of documents
 */
export const getAllDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    console.log(` Found ${documents.length} documents in ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(` Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Query documents with filters
 * @param {string} collectionName - The collection name
 * @param {Array} filters - Array of filter conditions [field, operator, value]
 * @param {object} options - Query options { orderBy, limit }
 * @returns {Promise<Array>} - Array of matching documents
 */
export const queryDocuments = async (collectionName, filters = [], options = {}) => {
  try {
    let q = collection(db, collectionName);

    // Apply filters
    const constraints = [];
    filters.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });

    // Apply ordering
    if (options.orderBy) {
      constraints.push(orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
    }

    // Apply limit
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    q = query(q, ...constraints);

    const querySnapshot = await getDocs(q);
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    console.log(` Query found ${documents.length} documents in ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(` Error querying ${collectionName}:`, error);
    throw error;
  }
};

// ========== UPDATE OPERATIONS ==========

/**
 * Update a document
 * @param {string} collectionName - The collection name
 * @param {string} docId - The document ID
 * @param {object} data - The data to update
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error(` Error updating document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

// ========== DELETE OPERATIONS ==========

/**
 * Delete a document
 * @param {string} collectionName - The collection name
 * @param {string} docId - The document ID
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    console.log(` Document deleted: ${collectionName}/${docId}`);
  } catch (error) {
    console.error(` Error deleting document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

// ========== EXAMPLE USAGE ==========

/**
 * Example: Create a city
 */
export const createCity = async (cityData) => {
  return await addDocument('cities', {
    name: cityData.name,
    country: cityData.country,
    description: cityData.description,
    image_url: cityData.image_url,
    is_active: true,
  });
};

/**
 * Example: Create a booking
 */
export const createBooking = async (bookingData) => {
  return await addDocument('bookings', {
    user_id: bookingData.user_id,
    city_id: bookingData.city_id,
    check_in: bookingData.check_in,
    check_out: bookingData.check_out,
    guests: bookingData.guests,
    status: 'pending',
    total_price: bookingData.total_price,
  });
};

/**
 * Example: Get user's bookings
 */
export const getUserBookings = async (userId) => {
  return await queryDocuments('bookings', [['user_id', '==', userId]], {
    orderBy: { field: 'created_at', direction: 'desc' },
  });
};

// ========== BOOKING HELPERS ==========

/**
 * Get host's bookings
 */
export const getHostBookings = async (hostId, status = null) => {
  const filters = [['host_id', '==', hostId]];
  if (status) {
    filters.push(['status', '==', status]);
  }
  return await queryDocuments('bookings', filters, {
    orderBy: { field: 'booking_date', direction: 'asc' },
  });
};

/**
 * Get adventure bookings
 */
export const getAdventureBookings = async (adventureId) => {
  return await queryDocuments('bookings', [['adventure_id', '==', adventureId]], {
    orderBy: { field: 'booking_date', direction: 'asc' },
  });
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (bookingId, status, updates = {}) => {
  return await updateDocument('bookings', bookingId, {
    status,
    ...updates,
  });
};

// ========== REVIEW HELPERS ==========

/**
 * Get adventure reviews
 */
export const getAdventureReviews = async (adventureId, limitCount = null) => {
  return await queryDocuments('reviews', [['adventure_id', '==', adventureId]], {
    orderBy: { field: 'created_at', direction: 'desc' },
    limit: limitCount,
  });
};

/**
 * Get user reviews (written by user)
 */
export const getUserReviews = async (userId) => {
  return await queryDocuments('reviews', [['reviewer_id', '==', userId]], {
    orderBy: { field: 'created_at', direction: 'desc' },
  });
};

/**
 * Get host reviews (reviews for host's adventures)
 */
export const getHostReviews = async (hostId) => {
  return await queryDocuments('reviews', [['host_id', '==', hostId]], {
    orderBy: { field: 'created_at', direction: 'desc' },
  });
};

/**
 * Create review
 */
export const createReview = async (reviewData) => {
  return await addDocument('reviews', {
    adventure_id: reviewData.adventure_id,
    adventure_title: reviewData.adventure_title,
    reviewer_id: reviewData.reviewer_id,
    reviewer_name: reviewData.reviewer_name,
    reviewer_photo: reviewData.reviewer_photo || '',
    host_id: reviewData.host_id,
    booking_id: reviewData.booking_id,
    rating: reviewData.rating,
    comment: reviewData.comment,
    ratings: reviewData.ratings || {},
    photos: reviewData.photos || [],
    helpful_count: 0,
    is_verified: true,
    is_flagged: false,
  });
};

// ========== CHAT HELPERS ==========

/**
 * Get user chats
 */
export const getUserChats = async (userId) => {
  return await queryDocuments('chats', [['participants', 'array-contains', userId]], {
    orderBy: { field: 'last_message_at', direction: 'desc' },
  });
};

/**
 * Get or create chat between two users
 */
export const getOrCreateChat = async (user1Id, user2Id, user1Data, user2Data) => {
  // Try to find existing chat
  const existingChats = await queryDocuments('chats', [
    ['participants', 'array-contains', user1Id],
  ]);

  const chat = existingChats.find((c) => c.participants.includes(user2Id));

  if (chat) {
    return chat;
  }

  // Create new chat
  const chatData = {
    participants: [user1Id, user2Id],
    participant_names: {
      [user1Id]: user1Data.name,
      [user2Id]: user2Data.name,
    },
    participant_photos: {
      [user1Id]: user1Data.photo || '',
      [user2Id]: user2Data.photo || '',
    },
    last_message: '',
    last_message_sender: '',
    last_message_at: serverTimestamp(),
    unread_count: {
      [user1Id]: 0,
      [user2Id]: 0,
    },
    is_active: true,
  };

  const chatId = await addDocument('chats', chatData);
  return { id: chatId, ...chatData };
};

/**
 * Send message in chat
 */
export const sendMessage = async (chatId, messageData) => {
  // Add message to subcollection
  const messageId = await addDocument(`chats/${chatId}/messages`, {
    sender_id: messageData.sender_id,
    sender_name: messageData.sender_name,
    sender_photo: messageData.sender_photo || '',
    text: messageData.text,
    type: messageData.type || 'text',
    image_url: messageData.image_url || '',
    booking_id: messageData.booking_id || '',
    read: false,
  });

  // Update chat last message
  await updateDocument('chats', chatId, {
    last_message: messageData.text,
    last_message_sender: messageData.sender_id,
    last_message_at: serverTimestamp(),
  });

  return messageId;
};

// ========== NOTIFICATION HELPERS ==========

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, unreadOnly = false, userEmail = null) => {
  const criteria = {};
  if (userId) {
    criteria.user_id = userId;
  }
  if (unreadOnly) {
    criteria.read = false;
  }

  let results = [];

  if (criteria.user_id) {
    results = await notificationEntity.filter(criteria);
  }

  if ((!results.length || !criteria.user_id) && userEmail) {
    const emailCriteria = { recipient_email: userEmail };
    if (unreadOnly) {
      emailCriteria.read = false;
    }
    const emailResults = await notificationEntity.filter(emailCriteria);
    console.log('🔔 Found by email:', emailResults.length);

    const existingIds = new Set(results.map((item) => item.id));
    emailResults.forEach((item) => {
      if (!existingIds.has(item.id)) {
        results.push(item);
      }
    });
  }

  return results.sort((a, b) => {
    const getTime = (entry) => {
      const timestamps = [entry.created_date, entry.created_at, entry.updated_at].filter(Boolean);
      if (timestamps.length === 0) {
        return 0;
      }
      const value = timestamps[0];
      if (value?.seconds) {
        return value.toMillis ? value.toMillis() : value.seconds * 1000;
      }
      return new Date(value).getTime();
    };

    return getTime(b) - getTime(a);
  });
};

/**
 * Create notification
 */
export const createNotification = async (notificationData) => {
  return await notificationEntity.create(notificationData);
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  return await notificationEntity.update(notificationId, {
    read: true,
    read_at: serverTimestamp(),
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId, userEmail = null) => {
  const notifications = await getUserNotifications(userId, true, userEmail);
  const updates = notifications.map((n) =>
    notificationEntity.update(n.id, {
      read: true,
      read_at: serverTimestamp(),
    })
  );
  return await Promise.all(updates);
};

/**
 * Save or update a device token used for push notifications
 */
export const saveDeviceToken = async (userId, userEmail, token, platform = 'web') => {
  if (!token) return null;

  try {
    const tokenRef = doc(db, 'device_tokens', token);
    await setDoc(
      tokenRef,
      {
        user_id: userId || null,
        user_email: userEmail || null,
        token,
        platform,
        language: typeof navigator !== 'undefined' ? navigator.language : 'en',
        updated_at: serverTimestamp(),
        created_at: serverTimestamp(),
      },
      { merge: true }
    );
    return token;
  } catch (error) {
    console.error('Error saving device token:', error);
    return null;
  }
};

// ========== FAVORITES HELPERS ==========

/**
 * Get user favorites
 */
export const getUserFavorites = async (userId) => {
  return await queryDocuments('favorites', [['user_id', '==', userId]], {
    orderBy: { field: 'created_at', direction: 'desc' },
  });
};

/**
 * Add to favorites
 */
export const addToFavorites = async (userId, adventureData) => {
  return await addDocument('favorites', {
    user_id: userId,
    adventure_id: adventureData.id,
    adventure_title: adventureData.title,
    adventure_image: adventureData.image_url || adventureData.images?.[0] || '',
  });
};

/**
 * Remove from favorites
 */
export const removeFromFavorites = async (userId, adventureId) => {
  const favorites = await queryDocuments('favorites', [
    ['user_id', '==', userId],
    ['adventure_id', '==', adventureId],
  ]);

  if (favorites.length > 0) {
    return await deleteDocument('favorites', favorites[0].id);
  }
};

/**
 * Check if adventure is favorited
 */
export const isAdventureFavorited = async (userId, adventureId) => {
  const favorites = await queryDocuments('favorites', [
    ['user_id', '==', userId],
    ['adventure_id', '==', adventureId],
  ]);
  return favorites.length > 0;
};

// ========== ADVENTURE HELPERS ==========

/**
 * Get adventures by city
 */
export const getAdventuresByCity = async (cityId) => {
  return await queryDocuments(
    'adventures',
    [
      ['city_id', '==', cityId],
      ['is_active', '==', true],
    ],
    { orderBy: { field: 'rating', direction: 'desc' } }
  );
};

/**
 * Get host adventures
 */
export const getHostAdventures = async (hostId) => {
  return await queryDocuments('adventures', [['host_id', '==', hostId]], {
    orderBy: { field: 'created_at', direction: 'desc' },
  });
};

/**
 * Search adventures
 */
export const searchAdventures = async (searchParams) => {
  const filters = [['is_active', '==', true]];

  if (searchParams.city_id) {
    filters.push(['city_id', '==', searchParams.city_id]);
  }

  if (searchParams.category) {
    filters.push(['category', '==', searchParams.category]);
  }

  return await queryDocuments('adventures', filters, {
    orderBy: { field: searchParams.sortBy || 'rating', direction: 'desc' },
    limit: searchParams.limit || 20,
  });
};

// ========== BOOKING-BASED CONVERSATION HELPERS ==========

/**
 * Get or create a conversation for a booking
 * @param {object} bookingData - Booking data { id, traveler_email, host_email, city_name }
 * @returns {Promise<object>} - Conversation object with id
 */
export const getOrCreateConversation = async (bookingData) => {
  try {
    console.log('💬 getOrCreateConversation:', bookingData);

    // Try to find existing conversation for this booking
    try {
      const existing = await queryDocuments('conversations', [
        ['booking_id', '==', bookingData.id],
      ]);

      if (existing.length > 0) {
        console.log('💬 Found existing conversation:', existing[0].id);
        return existing[0];
      }
    } catch (queryError) {
      console.warn(
        '⚠️ Could not query existing conversations (will create new):',
        queryError.message
      );
      // If query fails due to permissions, proceed to create new conversation
    }

    // Create new conversation
    const conversationData = {
      booking_id: bookingData.id,
      traveler_email: bookingData.traveler_email,
      host_emails: [bookingData.host_email],
      city_name: bookingData.city_name || '',
      conversation_status: 'open',
      last_message_text: '',
      last_message_sender: '',
      last_message_timestamp: new Date().toISOString(),
      unread_by_traveler: false,
      unread_by_hosts: [],
    };

    console.log('💬 Creating conversation with data:', {
      booking_id: conversationData.booking_id,
      traveler_email: conversationData.traveler_email,
      host_emails: conversationData.host_emails,
    });

    const conversationId = await addDocument('conversations', conversationData);
    console.log('💬 Created new conversation:', conversationId);

    // Verify we can read it back before returning
    try {
      const verifyDoc = await getDocument('conversations', conversationId);
      console.log('✅ Verified conversation is readable:', verifyDoc.id);
      return verifyDoc;
    } catch (verifyError) {
      console.warn(
        '⚠️ Could not verify conversation read, returning created data:',
        verifyError.message
      );
      return { id: conversationId, ...conversationData };
    }
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    throw error;
  }
};

/**
 * Subscribe to user's conversations (real-time)
 * @param {string} userEmail - User's email
 * @param {boolean} isHost - Whether user is a host
 * @param {function} callback - Callback function to receive updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToConversations = (userEmail, isHost, callback) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    let q;

    if (isHost) {
      // Host sees conversations where they are in host_emails array
      q = query(
        conversationsRef,
        where('host_emails', 'array-contains', userEmail),
        orderBy('last_message_timestamp', 'desc')
      );
    } else {
      // Traveler sees conversations where they are the traveler
      q = query(
        conversationsRef,
        where('traveler_email', '==', userEmail),
        orderBy('last_message_timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversations = [];
        snapshot.forEach((doc) => {
          conversations.push({ id: doc.id, ...doc.data() });
        });
        callback(conversations);
      },
      (error) => {
        console.error('❌ Error in conversations subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to conversations:', error);
    return () => {};
  }
};

/**
 * Subscribe to messages in a conversation (real-time)
 * @param {string} conversationId - Conversation ID
 * @param {function} callback - Callback function to receive updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToMessages = (conversationId, callback) => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversation_id', '==', conversationId),
      orderBy('created_date', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() });
        });
        callback(messages);
      },
      (error) => {
        console.error('❌ Error in messages subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to messages:', error);
    return () => {};
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {object} messageData - Message data { sender_email, original_text, source_lang }
 * @returns {Promise<string>} - Message ID
 */
export const sendMessageToConversation = async (conversationId, messageData) => {
  try {
    console.log('💬 Sending message to conversation:', conversationId);

    // Get conversation to determine sender role
    const conversation = await getDocument('conversations', conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create message
    const message = {
      conversation_id: conversationId,
      sender_email: messageData.sender_email,
      original_text: messageData.original_text,
      source_lang: messageData.source_lang || 'en',
      attachments: messageData.attachments || [],
      read_by: [messageData.sender_email],
      delivered_to: [],
      created_date: new Date().toISOString(),
    };

    const messageId = await addDocument('messages', message);
    console.log('💬 Message created:', messageId);

    // Determine if sender is host or traveler
    const isHost = conversation.host_emails?.includes(messageData.sender_email);
    const isTraveler = conversation.traveler_email === messageData.sender_email;

    // Prepare unread flags
    const unreadUpdates = {};
    if (isHost) {
      // Host sent message → mark as unread for traveler
      unreadUpdates.unread_by_traveler = true;
    } else if (isTraveler) {
      // Traveler sent message → mark as unread for all hosts
      unreadUpdates.unread_by_hosts = conversation.host_emails || [];
    }

    // Update conversation's last message and unread status
    await updateDocument('conversations', conversationId, {
      last_message_text: messageData.original_text.substring(0, 100),
      last_message_sender: messageData.sender_email,
      last_message_timestamp: new Date().toISOString(),
      ...unreadUpdates,
    });

    return messageId;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 * @param {Array} messageIds - Array of message IDs to mark as read
 * @param {string} userEmail - User's email
 * @param {string} conversationId - Conversation ID (optional, for updating unread flags)
 * @returns {Promise<void>}
 */
export const markMessagesAsRead = async (messageIds, userEmail, conversationId = null) => {
  try {
    console.log('✅ Marking messages as read:', messageIds.length);

    const updates = messageIds.map(async (messageId) => {
      const message = await getDocument('messages', messageId);
      if (message && !message.read_by?.includes(userEmail)) {
        const readBy = [...(message.read_by || []), userEmail];
        await updateDocument('messages', messageId, { read_by: readBy });
      }
    });

    await Promise.all(updates);
    console.log('✅ Messages marked as read');

    // Update conversation unread flags
    if (conversationId && messageIds.length > 0) {
      const conversation = await getDocument('conversations', conversationId);
      if (conversation) {
        const isHost = conversation.host_emails?.includes(userEmail);
        const isTraveler = conversation.traveler_email === userEmail;

        const unreadUpdates = {};
        if (isTraveler) {
          // Traveler read messages → clear unread_by_traveler
          unreadUpdates.unread_by_traveler = false;
        } else if (isHost) {
          // Host read messages → remove from unread_by_hosts array
          const unreadHosts = (conversation.unread_by_hosts || []).filter(
            (email) => email !== userEmail
          );
          unreadUpdates.unread_by_hosts = unreadHosts;
        }

        await updateDocument('conversations', conversationId, unreadUpdates);
        console.log('✅ Updated conversation unread flags');
      }
    }
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
  }
};
