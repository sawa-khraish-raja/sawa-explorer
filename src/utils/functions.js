import { httpsCallable } from 'firebase/functions';

import { functions } from '@/config/firebase';

/**
 * Invoke a Firebase Cloud Function
 * @param {string} functionName - Name of the cloud function
 * @param {object} data - Data to pass to the function
 * @returns {Promise<any>} - Function response
 */
export async function invokeFunction(functionName, data = {}) {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Error invoking function ${functionName}:`, error);
    throw error;
  }
}

/**
 * Helper functions for common operations
 */

export async function notifyHostsOfNewBooking(bookingData) {
  return invokeFunction('notifyHostsOfNewBooking', bookingData);
}

export async function confirmBooking(bookingId) {
  return invokeFunction('confirmBooking', { bookingId });
}

export async function deleteAccount(userId) {
  return invokeFunction('deleteAccount', { userId });
}

export async function translateText(text, targetLang, sourceLang = 'auto') {
  return invokeFunction('translate', { text, targetLang, sourceLang });
}

export async function messageTranslator(params) {
  return invokeFunction('messageTranslator', params);
}

export async function assistantChat(params) {
  return invokeFunction('assistantChat', params);
}

// Payments
export async function createPaymentIntent(amount, currency = 'USD') {
  return invokeFunction('payments/createIntent', { amount, currency });
}

export async function verifySignature(signed) {
  return invokeFunction('actions/verifySignature', signed);
}
