/**
 * React Hook for tracking metrics in components
 */

import { useEffect } from 'react';
import { metricsCollector } from './metrics';

/**
 * Track API calls automatically
 */
export function useMetricsTracking() {
  useEffect(() => {
    // Track page load time
    const loadTime = performance.now();
    metricsCollector.recordLatency(loadTime);
    
    console.log(`[METRICS] Page loaded in ${Math.round(loadTime)}ms`);
  }, []);
}

/**
 * Wrap API calls with metrics tracking
 */
export function withMetrics(apiCall) {
  return async (...args) => {
    const start = Date.now();
    
    try {
      const result = await apiCall(...args);
      const duration = Date.now() - start;
      metricsCollector.recordLatency(duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      metricsCollector.recordLatency(duration);
      metricsCollector.recordError('http');
      throw error;
    }
  };
}