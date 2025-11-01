export const lazyLoadImage = (imgElement, src) => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          imgElement.src = src;
          imgElement.classList.add('loaded');
          observer.unobserve(imgElement);
        }
      });
    });
    observer.observe(imgElement);
  } else {
    imgElement.src = src;
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

export const measurePerformance = (label, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return result;
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (urls) => {
  return Promise.all(urls.map((url) => preloadImage(url)));
};

export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url) return url;
  if (url.includes('unsplash.com')) {
    return `${url}?w=${width}&auto=format&fit=crop&q=80`;
  }
  return url;
};

export const isWebPSupported = () => {
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

export const optimizeBundle = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Cleanup tasks
    });
  }
};

export const cacheAPIResponse = (key, data, ttl = 300000) => {
  const item = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  } catch (e) {
    // Storage full, ignore
  }
};

export const getCachedAPIResponse = (key) => {
  try {
    const item = JSON.parse(localStorage.getItem(`cache_${key}`));
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return item.data;
  } catch (e) {
    return null;
  }
};

export const clearExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('cache_')) {
        const item = JSON.parse(localStorage.getItem(key));
        if (Date.now() - item.timestamp > item.ttl) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    // Ignore errors
  }
};
