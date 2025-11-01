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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

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
      updated_at: serverTimestamp()
    });
    console.log(`✅ Document created in ${collectionName} with ID:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error adding document to ${collectionName}:`, error);
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
      updated_at: serverTimestamp()
    });
    console.log(`✅ Document set in ${collectionName}/${docId}`);
  } catch (error) {
    console.error(`❌ Error setting document ${collectionName}/${docId}:`, error);
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
    console.error(`❌ Error getting document ${collectionName}/${docId}:`, error);
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
    console.log(`✅ Found ${documents.length} documents in ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Error getting documents from ${collectionName}:`, error);
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

    console.log(`✅ Query found ${documents.length} documents in ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Error querying ${collectionName}:`, error);
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
      updated_at: serverTimestamp()
    });
    console.log(`✅ Document updated: ${collectionName}/${docId}`);
  } catch (error) {
    console.error(`❌ Error updating document ${collectionName}/${docId}:`, error);
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
    console.log(`✅ Document deleted: ${collectionName}/${docId}`);
  } catch (error) {
    console.error(`❌ Error deleting document ${collectionName}/${docId}:`, error);
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
    is_active: true
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
    total_price: bookingData.total_price
  });
};

/**
 * Example: Get user's bookings
 */
export const getUserBookings = async (userId) => {
  return await queryDocuments(
    'bookings',
    [['user_id', '==', userId]],
    { orderBy: { field: 'created_at', direction: 'desc' } }
  );
};
