import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllDocuments } from '@/utils/firestore';

const ALL_DESTINATIONS = [
  {
    city: 'Damascus',
    page: 'BookingDamascus',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Al-Hamidiyah_Souq_02.jpg',
    description: 'Ancient markets and historic architecture',
  },
  {
    city: 'Amman',
    page: 'BookingAmman',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Roman_theater_of_Amman_01.jpg',
    description: 'Roman ruins and modern culture',
  },
  {
    city: 'Istanbul',
    page: 'BookingIstanbul',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/9/92/Istanbul_Bosphorus_IMG_8548_1960.jpg',
    description: 'Where East meets West',
  },
];

const FALLBACK_RANKING = ['Istanbul', 'Damascus', 'Amman'];

export default function TrendingDestinations() {
  const navigate = useNavigate();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookingsForTrending'],
    queryFn: () => getAllDocuments('bookings'),
  });

  const trendingDestinations = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      // Fallback logic
      const topTwoFallback = FALLBACK_RANKING.slice(0, 2);
      return ALL_DESTINATIONS.filter((d) => topTwoFallback.includes(d.city)).sort(
        (a, b) => FALLBACK_RANKING.indexOf(a.city) - FALLBACK_RANKING.indexOf(b.city)
      );
    }

    // Analytics logic
    const cityCounts = bookings.reduce((acc, booking) => {
      if (booking.city) {
        acc[booking.city] = (acc[booking.city] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedCities = Object.entries(cityCounts).sort(
      ([, countA], [, countB]) => countB - countA
    );

    if (sortedCities.length <= 2) {
      const cityNames = sortedCities.map(([city]) => city);
      return ALL_DESTINATIONS.filter((d) => cityNames.includes(d.city)).sort(
        (a, b) => cityNames.indexOf(a.city) - cityNames.indexOf(b.city)
      );
    }

    const scoreOfSecondPlace = sortedCities[1][1];

    const topCities = sortedCities
      .filter(([, count], index) => index < 2 || count >= scoreOfSecondPlace)
      .map(([city]) => city);

    return ALL_DESTINATIONS.filter((d) => topCities.includes(d.city)).sort(
      (a, b) => topCities.indexOf(a.city) - topCities.indexOf(b.city)
    );
  }, [bookings]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-56'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
      {trendingDestinations.map((item) => (
        <div
          key={item.city}
          onClick={() => navigate(createPageUrl(item.page))}
          className='group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300'
        >
          <div className='relative h-56 overflow-hidden'>
            <img
              src={item.image}
              alt={item.city}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
              loading='lazy'
            />
            <div className='absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-md'>
              <TrendingUp className='w-4 h-4 text-amber-500' />
              <span className='text-sm font-semibold'>Trending</span>
            </div>
          </div>
          <div className='p-6'>
            <h3 className='text-2xl font-bold text-gray-900 mb-2'>{item.city}</h3>
            <p className='text-gray-600'>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
