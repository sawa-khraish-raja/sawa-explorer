import BookingPageTemplate from '../components/booking/BookingPageTemplate';

export default function BookingIstanbul() {
  const istanbul = {
    name: 'Istanbul',
    country: 'Turkey',
    description: 'Bridge between East and West, where history meets modernity',
    best_time_to_visit: 'April to May, September to November',
    languages: ['Turkish', 'English'],
    currency: 'Turkish Lira',
    highlights: [
      'Hagia Sophia',
      'Blue Mosque',
      'Grand Bazaar',
      'Bosphorus Cruise',
      'Turkish Cuisine',
      'Historic Peninsula',
    ],
  };

  return <BookingPageTemplate city={istanbul} />;
}
