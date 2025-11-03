/**
 * Payment Security Helpers (Frontend)
 * Integration with signed payment actions
 */

import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';

/**
 * Create secure payment intent
 * @param {Object} params - {bookingId, amount, currency}
 * @returns {Promise<Object>} Payment intent with signed payload
 */
export async function createPaymentIntent({ bookingId, amount, currency = 'USD' }) {
  try {
    const response = await createPaymentIntent( {
      bookingId,
      amount,
      currency,
    });

    if (!response.data.ok) {
      throw new Error(response.data.error || 'Failed to create payment intent');
    }

    return response.data;
  } catch (error) {
    console.error('[PAYMENT] Create intent failed:', error);
    throw error;
  }
}

/**
 * Verify payment action signature before confirming
 * @param {Object} signed - {payload, sig}
 * @returns {Promise<boolean>} Valid or not
 */
export async function verifyPaymentSignature(signed) {
  try {
    const response = await verifySignature( signed);

    return response.data.ok === true;
  } catch (error) {
    console.error('[PAYMENT] Signature verification failed:', error);
    return false;
  }
}

/**
 * Complete payment flow with security checks
 * @param {Object} params - Payment params
 * @returns {Promise<Object>} Payment result
 */
export async function securePaymentFlow({ bookingId, amount, currency, cardElement }) {
  // Step 1: Create intent with signed payload
  const { paymentIntent, signed } = await createPaymentIntent({
    bookingId,
    amount,
    currency,
  });

  // Step 2: Verify signature
  const isValid = await verifyPaymentSignature(signed);

  if (!isValid) {
    throw new Error('Payment signature verification failed');
  }

  // Step 3: Confirm payment with Stripe (or your provider)
  // This should use your payment provider's client-side SDK
  // Example with Stripe:
  // const { error, paymentIntent: confirmedPI } = await stripe.confirmCardPayment(
  //   paymentIntent.clientSecret,
  //   { payment_method: { card: cardElement } }
  // );

  // Demo return
  return {
    ok: true,
    paymentIntentId: paymentIntent.id,
  };
}
