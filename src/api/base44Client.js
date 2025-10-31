import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68e8bf2aebfc9660599d11a9",
  requiresAuth: false // Temporarily disabled for local testing - set to true for production
});
