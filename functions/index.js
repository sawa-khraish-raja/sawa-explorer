/**
 * Firebase Cloud Functions for SAWA Explorer
 */

const functions = require('firebase-functions');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');
const { defineString } = require('firebase-functions/params');

// Initialize Firebase Admin
admin.initializeApp();

const openaiApiKey = defineString('OPENAI_API_KEY');

const getOpenAIKey = () => {
  return openaiApiKey.value();
};

let openaiInstance = null;
const getOpenAI = () => {
  if (!openaiInstance) {
    const apiKey = getOpenAIKey();
    if (apiKey) {
      openaiInstance = new OpenAI({ apiKey });
    }
  }
  return openaiInstance;
};

/**
 * Cloud Function: invokeLLM
 * Invokes OpenAI API for AI Trip Planner and other LLM features
 */
exports.invokeLLM = onCall(async (request) => {
  try {
    // In Firebase Functions v2, the data is in request.data
    const data = request.data || request;

    console.log('Received request');

    // Extract parameters
    const { prompt, model = 'gpt-4', temperature = 0.7, max_tokens = 2000 } = data;

    // Validate prompt
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
    }

    console.log('Invoking LLM with model:', model);

    // Get OpenAI instance
    const openai = getOpenAI();
    if (!openai) {
      throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured');
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful travel planning assistant. Provide detailed, accurate travel information in JSON format when requested.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: temperature,
      max_tokens: max_tokens,
    });

    const result = response.choices[0].message.content;

    console.log('LLM response received');

    return {
      text: result,
      content: result,
      model: model,
      usage: response.usage,
    };
  } catch (error) {
    console.error('Error invoking LLM:', error);

    // Handle OpenAI errors
    if (error.code === 'insufficient_quota') {
      throw new functions.https.HttpsError('resource-exhausted', 'OpenAI API quota exceeded');
    }

    if (error.code === 'invalid_api_key') {
      throw new functions.https.HttpsError('unauthenticated', 'Invalid OpenAI API key');
    }

    throw new functions.https.HttpsError('internal', error.message || 'Failed to invoke LLM');
  }
});

/**
 * Cloud Function: sendBroadcastNotification
 * Sends notifications to all users
 */
exports.sendBroadcastNotification = onCall(async (request) => {
  try {
    // In Firebase Functions v2, the data is in request.data
    const data = request.data || request;
    const auth = request.auth;

    // Check authentication
    if (!auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { title, message, link } = data;

    // Get all users
    const usersSnapshot = await admin.firestore().collection('users').get();
    const notifications = [];

    usersSnapshot.forEach((doc) => {
      notifications.push({
        user_id: doc.id,
        title: title,
        message: message,
        link: link || '/Home',
        type: 'broadcast',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });
    });

    // Batch write notifications
    const batch = admin.firestore().batch();
    notifications.forEach((notification) => {
      const ref = admin.firestore().collection('notifications').doc();
      batch.set(ref, notification);
    });

    await batch.commit();

    console.log(`Broadcast sent to ${notifications.length} users`);

    return {
      success: true,
      count: notifications.length,
    };
  } catch (error) {
    console.error('❌ Error sending broadcast:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
