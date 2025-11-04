import { createContext, useState, useContext, useEffect } from 'react';

const enTranslations = {
  nav: {
    home: 'Home',
    adventures: 'Experiences',
    about: 'About',
    office: 'Office',
    admin: 'Admin',
    my_dashboard: 'Dashboard',
  },
  userMenu: {
    my_profile: 'Profile',
    my_offers: 'My Trips',
    admin_panel: 'Admin Panel',
    office_dashboard: 'Office Dashboard',
    logout: 'Log out',
  },
  auth: {
    login: 'Log in',
    signup: 'Sign up',
  },
  offers: {
    yourBookings: 'Your Bookings',
    myTripsTitle: 'My Trips',
    myTripsDescription: 'Manage your bookings, view offers, and track your adventures',
    allBookingsTab: 'All Bookings',
    allShort: 'All',
    pendingOffersTab: 'Pending Offers',
    pendingShort: 'Pending',
    adventuresTab: 'Adventures',
    noBookingsYet: {
      title: 'No Bookings Yet',
      message: 'Start exploring destinations and create your first booking',
    },
    noPendingOffers: {
      title: 'No Pending Offers',
      message: 'When hosts send you offers, they will appear here',
    },
    noAdventureBookings: {
      title: 'No Adventure Bookings',
      message: 'Book an adventure experience to see it here',
    },
    serviceBookingBadge: 'Service',
    requestedServicesTitle: 'Requested Services',
    noSpecificServicesRequested: 'No specific services requested',
    yourNotesTitle: 'Your Notes',
    priceDetailsTitle: 'Price Details',
    hostServicesLabel: 'Host Services',
    sawaCommissionLabel: 'SAWA Commission',
    officeCommissionLabel: 'Office Commission',
    totalPriceLabel: 'Total Price',
    whatIsIncludedTitle: "What's Included",
    messageFromHostTitle: 'Message from Host',
    offerExpiresOn: 'Offer expires on',
    declineOfferButton: 'Decline',
    acceptConfirmButton: 'Accept & Confirm',
    hostSentMessageDescription: 'Your host sent you a message about this adventure',
    viewMessagesButton: 'View Messages',
    cancelBookingButton: 'Cancel Booking',
  },
  bookingStatus: {
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    reviewOffers: 'Review Offers',
    offersReceived: 'Offers Received',
    awaitingOffers: 'Awaiting Offers',
  },
  common: {
    loadingBookings: 'Loading your bookings...',
    adult: 'Adult',
    adults: 'Adults',
    child: 'Child',
    children: 'Children',
    cancelButton: 'Cancel',
    confirmingButton: 'Confirming',
  },
  notifications: {
    loginRequired: {
      title: 'Login Required',
      message: 'Please log in to view your bookings',
    },
  },
  home: {
    hero_title: 'Discover the Middle East',
    hero_subtitle: 'Experience authentic travel with trusted local hosts',
    destinations_title: 'Popular Destinations',
    services_title: 'What We Offer',
    services_subtitle: 'Everything you need for an unforgettable journey',
    why_sawa_title: 'Why Choose SAWA',
    why_sawa_subtitle: 'Travel like a local, experience like never before',
    ai_planner_title: 'AI Trip Planner',
    ai_planner_subtitle: 'Get your personalized itinerary in seconds',
  },
  features: {
    authentic: 'Authentic Experiences',
    authentic_desc: 'Connect with verified local hosts who share their culture',
    verified: 'Verified Hosts',
    verified_desc: 'All hosts are carefully screened for your safety and comfort',
    sustainable: 'Sustainable Travel',
    sustainable_desc: 'Support local communities and travel responsibly',
    personalized: 'Personalized Service',
    personalized_desc: 'Every trip is tailored to your interests and needs',
  },
  city: {
    book_now: 'Book Now',
    select_dates: 'Select your travel dates and services',
    select_services: 'Select Services',
    check_in: 'Check-in Date',
    check_out: 'Check-out Date',
    guests: 'Guests',
    adults: 'Adults',
    children: 'Children',
    notes: 'Special Requests',
    notes_placeholder: 'Any special requests or requirements?',
    submit_booking: 'Submit Booking Request',
    login_required: 'Please log in to book',
  },
  messages: {
    title: 'My Messages',
    subtitle: 'Chat with your hosts and travelers',
    search_conversations: 'Search conversations',
    loading_conversations: 'Loading conversations...',
    services_tab: 'Services',
    adventures_tab: 'Adventures',
    no_service_conversations_title: 'No service conversations',
    no_service_conversations_message: 'Your conversations with hosts will appear here',
    no_adventure_conversations_title: 'No adventure conversations',
    no_adventure_conversations_message: 'Adventure conversations will appear when hosts start them',
    no_messages_yet: {
      title: 'No messages yet',
      description: 'Start exploring destinations and connect with hosts',
      explore_destinations: 'Explore Destinations',
    },
    select_conversation: {
      title: 'Select a conversation',
      description: 'Choose a chat from the list to start messaging',
    },
  },
  search: {
    where: 'Where to?',
    destination_placeholder: 'Select destination',
    checkin: 'Check-in',
    checkout: 'Check-out',
    who: "Who's coming?",
    adults_label: 'Adults',
    adults_description: 'Ages 13+',
    children_label: 'Children',
    children_description: 'Ages 2-12',
    add_date: 'Add date',
    search: 'Search',
  },
  footer: {
    company: 'Company',
    about_us: 'About Us',
    services: 'Services',
    become_host: 'Become a Host',
    partners: 'Partners',
    support: 'Support',
    guidelines: 'Community Guidelines',
    legal: 'Legal',
    cookies: 'Cookie Policy',
    privacy: 'Privacy Policy',
    copyright: '© 2025 SAWA. All rights reserved.',
  },
};

const translationsData = {
  en: enTranslations,
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'ar') {
      localStorage.setItem('language', 'en');
      return 'en';
    }
    return saved || 'en';
  });

  const [translations, setTranslations] = useState(translationsData['en']);

  useEffect(() => {
    if (language === 'ar') {
      setLanguageState('en');
      localStorage.setItem('language', 'en');
      return;
    }

    setTranslations(translationsData[language] || translationsData['en']);
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang) => {
    if (lang === 'ar') {
      console.warn(' Arabic is only available for chat translation, not UI');
      return;
    }
    setLanguageState(lang);
  };

  const t = (key, options) => {
    if (!key) return '';

    let translation = key.split('.').reduce((obj, k) => (obj || {})[k], translations);

    if (translation && typeof translation === 'string' && options) {
      Object.keys(options).forEach((optKey) => {
        translation = translation.replace(`{{${optKey}}}`, options[optKey]);
      });
    }

    if (!translation || typeof translation !== 'string') {
      const fallback = key.split('.').pop();
      return fallback
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
};
