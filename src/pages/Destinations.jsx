import { useQuery } from '@tanstack/react-query';
import { MapPin, ArrowRight, Loader2, Globe, Star, Compass } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { queryDocuments } from '@/utils/firestore';

import PageHeroVideo from '../components/common/PageHeroVideo';

export default function Destinations() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['allDestinations'],
    queryFn: async () => {
      // Get all active cities from Firestore
      const allCities = await queryDocuments('cities', [['is_active', '==', true]], {
        orderBy: { field: 'name', direction: 'asc' },
      });

      // Filter for valid cities
      const validCities = allCities.filter(
        (city) => city && city.name && typeof city.name === 'string'
      );

      // Remove duplicates by name
      const uniqueCities = validCities.reduce((acc, city) => {
        if (!acc.find((c) => c.name === city.name)) {
          acc.push(city);
        }
        return acc;
      }, []);

      return uniqueCities;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Use 'popular' field for featured cities
  const featuredCities = cities.filter((city) => city.popular === true);
  const regularCities = cities.filter((city) => city.popular !== true);

  return (
    <div className='min-h-screen bg-white'>
      {/*  Hero Section - Video Only */}
      <section className='relative h-[60vh] sm:h-[70vh] overflow-hidden bg-black'>
        <PageHeroVideo pageType='destinations' />

        <div className='relative z-10 flex flex-col items-center justify-center h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30'>
              <Globe className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>All Destinations</span>
            </div>
            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl'>
              Explore Our Destinations
            </h1>
            <p className='text-lg sm:text-xl text-white/95 font-medium drop-shadow-lg max-w-2xl mx-auto'>
              Discover authentic experiences in every city, guided by local hosts who know their
              home best
            </p>
          </div>
        </div>
      </section>

      <section className='section-padding bg-gradient-to-br from-gray-50 via-white to-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-20'>
              <Loader2 className='w-12 h-12 animate-spin text-[#9933CC] mb-4' />
              <p className='text-gray-600 text-lg'>Loading destinations...</p>
            </div>
          ) : cities.length === 0 ? (
            <div className='text-center py-20'>
              <div className='w-24 h-24 bg-gradient-to-br from-[#CCCCFF] to-[#E6E6FF] rounded-full flex items-center justify-center mx-auto mb-6'>
                <Compass className='w-12 h-12 text-[#9933CC]' />
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                No destinations available yet
              </h3>
              <p className='text-gray-600'>Check back soon for new amazing places to explore!</p>
            </div>
          ) : (
            <>
              {featuredCities.length > 0 && (
                <div className='mb-16'>
                  <div className='flex items-center gap-3 mb-8'>
                    <Star className='w-6 h-6 text-amber-500' />
                    <h2 className='text-3xl font-bold text-gray-900'>Featured Destinations</h2>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {featuredCities.map((city, idx) => (
                      <CityCard key={city.id} city={city} featured index={idx} />
                    ))}
                  </div>
                </div>
              )}

              {regularCities.length > 0 && (
                <div>
                  {featuredCities.length > 0 && (
                    <div className='flex items-center gap-3 mb-8'>
                      <MapPin className='w-6 h-6 text-[#9933CC]' />
                      <h2 className='text-3xl font-bold text-gray-900'>All Destinations</h2>
                    </div>
                  )}
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                    {regularCities.map((city, idx) => (
                      <CityCard key={city.id} city={city} index={idx + featuredCities.length} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className='section-padding bg-gradient-to-br from-[#330066] via-[#7B2CBF] to-[#9933CC] text-white relative overflow-hidden'>
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl' />
          <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl' />
        </div>

        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10'>
          <Compass className='w-16 h-16 mx-auto mb-6 text-white' />
          <h2 className='text-3xl lg:text-5xl font-bold mb-6'>
            Can't find what you're looking for?
          </h2>
          <p className='text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto'>
            We're constantly adding new destinations. Let us know where you'd like to explore next!
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              onClick={() => navigate(createPageUrl('Adventures'))}
              className='bg-white text-[#330066] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl'
            >
              <Compass className='w-6 h-6 mr-2' />
              Browse Experiences
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('About'))}
              variant='outline'
              className='border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl'
            >
              Learn More About SAWA
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CityCard({ city, featured = false, index = 0 }) {
  const navigate = useNavigate();

  const cityTaglines = {
    Damascus: 'Where ancient history meets warm hospitality',
    Amman: 'A modern gem in the heart of the Middle East',
    Istanbul: 'Where East meets West in perfect harmony',
    Cairo: 'The timeless city of pharaohs and wonders',
  };

  const tagline =
    city.description || cityTaglines[city.name] || 'Discover authentic local experiences';

  // Create page slug from city name if not available
  const pageSlug = city.page_slug || city.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <Card
      onClick={() => navigate(createPageUrl(pageSlug))}
      className={cn(
        'group cursor-pointer h-full overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-[#CCCCFF] hover:border-[#9933CC]',
        featured && 'md:col-span-1'
      )}
    >
      <div className='relative aspect-[4/3] overflow-hidden'>
        <img
          src={
            city.image_url ||
            city.cover_images?.[0] ||
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
          }
          alt={`${city.name} cityscape`}
          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
          loading={index < 6 ? 'eager' : 'lazy'}
          decoding={index < 3 ? 'sync' : 'async'}
          fetchPriority={index < 3 ? 'high' : 'auto'}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
          }}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

        {featured && (
          <div className='absolute top-4 right-4'>
            <Badge className='bg-amber-500 text-white border-0 flex items-center gap-1'>
              <Star className='w-3 h-3' />
              Featured
            </Badge>
          </div>
        )}

        <div className='absolute bottom-0 left-0 right-0 p-6'>
          <div className='flex items-center gap-2 mb-2'>
            <MapPin className='w-5 h-5 text-white' />
            <h3 className='text-2xl font-bold text-white'>{city.name}</h3>
          </div>
          {city.country && <p className='text-white/90 text-sm mb-2'>{city.country}</p>}
        </div>
      </div>

      <CardContent className='p-6'>
        <p className='text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2'>{tagline}</p>

        <Button className='w-full bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white rounded-xl h-11 font-semibold group-hover:shadow-lg transition-all'>
          Explore {city.name}
          <ArrowRight className='w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform' />
        </Button>
      </CardContent>
    </Card>
  );
}
