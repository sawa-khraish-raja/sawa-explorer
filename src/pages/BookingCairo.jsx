import React from 'react';
import BookingPageTemplate from '../components/booking/BookingPageTemplate';

export default function BookingCairo() {
  const cairo = {
    name: 'Cairo',
    country: 'Egypt',
    description: 'Explore the land of pharaohs and timeless wonders',
    best_time_to_visit: 'October to April',
    languages: ['Arabic', 'English'],
    currency: 'Egyptian Pound',
    highlights: ['Pyramids of Giza', 'Egyptian Museum', 'Khan El Khalili', 'Nile Cruise', 'Islamic Cairo', 'Ancient Wonders']
  };

  return <BookingPageTemplate city={cairo} />;
}