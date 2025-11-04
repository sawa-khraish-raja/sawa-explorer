import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
  orderBy,
  limit as limitDocuments,
} from 'firebase/firestore';

import { db } from '@/config/firebase';

const COLLECTION = 'notification_preferences';

const normalizeTimestamp = (value) => {
  if (!value) return value;
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
};

const normalizePreferences = (docSnap) => {
  if (!docSnap?.exists?.()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: normalizeTimestamp(data.created_at),
    updated_at: normalizeTimestamp(data.updated_at),
  };
};

const fetchDocs = async (constraints = [], limitValue = null) => {
  const colRef = collection(db, COLLECTION);
  const applied = [...constraints];

  if (typeof limitValue === 'number' && limitValue > 0) {
    applied.push(limitDocuments(limitValue));
  }

  const snapshot = applied.length
    ? await getDocs(query(colRef, ...applied))
    : await getDocs(colRef);

  return snapshot.docs.map((docSnap) => normalizePreferences(docSnap)).filter(Boolean);
};

const list = async (orderOrLimit, maybeLimit) => {
  const constraints = [];
  let limitValue = null;

  if (typeof orderOrLimit === 'string') {
    const trimmed = orderOrLimit.trim();
    if (trimmed) {
      const direction = trimmed.startsWith('-') ? 'desc' : 'asc';
      const field = trimmed.replace(/^[-+]/, '');
      if (field) {
        constraints.push(orderBy(field, direction));
      }
    }
    if (typeof maybeLimit === 'number') {
      limitValue = maybeLimit;
    }
  } else if (typeof orderOrLimit === 'number') {
    limitValue = orderOrLimit;
  }

  return fetchDocs(constraints, limitValue);
};

const filter = async (criteria = {}, orderOrLimit, maybeLimit) => {
  const constraints = [];
  let limitValue = null;

  if (criteria.user_email) {
    constraints.push(where('user_email', '==', criteria.user_email));
  }

  if (criteria.user_id) {
    constraints.push(where('user_id', '==', criteria.user_id));
  }

  if (typeof orderOrLimit === 'string') {
    const trimmed = orderOrLimit.trim();
    if (trimmed) {
      const direction = trimmed.startsWith('-') ? 'desc' : 'asc';
      const field = trimmed.replace(/^[-+]/, '');
      if (field) {
        constraints.push(orderBy(field, direction));
      }
    }
    if (typeof maybeLimit === 'number') {
      limitValue = maybeLimit;
    }
  } else if (typeof orderOrLimit === 'number') {
    limitValue = orderOrLimit;
  }

  const records = await fetchDocs(constraints, limitValue);
  if (!criteria || Object.keys(criteria).length === 0) {
    return records;
  }

  return records.filter((record) =>
    Object.entries(criteria).every(([field, value]) => {
      if (Array.isArray(value)) {
        return value.includes(record[field]);
      }
      return record[field] === value;
    })
  );
};

const get = async (id) => {
  if (!id) return null;
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  return normalizePreferences(snapshot);
};

const create = async (payload) => {
  const document = {
    user_email: payload.user_email || null,
    user_id: payload.user_id || null,
    push_enabled: payload.push_enabled ?? true,
    email_enabled: payload.email_enabled ?? true,
    in_app_enabled: payload.in_app_enabled ?? true,
    booking_request_received: payload.booking_request_received ?? true,
    offer_received: payload.offer_received ?? true,
    offer_accepted: payload.offer_accepted ?? true,
    booking_confirmed: payload.booking_confirmed ?? true,
    booking_cancelled: payload.booking_cancelled ?? true,
    message_received: payload.message_received ?? true,
    review_reminder: payload.review_reminder ?? true,
    payment_updates: payload.payment_updates ?? true,
    promotional: payload.promotional ?? false,
    sound_enabled: payload.sound_enabled ?? true,
    quiet_hours_enabled: payload.quiet_hours_enabled ?? false,
    quiet_hours_start: payload.quiet_hours_start || null,
    quiet_hours_end: payload.quiet_hours_end || null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), document);
  const snapshot = await getDoc(docRef);
  return normalizePreferences(snapshot) || { id: docRef.id, ...document };
};

const update = async (id, updates = {}) => {
  if (!id) {
    throw new Error('Notification preference update requires an id');
  }

  const payload = {
    ...updates,
    updated_at: serverTimestamp(),
  };

  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, payload);
  const snapshot = await getDoc(docRef);
  return normalizePreferences(snapshot) || { id, ...payload };
};

const remove = async (id) => {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTION, id));
  return true;
};

export const notificationPreferencesEntity = {
  list,
  filter,
  get,
  create,
  update,
  delete: remove,
};
