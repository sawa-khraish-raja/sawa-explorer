import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryDocuments } from '@/utils/firestore';
import { createPageUrl } from '@/utils';
import { Loader2, MapPin, ArrowRight } from 'lucide-react';

export default function DestinationIcons() {
  const navigate = useNavigate();

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['destinationCities'],
    queryFn: async () => {
      // Get active cities from Firestore
      const allCities = await queryDocuments('cities', [['is_active', '==', true]], {
        orderBy: { field: 'name', direction: 'asc' },
      });

      // Remove duplicates by name
      const uniqueCities = Array.isArray(allCities)
        ? allCities.reduce((acc, city) => {
            if (city.name && !acc.find((c) => c.name === city.name)) {
              acc.push(city);
            }
            return acc;
          }, [])
        : [];

      return uniqueCities;
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='w-6 h-6 animate-spin text-[#9933CC]' />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
      {Array.isArray(cities) &&
        cities.map((city, index) => {
          // Create page slug from city name if not available
          const pageSlug = city.page_slug || city.name.toLowerCase().replace(/\s+/g, '-');

          return (
            <article
              key={city.id}
              onClick={() => navigate(createPageUrl(pageSlug))}
              className='group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 hover:shadow-2xl'
              role='button'
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(createPageUrl(pageSlug));
                }
              }}
            >
              <div className='relative aspect-[4/3] overflow-hidden'>
                <img
                  src={
                    city?.image_url ||
                    city?.cover_images?.[0] ||
                    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
                  }
                  alt={`${city?.name || 'City'} - Explore with local hosts`}
                  className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding={index < 3 ? 'sync' : 'async'}
                  fetchpriority={index < 2 ? 'high' : 'auto'}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
                  }}
                />

                <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300' />
              </div>

              <div className='absolute bottom-0 left-0 right-0 p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <MapPin className='w-4 h-4 text-white/90' />
                      <span className='text-sm text-white/80'>
                        {city?.country || 'Middle East'}
                      </span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-[#E6CCFF] transition-colors'>
                      {city?.name || 'City'}
                    </h3>
                  </div>

                  <div className='w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#9933CC] transition-all duration-300 group-hover:scale-110'>
                    <ArrowRight className='w-5 h-5 text-white' />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
    </div>
  );
}
