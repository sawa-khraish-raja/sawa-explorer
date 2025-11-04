import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Users,
  Calendar,
  Sparkles,
  Globe,
  DollarSign,
  Info,
  Image as ImageIcon,
  Star,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { queryDocuments, getAllDocuments } from '@/utils/firestore';

import PageHeroVideo from '../common/PageHeroVideo';
import { normalizeText } from '../utils/textHelpers';
import { getUserDisplayName } from '../utils/userHelpers';

import EventCard from './EventCard';
import SimpleBookingForm from './SimpleBookingForm';

export default function BookingPageTemplate({ city }) {
  const navigate = useNavigate();

  const { data: events = [] } = useQuery({
    queryKey: ['cityEvents', city.name],
    queryFn: async () => {
      const allEvents = await queryDocuments('events', [['city', '==', city.name]]);
      const now = new Date();
      return allEvents.filter((e) => new Date(e.start_datetime) > now).slice(0, 3);
    },
    enabled: !!city.name,
    staleTime: 10 * 60 * 1000,
  });

  const { data: hosts = [], isLoading: isLoadingHosts } = useQuery({
    queryKey: ['cityHosts', city.name],
    queryFn: async () => {
      console.log(' [BookingPageTemplate] Fetching hosts for:', city.name);

      try {
        // Get all users who are approved hosts and visible in this city
        const allUsers = await getAllDocuments('users');
        const cityHosts = allUsers.filter(
          (u) => u.host_approved === true && u.visible_in_city === true && u.city === city.name
        );

        console.log(' [BookingPageTemplate] Found hosts:', cityHosts.length);
        return cityHosts.slice(0, 6);
      } catch (error) {
        console.error(' [BookingPageTemplate] Error fetching hosts:', error);
        return [];
      }
    },
    enabled: !!city.name,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const { data: cityData } = useQuery({
    queryKey: ['cityData', city.name],
    queryFn: async () => {
      const cities = await queryDocuments('cities', [['name', '==', city.name]]);
      return cities[0];
    },
    enabled: !!city.name,
  });

  console.log('[BookingPageTemplate] Rendering with:', {
    city: city.name,
    hostsCount: hosts.length,
    isLoadingHosts,
    hosts: hosts.map((h) => ({ email: h.email, name: h.full_name })),
  });

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      {/* Hero Section */}
      <section className='relative h-[50vh] sm:h-[60vh] overflow-hidden bg-black'>
        <PageHeroVideo pageType='city' cityName={city.name} />

        <div className='relative z-10 flex flex-col items-center justify-center h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30'>
              <MapPin className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>{city.country}</span>
            </div>
            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl'>
              {normalizeText(city.name)}
            </h1>
            <p className='text-lg sm:text-xl text-white/95 font-medium drop-shadow-lg max-w-2xl mx-auto'>
              {city.description || `Experience authentic ${city.name} with local hosts`}
            </p>
          </div>
        </div>

        <div className='absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-white/40 to-transparent z-[11] pointer-events-none' />
      </section>

      {/* Local Hosts Section - Right After Hero */}
      {isLoadingHosts ? (
        <section className='py-8 sm:py-12 bg-gradient-to-br from-purple-50 to-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-8'>
              <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-3'>
                Meet Your Local Hosts
              </h2>
              <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
                Connect with verified hosts who know {normalizeText(city.name)} best
              </p>
            </div>
            <div className='flex justify-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
            </div>
          </div>
        </section>
      ) : hosts.length > 0 ? (
        <section className='py-8 sm:py-12 bg-gradient-to-br from-purple-50 to-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-8'>
              <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-3'>
                Meet Your Local Hosts
              </h2>
              <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
                Connect with verified hosts who know {normalizeText(city.name)} best
              </p>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
              {hosts.map((host) => (
                <div
                  key={host.id}
                  onClick={() => {
                    console.log('[BookingPageTemplate] Navigating to host:', host.email);
                    navigate(createPageUrl(`HostProfile?email=${encodeURIComponent(host.email)}`));
                  }}
                  className='flex flex-col items-center gap-3 p-4 bg-white rounded-xl hover:bg-purple-50 transition-all cursor-pointer group border border-purple-100 hover:border-purple-300 hover:shadow-lg'
                >
                  {host.profile_photo ? (
                    <img
                      src={host.profile_photo}
                      alt={getUserDisplayName(host)}
                      className='w-20 h-20 rounded-full object-cover border-2 border-purple-200 group-hover:border-purple-400 transition-colors'
                    />
                  ) : (
                    <div className='w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl border-2 border-purple-200 group-hover:border-purple-400'>
                      {getUserDisplayName(host).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className='text-center'>
                    <p className='font-semibold text-sm text-gray-900 truncate w-full'>
                      {getUserDisplayName(host)}
                    </p>
                    {host.rating && (
                      <div className='flex items-center justify-center gap-1 text-xs text-amber-600 mt-1'>
                        <Star className='w-3 h-3 fill-current' />
                        {host.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Main Content */}
      <section className='py-8 sm:py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Left: Booking Form */}
            <div className='lg:col-span-2 space-y-6'>
              <SimpleBookingForm city={city} />

              {/* Gallery */}
              {cityData?.gallery_images && cityData.gallery_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <ImageIcon className='w-5 h-5 text-purple-600' />
                      Explore {normalizeText(city.name)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                      {cityData.gallery_images.slice(0, 6).map((img, idx) => (
                        <div key={idx} className='aspect-video rounded-lg overflow-hidden'>
                          <img
                            src={img}
                            alt={`${city.name} ${idx + 1}`}
                            className='w-full h-full object-cover hover:scale-110 transition-transform duration-300'
                            loading='lazy'
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: City Info & Events */}
            <div className='space-y-6'>
              {/* City Quick Info */}
              <Card className='bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Info className='w-5 h-5 text-purple-600' />
                    About {normalizeText(city.name)}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {city.best_time_to_visit && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='font-medium'>Best Time to Visit</p>
                        <p className='text-gray-600'>{city.best_time_to_visit}</p>
                      </div>
                    </div>
                  )}
                  {city.languages && city.languages.length > 0 && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Globe className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='font-medium'>Languages</p>
                        <p className='text-gray-600'>{city.languages.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  {city.currency && (
                    <div className='flex items-center gap-2 text-sm'>
                      <DollarSign className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='font-medium'>Currency</p>
                        <p className='text-gray-600'>{city.currency}</p>
                      </div>
                    </div>
                  )}
                  {hosts.length > 0 && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Users className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='font-medium'>Local Hosts</p>
                        <p className='text-gray-600'>{hosts.length}+ verified hosts</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* City Highlights */}
              {city.highlights && city.highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <Sparkles className='w-5 h-5 text-purple-600' />
                      Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2'>
                      {city.highlights.slice(0, 6).map((highlight, idx) => (
                        <Badge
                          key={idx}
                          variant='outline'
                          className='bg-purple-50 border-purple-200 text-purple-800'
                        >
                          {normalizeText(highlight)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Events */}
              {events.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <Calendar className='w-5 h-5 text-purple-600' />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
