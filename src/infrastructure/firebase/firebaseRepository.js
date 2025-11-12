import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';

export class FirebaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collection = collection(db, collectionName);
  }

  normalizeTimestamp(value) {
    if (!value) return value;
    if (typeof value?.toDate === 'function') {
      return value.toDate().toISOString();
    }
    return value;
  }

  normalizeDocument(docSnap) {
    if (!docSnap?.exists?.()) {
      return null;
    }

    const data = docSnap.data();
    const createdDate =
      data.created_date || this.normalizeTimestamp(data.created_at) || new Date().toISOString();

    return {
      id: docSnap.id,
      ...data,
      created_at: this.normalizeTimestamp(data.created_at),
      updated_at: this.normalizeTimestamp(data.updated_at),
      created_date: createdDate,
      updated_date: data.updated_date || this.normalizeTimestamp(data.updated_at) || createdDate,
    };
  }

  async getById(id) {
    if (!id) return null;
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    return this.normalizeDocument(snapshot);
  }

  async getAll(orderByField = null, orderDirection = 'asc', limitCount = null) {
    const constraints = [];

    if (orderByField) {
      constraints.push(firestoreOrderBy(orderByField, orderDirection));
    }

    if (typeof limitCount === 'number' && limitCount > 0) {
      constraints.push(firestoreLimit(limitCount));
    }

    const q = constraints.length ? query(this.collection, ...constraints) : this.collection;
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => this.normalizeDocument(docSnap)).filter(Boolean);
  }

  async create(data) {
    const nowIso = new Date().toISOString();

    const payload = {
      ...data,
      created_date: data?.created_date || nowIso,
      updated_date: data?.updated_date || nowIso,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(this.collection, payload);
    const snapshot = await getDoc(docRef);
    return this.normalizeDocument(snapshot) || { id: docRef.id, ...payload };
  }

  async update(id, updates) {
    if (!id) {
      throw new Error(`${this.collectionName} update requires an id`);
    }

    const nowIso = new Date().toISOString();
    const payload = {
      ...updates,
      updated_date: updates?.updated_date || nowIso,
      updated_at: serverTimestamp(),
    };

    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, payload);
    const snapshot = await getDoc(docRef);
    return this.normalizeDocument(snapshot) || { id, ...payload };
  }

  async delete(id) {
    if (!id) return false;
    await deleteDoc(doc(db, this.collectionName, id));
    return true;
  }

  matchesCriteria(record, criteria = {}) {
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

        return JSON.stringify(value) === JSON.stringify(condition);
      }

      if (Array.isArray(condition)) {
        return condition.includes(value);
      }

      return value === condition;
    });
  }

  async filter(criteria = {}, orderByField = null, orderDirection = 'asc', limitCount = null) {
    const records = await this.getAll(orderByField, orderDirection, limitCount);
    if (!criteria || Object.keys(criteria).length === 0) {
      return records;
    }
    return records.filter((record) => this.matchesCriteria(record, criteria));
  }
}
