import { QueryClient } from '@tanstack/react-query';

/**
 *  Optimized React Query Configuration
 * Prevents rate limiting with smart caching
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      //  Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,

      //  Reduce unnecessary refetches
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false, // Changed from true to false to reduce refetches

      //  Retry with backoff
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Changed from 0 to 1
      retryDelay: 3000, // Added retry delay
    },
  },
};

/**
 *  Stale Times by Data Type
 * Allows specific override of staleTime for different types of data.
 */
export const STALE_TIMES = {
  user: 30 * 60 * 1000, // 30 min - user data rarely changes
  bookings: 2 * 60 * 1000, // 2 min - bookings update frequently
  offers: 60 * 1000, // 1 min - offers update often
  hosts: 10 * 60 * 1000, // 10 min - host data stable
  services: 15 * 60 * 1000, // 15 min - services rarely change
  cities: 30 * 60 * 1000, // 30 min - cities very stable
  adventures: 5 * 60 * 1000, // 5 min - adventures semi-stable
  messages: 30 * 1000, // 30 sec - messages need fresh data
  notifications: 30 * 1000, // 30 sec - notifications need updates
};

// Initialize the QueryClient using the defined configuration object
export const queryClient = new QueryClient(queryClientConfig);

//  Clear cache on app minimize
// This ensures that when the user leaves the app (e.g., switches tabs),
// active queries are cancelled to save resources and potentially stale data is not kept
// if the app is minimized for a long time.
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Cancel all active queries when the app goes to the background
      queryClient.cancelQueries();
    }
  });
}

export default queryClient;
