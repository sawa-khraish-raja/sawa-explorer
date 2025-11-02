import React from 'react';
import BookingPageTemplate from '../components/booking/BookingPageTemplate';

export default function BookingDamascus() {
  const damascus = {
    name: 'Damascus',
    country: 'Syria',
    description: 'Discover the ancient charm of the oldest continuously inhabited city',
    best_time_to_visit: 'March to May, September to November',
    languages: ['Arabic', 'English'],
    currency: 'Syrian Pound',
    highlights: [
      'Umayyad Mosque',
      'Old Damascus',
      'Souq Al-Hamidiyah',
      'Mount Qasioun',
      'Traditional Hammams',
      'Ancient Architecture',
    ],
  };

  return <BookingPageTemplate city={damascus} />;
}
