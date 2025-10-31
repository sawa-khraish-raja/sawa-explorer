// ✅ DISABLED: Removed aggressive abort logic that causes "Request aborted" errors
export const createAbortController = () => {
  // Return a dummy controller that doesn't actually abort
  return {
    signal: null,
    abort: () => {}
  };
};

export const cleanupAbortController = () => {
  // No-op
};