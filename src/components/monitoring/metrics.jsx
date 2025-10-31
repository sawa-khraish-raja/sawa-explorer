/**
 * SAWA Telemetry & Metrics Tracking
 * Collects performance and error metrics
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      http_errors: 0,
      translate_429: 0,
      voice_failures: 0,
      latency_samples: [],
      last_reset: Date.now()
    };
    
    // Reset metrics every hour
    setInterval(() => this.reset(), 60 * 60 * 1000);
  }
  
  reset() {
    this.metrics = {
      http_errors: 0,
      translate_429: 0,
      voice_failures: 0,
      latency_samples: [],
      last_reset: Date.now()
    };
  }
  
  recordError(type) {
    switch(type) {
      case 'http':
        this.metrics.http_errors++;
        break;
      case 'translate_rate_limit':
        this.metrics.translate_429++;
        break;
      case 'voice':
        this.metrics.voice_failures++;
        break;
    }
  }
  
  recordLatency(ms) {
    this.metrics.latency_samples.push(ms);
    
    // Keep only last 100 samples
    if (this.metrics.latency_samples.length > 100) {
      this.metrics.latency_samples.shift();
    }
  }
  
  snapshot() {
    const latencies = this.metrics.latency_samples;
    const sorted = [...latencies].sort((a, b) => a - b);
    
    return {
      http_errors: this.metrics.http_errors,
      translate_429: this.metrics.translate_429,
      voice_failures: this.metrics.voice_failures,
      latency_avg: latencies.length > 0 
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
      latency_p95: latencies.length > 0
        ? sorted[Math.floor(sorted.length * 0.95)] || 0
        : 0,
      latency_p99: latencies.length > 0
        ? sorted[Math.floor(sorted.length * 0.99)] || 0
        : 0,
      sample_count: latencies.length,
      last_reset: this.metrics.last_reset,
      uptime_ms: Date.now() - this.metrics.last_reset
    };
  }
}

export const metricsCollector = new MetricsCollector();

/**
 * Track API call performance
 */
export async function trackApiCall(fn) {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    metricsCollector.recordLatency(duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metricsCollector.recordLatency(duration);
    
    // Record specific error types
    if (error.message?.includes('429')) {
      metricsCollector.recordError('translate_rate_limit');
    } else if (error.message?.includes('voice')) {
      metricsCollector.recordError('voice');
    } else {
      metricsCollector.recordError('http');
    }
    
    throw error;
  }
}