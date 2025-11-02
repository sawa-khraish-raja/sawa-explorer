import React from 'react';
import BookingPageTemplate from '../components/booking/BookingPageTemplate';

export default function BookingAmman() {
  const amman = {
    name: 'Amman',
    country: 'Jordan',
    description: 'Experience the perfect blend of ancient history and modern culture',
    best_time_to_visit: 'March to May, September to November',
    languages: ['Arabic', 'English'],
    currency: 'Jordanian Dinar',
    highlights: [
      'Roman Theater',
      'Citadel',
      'Rainbow Street',
      'Dead Sea Day Trips',
      'Local Cuisine',
      'Modern Shopping',
    ],
  };

  return <BookingPageTemplate city={amman} />;
}
