import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import BookingPageTemplate from '@/features/shared/booking-components/BookingPageTemplate';
import { queryDocuments } from '@/utils/firestore';
import { createPageUrl } from '@/utils';

export default function CityDetail() {
  const { citySlug } = useParams();
  const navigate = useNavigate();

  const { data: city, isLoading, error } = useQuery({
    queryKey: ['city', citySlug],
    queryFn: async () => {
      const cities = await queryDocuments('cities', [['is_active', '==', true]]);

      const matchedCity = cities.find(c => {
        const slug = c.page_slug || c.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
        return slug === citySlug;
      });

      if (!matchedCity) {
        throw new Error('City not found');
      }

      return matchedCity;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (error) {
      navigate(createPageUrl('NotFound'));
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-[#9933CC] mx-auto mb-4' />
          <p className='text-gray-600'>Loading city details...</p>
        </div>
      </div>
    );
  }

  if (!city) {
    return null;
  }

  return <BookingPageTemplate city={city} />;
}
