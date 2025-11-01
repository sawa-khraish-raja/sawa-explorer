import { getFirestore, admin } from '../config/firebase.js';

export const sendPushNotification = async (req, res) => {
  try {
    const { recipientEmail, recipientId, title, body, data } = req.body || {};

    if (!recipientEmail && !recipientId) {
      return res.status(400).json({ error: 'recipientEmail or recipientId is required' });
    }

    const db = getFirestore();
    const deviceTokensRef = db.collection('device_tokens');
    const tokens = new Set();

    if (recipientId) {
      const snapshot = await deviceTokensRef.where('user_id', '==', recipientId).get();
      snapshot.forEach((doc) => {
        const token = doc.get('token');
        if (token) tokens.add(token);
      });
    }

    if (tokens.size === 0 && recipientEmail) {
      const snapshot = await deviceTokensRef.where('user_email', '==', recipientEmail).get();
      snapshot.forEach((doc) => {
        const token = doc.get('token');
        if (token) tokens.add(token);
      });
    }

    if (tokens.size === 0) {
      return res.json({ success: true, message: 'No registered device tokens' });
    }

    const payload = {
      tokens: Array.from(tokens),
      notification: {
        title: title || 'SAWA',
        body: body || '',
      },
      data: Object.fromEntries(
        Object.entries(data || {}).map(([key, value]) => [key, String(value)])
      ),
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    const invalidTokens = [];
    response.responses.forEach((msgResponse, index) => {
      if (!msgResponse.success) {
        const errorCode = msgResponse.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(payload.tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await Promise.all(
        invalidTokens.map((token) =>
          deviceTokensRef
            .doc(token)
            .delete()
            .catch(() => undefined)
        )
      );
    }

    return res.json({
      success: true,
      sent: response.successCount,
      failure: response.failureCount,
      cleanedUp: invalidTokens.length,
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return res.status(500).json({ error: 'Failed to send push notification' });
  }
};
