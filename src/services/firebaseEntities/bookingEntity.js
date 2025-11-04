import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as limitDocuments,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';

const COLLECTION = 'bookings';

const parseOrder = (orderInput) => {
  if (!orderInput || typeof orderInput !== 'string') {
    return null;
  }

  const trimmed = orderInput.trim();
  if (!trimmed) return null;

  const direction = trimmed.startsWith('-') ? 'desc' : 'asc';
  const field = trimmed.replace(/^[-+]/, '');

  if (!field) {
    return null;
  }

  return { field, direction };
};

const normalizeTimestamp = (value) => {
  if (!value) return value;
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
};

const normalizeBooking = (docSnap) => {
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
  };
};

const fetchCollection = async (order, limitValue) => {
  const colRef = collection(db, COLLECTION);
  const constraints = [];

  if (order) {
    constraints.push(orderBy(order.field, order.direction));
  }

  if (typeof limitValue === 'number' && limitValue > 0) {
    constraints.push(limitDocuments(limitValue));
  }

  const snapshot = constraints.length
    ? await getDocs(query(colRef, ...constraints))
    : await getDocs(colRef);
  return snapshot.docs.map((docSnap) => normalizeBooking(docSnap)).filter(Boolean);
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

      if (Object.prototype.hasOwnProperty.call(condition, '$contains')) {
        if (Array.isArray(value)) {
          return value.includes(condition.$contains);
        }
        return false;
      }

      // Fallback to shallow comparison for unsupported operators
      return JSON.stringify(value) === JSON.stringify(condition);
    }

    if (Array.isArray(condition)) {
      return condition.includes(value);
    }

    return value === condition;
  });
};

const list = async (orderOrLimit, maybeLimit) => {
  let order = null;
  let limitValue = null;

  if (typeof orderOrLimit === 'string') {
    order = parseOrder(orderOrLimit);
    if (typeof maybeLimit === 'number') {
      limitValue = maybeLimit;
    }
  } else if (typeof orderOrLimit === 'number') {
    limitValue = orderOrLimit;
  }

  return fetchCollection(order, limitValue);
};

const filter = async (criteria = {}, orderOrLimit, maybeLimit) => {
  const records = await list(orderOrLimit, maybeLimit);
  if (!criteria || Object.keys(criteria).length === 0) {
    return records;
  }
  return records.filter((record) => matchesCriteria(record, criteria));
};

const get = async (id) => {
  if (!id) return null;
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  return normalizeBooking(snapshot);
};

const create = async (data) => {
  const nowIso = new Date().toISOString();

  const payload = {
    ...data,
    created_date: data?.created_date || nowIso,
    updated_date: data?.updated_date || nowIso,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  const snapshot = await getDoc(docRef);
  return normalizeBooking(snapshot) || { id: docRef.id, ...payload };
};

const update = async (id, updates) => {
  if (!id) {
    throw new Error('Booking update requires an id');
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
  return normalizeBooking(snapshot) || { id, ...payload };
};

const remove = async (id) => {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTION, id));
  return true;
};

export const bookingEntity = {
  list,
  filter,
  get,
  create,
  update,
  delete: remove,
};
