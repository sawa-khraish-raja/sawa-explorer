import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { createPageUrl } from '@/utils';
import { getAllDocuments } from '@/utils/firestore';

export default function AdventuresHomeSection() {
  const navigate = useNavigate();

  //  Fetch featured adventures from Firestore
  const {
    data: adventures = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['featuredAdventures'],
    queryFn: async () => {
      // Get all adventures (avoid composite index requirement)
      const allAdventures = await getAllDocuments('adventures');

      // Filter in JavaScript for approved and active adventures
      const approvedAdventures = (allAdventures || []).filter(
        (a) => a.is_active === true && a.approval_status === 'approved'
      );

      // Sort by created_at in JavaScript
      approvedAdventures.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
        const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
        return dateB - dateA; // desc order
      });

      // Filter for future adventures with available spots
      const filteredAdventures = approvedAdventures
        .filter((a) => {
          const hasSpace = (a.current_participants || 0) < (a.max_guests || 0);
          const isFuture = a.date && new Date(a.date) > new Date();

          return hasSpace && isFuture;
        })
        .slice(0, 6);

      return filteredAdventures;
    },
    staleTime: 5 * 60 * 1000, //  5 minutes - Featured adventures cache
    cacheTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className='py-16 bg-gradient-to-br from-purple-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
              Discover Local Adventures
            </h2>
            <p className='text-lg text-gray-600'>Join unique experiences hosted by local experts</p>
          </div>
          <div className='flex justify-center items-center py-12'>
            <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className='py-16 bg-gradient-to-br from-purple-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
              Discover Local Adventures
            </h2>
            <p className='text-lg text-gray-600'>Join unique experiences hosted by local experts</p>
          </div>
          <div className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='w-12 h-12 text-red-500 mb-4' />
            <p className='text-gray-600 text-center'>
              Failed to load adventures. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (adventures.length === 0) {
    return (
      <section className='py-16 bg-gradient-to-br from-purple-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
              Discover Local Adventures
            </h2>
            <p className='text-lg text-gray-600'>Join unique experiences hosted by local experts</p>
          </div>

          <Card className='bg-white border-2 border-purple-200'>
            <CardContent className='py-16 text-center'>
              <div className='w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <Sparkles className='w-10 h-10 text-purple-600' />
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>New Adventures Coming Soon!</h3>
              <p className='text-gray-600 mb-6 max-w-md mx-auto'>
                We're working with local hosts to bring you amazing experiences. Check back soon!
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Adventures'))}
                className='bg-gradient-to-r from-[#7B2CBF] to-[#9933CC] hover:from-[#6A1FA0] hover:to-[#7B2CBF] text-white px-8 py-6 text-lg'
              >
                <Sparkles className='w-5 h-5 mr-2' />
                Explore All Adventures
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className='py-16 bg-gradient-to-br from-purple-50 to-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header - NO ANIMATIONS */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
            Discover Local Adventures
          </h2>
          <p className='text-lg text-gray-600'>Join unique experiences hosted by local experts</p>
        </div>

        {/* Adventures Grid - NO ANIMATIONS */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {adventures.map((adventure) => (
            <Card
              key={adventure.id}
              className='group hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-purple-200'
              onClick={() => navigate(createPageUrl(`AdventureDetails?id=${adventure.id}`))}
            >
              <div className='relative h-48 overflow-hidden bg-gray-100'>
                {(adventure.images && adventure.images[0]) || adventure.image_url ? (
                  <img
                    src={(adventure.images && adventure.images[0]) || adventure.image_url}
                    alt={adventure.title}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
                    }}
                    loading='lazy'
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center'>
                    <Sparkles className='w-16 h-16 text-white opacity-50' />
                  </div>
                )}

                <div className='absolute top-3 right-3'>
                  <Badge className='bg-white/90 text-purple-900 backdrop-blur-sm'>
                    {adventure.category}
                  </Badge>
                </div>

                {adventure.is_featured && (
                  <div className='absolute top-3 left-3'>
                    <Badge className='bg-yellow-500 text-white'>⭐ Featured</Badge>
                  </div>
                )}
              </div>

              <CardContent className='p-4'>
                <h3 className='font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors'>
                  {adventure.title}
                </h3>

                <div className='space-y-2 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <MapPin className='w-4 h-4 text-purple-600 flex-shrink-0' />
                    <span className='truncate'>{adventure.city_name || adventure.city}</span>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Calendar className='w-4 h-4 text-purple-600 flex-shrink-0' />
                    <span>{format(new Date(adventure.date), 'MMM d, yyyy')}</span>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Users className='w-4 h-4 text-purple-600 flex-shrink-0' />
                    <span>
                      {adventure.current_participants || 0}/{adventure.max_guests || 0} spots
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
                  <div className='flex items-center gap-1'>
                    <DollarSign className='w-5 h-5 text-green-600' />
                    <span className='text-2xl font-bold text-green-600'>
                      {(adventure.price || 0).toFixed(0)}
                    </span>
                    <span className='text-sm text-gray-500'>/person</span>
                  </div>

                  <ArrowRight className='w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button - NO ANIMATIONS */}
        <div className='text-center'>
          <Button
            onClick={() => navigate(createPageUrl('Adventures'))}
            size='lg'
            className='bg-gradient-to-r from-[#7B2CBF] to-[#9933CC] hover:from-[#6A1FA0] hover:to-[#7B2CBF] text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all'
          >
            <Sparkles className='w-5 h-5 mr-2' />
            Explore All Adventures
            <ArrowRight className='w-5 h-5 ml-2' />
          </Button>
        </div>
      </div>
    </section>
  );
}
