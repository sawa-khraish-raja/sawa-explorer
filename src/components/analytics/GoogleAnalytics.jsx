import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = 'G-1NHD938BBY';

/**
 * 📊 Google Analytics 4 Integration
 * Tracks page views, conversions, and user behavior
 */

//  Load GA4 script
export function loadGA4() {
  if (typeof window === 'undefined' || window.gtag) return;

  // Create script tag
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll send manually for SPA
    cookie_flags: 'SameSite=None;Secure',
  });

  console.log(' Google Analytics 4 loaded');
}

//  Track page view
export function trackPageView(path, title) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });

  console.log('📊 GA4 Page View:', path);
}

//  Track event
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, params);
  console.log('📊 GA4 Event:', eventName, params);
}

//  Track conversion
export function trackConversion(eventName, value, currency = 'USD', params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, {
    value: value,
    currency: currency,
    ...params,
  });

  console.log('💰 GA4 Conversion:', eventName, value, currency);
}

//  Set user properties
export function setUserProperties(properties) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('set', 'user_properties', properties);
  console.log('👤 GA4 User Properties:', properties);
}

//  Track booking start
export function trackBookingStart(city, dates, guests, services) {
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: 0,
    items: [
      {
        item_id: city,
        item_name: `${city} Booking`,
        item_category: 'Travel',
        quantity: guests.adults + guests.children,
        price: 0,
      },
    ],
    booking_dates: `${dates.start} to ${dates.end}`,
    services_requested: services.join(', '),
  });
}

//  Track booking completion
export function trackBookingComplete(booking) {
  trackConversion('purchase', booking.total_price || 0, 'USD', {
    transaction_id: booking.id,
    items: [
      {
        item_id: booking.city,
        item_name: `${booking.city} Booking`,
        item_category: 'Travel',
        quantity: (booking.number_of_adults || 0) + (booking.number_of_children || 0),
        price: booking.total_price || 0,
      },
    ],
    booking_dates: `${booking.start_date} to ${booking.end_date}`,
    services: booking.selected_services?.join(', '),
  });

  // Also track to our backend
  trackConversionBackend({
    event_type: 'booking_completed',
    booking_id: booking.id,
    revenue: booking.total_price || 0,
  });
}

//  Track adventure view
export function trackAdventureView(adventure) {
  trackEvent('view_item', {
    currency: 'USD',
    value: adventure.traveler_total_price || 0,
    items: [
      {
        item_id: adventure.id,
        item_name: adventure.title,
        item_category: adventure.category,
        item_category2: adventure.city,
        price: adventure.traveler_total_price || 0,
      },
    ],
  });
}

//  Track search
export function trackSearch(searchTerm, filters = {}) {
  trackEvent('search', {
    search_term: searchTerm,
    ...filters,
  });
}

//  Track signup
export function trackSignup(method = 'email') {
  trackEvent('sign_up', {
    method: method,
  });
}

//  Track login
export function trackLogin(method = 'email') {
  trackEvent('login', {
    method: method,
  });
}

//  Get session ID
export function getSessionId() {
  if (typeof window === 'undefined') return null;

  let sessionId = sessionStorage.getItem('ga_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ga_session_id', sessionId);
  }
  return sessionId;
}

//  Get UTM parameters
export function getUTMParameters() {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: params.get('utm_source') || sessionStorage.getItem('utm_source') || null,
    utm_medium: params.get('utm_medium') || sessionStorage.getItem('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || sessionStorage.getItem('utm_campaign') || null,
    utm_term: params.get('utm_term') || sessionStorage.getItem('utm_term') || null,
    utm_content: params.get('utm_content') || sessionStorage.getItem('utm_content') || null,
  };

  // Save to session storage
  Object.entries(utm).forEach(([key, value]) => {
    if (value) sessionStorage.setItem(key, value);
  });

  return utm;
}

//  Track conversion to backend
async function trackConversionBackend(data) {
  try {
    const { base44 } = await import('@/api/base44Client');

    const sessionId = getSessionId();
    const utm = getUTMParameters();

    // TODO: Migrate conversion tracking to Firestore
    // Previously used Base44 function 'Track_Conversion'
    console.log('📊 Conversion tracked:', {
      ...data,
      session_id: sessionId,
      ...utm,
      page_url: window.location.href,
      referrer: document.referrer,
    });
  } catch (error) {
    console.error('Failed to track conversion to backend:', error);
  }
}

/**
 * React component for automatic page view tracking
 */
export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    loadGA4();
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path);

    // Track to backend
    trackConversionBackend({
      event_type: 'page_view',
    });
  }, [location]);

  return null;
}
