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
  orderBy,
  limit as limitDocuments,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';

const COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

const normalizeTimestamp = (value) => {
  if (!value) return value;
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
};

const normalizeNotification = (docSnap) => {
  if (!docSnap?.exists?.()) {
    return null;
  }

  const data = docSnap.data();
  const createdDate =
    data.created_date || normalizeTimestamp(data.created_at) || new Date().toISOString();

  return {
    id: docSnap.id,
    ...data,
    created_at: normalizeTimestamp(data.created_at),
    updated_at: normalizeTimestamp(data.updated_at),
    created_date: createdDate,
    updated_date: data.updated_date || normalizeTimestamp(data.updated_at) || createdDate,
    read_at: normalizeTimestamp(data.read_at),
  };
};

const fetchDocs = async (constraints = [], orderConstraint = null, limitValue = null) => {
  const colRef = collection(db, COLLECTION);
  const appliedConstraints = [...constraints];

  if (orderConstraint) {
    appliedConstraints.push(orderBy(orderConstraint.field, orderConstraint.direction));
  }

  if (typeof limitValue === 'number' && limitValue > 0) {
    appliedConstraints.push(limitDocuments(limitValue));
  }

  const snapshots = appliedConstraints.length
    ? await getDocs(query(colRef, ...appliedConstraints))
    : await getDocs(colRef);

  return snapshots.docs.map((docSnap) => normalizeNotification(docSnap)).filter(Boolean);
};

const matchesCriteria = (record, criteria = {}) => {
  if (!record) return false;

  return Object.entries(criteria).every(([field, condition]) => {
    const value = record[field];

    if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
      if (Object.prototype.hasOwnProperty.call(condition, '$exists')) {
        const shouldExist = Boolean(condition.$exists);
        const exists = value !== undefined && value !== null;
        return shouldExist ? exists : !exists;
      }

      if (Object.prototype.hasOwnProperty.call(condition, '$in') && Array.isArray(condition.$in)) {
        return condition.$in.includes(value);
      }

      return JSON.stringify(value) === JSON.stringify(condition);
    }

    if (Array.isArray(condition)) {
      return condition.includes(value);
    }

    return value === condition;
  });
};

const pickQueryConstraint = (criteria = {}) => {
  if (!criteria || Object.keys(criteria).length === 0) {
    return [];
  }

  if (criteria.user_id) {
    return [where('user_id', '==', criteria.user_id)];
  }

  if (criteria.recipient_email) {
    return [where('recipient_email', '==', criteria.recipient_email)];
  }

  if (criteria.recipient_type) {
    return [where('recipient_type', '==', criteria.recipient_type)];
  }

  return [];
};

const parseOrderInput = (input) => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const direction = trimmed.startsWith('-') ? 'desc' : 'asc';
  const field = trimmed.replace(/^[-+]/, '');
  if (!field) return null;
  return { field, direction };
};

const list = async (orderOrLimit, maybeLimit) => {
  let order = null;
  let limitValue = null;

  if (typeof orderOrLimit === 'string') {
    order = parseOrderInput(orderOrLimit);
    if (typeof maybeLimit === 'number') {
      limitValue = maybeLimit;
    }
  } else if (typeof orderOrLimit === 'number') {
    limitValue = orderOrLimit;
  }

  return fetchDocs([], order, limitValue);
};

const filter = async (criteria = {}, orderOrLimit, maybeLimit) => {
  let order = null;
  let limitValue = null;

  if (typeof orderOrLimit === 'string') {
    order = parseOrderInput(orderOrLimit);
    if (typeof maybeLimit === 'number') {
      limitValue = maybeLimit;
    }
  } else if (typeof orderOrLimit === 'number') {
    limitValue = orderOrLimit;
  }

  const constraints = pickQueryConstraint(criteria);
  const records = await fetchDocs(constraints, order, limitValue);
  if (!criteria || Object.keys(criteria).length === 0) {
    return records;
  }

  return records.filter((record) => matchesCriteria(record, criteria));
};

const get = async (id) => {
  if (!id) return null;
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  return normalizeNotification(snapshot);
};

const findUserByEmail = async (email) => {
  if (!email) return null;
  const usersRef = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(query(usersRef, where('email', '==', email), limitDocuments(1)));
  if (snapshot.empty) {
    return null;
  }
  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
};

const create = async (payload) => {
  const nowIso = new Date().toISOString();
  let userId = payload.user_id || payload.recipient_id;

  if (!userId && payload.recipient_email) {
    const user = await findUserByEmail(payload.recipient_email);
    userId = user?.id || null;
  }

  const document = {
    recipient_email: payload.recipient_email || null,
    recipient_type: payload.recipient_type || 'user',
    user_id: userId,
    type: payload.type || 'general',
    title: payload.title || '',
    message: payload.message || '',
    link: payload.link || payload.action_url || null,
    related_booking_id: payload.related_booking_id || null,
    related_offer_id: payload.related_offer_id || null,
    related_conversation_id: payload.related_conversation_id || null,
    read: payload.read ?? false,
    created_date: payload.created_date || nowIso,
    updated_date: payload.updated_date || nowIso,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), document);
  const snapshot = await getDoc(docRef);
  return normalizeNotification(snapshot) || { id: docRef.id, ...document };
};

const update = async (id, updates = {}) => {
  if (!id) {
    throw new Error('Notification update requires an id');
  }

  const nowIso = new Date().toISOString();
  const payload = {
    ...updates,
    updated_date: updates?.updated_date || nowIso,
    updated_at: serverTimestamp(),
  };

  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, payload);
  const snapshot = await getDoc(docRef);
  return normalizeNotification(snapshot) || { id, ...payload };
};

const remove = async (id) => {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTION, id));
  return true;
};

export const notificationEntity = {
  list,
  filter,
  get,
  create,
  update,
  delete: remove,
};
