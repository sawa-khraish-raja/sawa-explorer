import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2,
  MapPin,
  Star,
  Calendar,
  Users,
  Image as ImageIcon,
  CheckCircle,
  Search,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { createPageUrl } from '@/utils';
import { queryDocuments, getAllDocuments, addDocument } from '@/utils/firestore';

import PageHeroVideo from "@/shared/components/PageHeroVideo";
import { UseAppContext } from "@/shared/context/AppContext";
import { useTranslation } from '@/shared/i18n/LanguageContext';
import { showSuccess, showError } from '@/shared/utils/notifications';

import BookingForm from './BookingForm';
import CityGallery from './CityGallery';
import EventList from './EventList';

const HostCard = ({ host, navigate, createPageUrl }) => {
  const getFirstName = (fullName) => {
    if (!fullName) return 'Host';
    return fullName.split(' ')[0];
  };

  const handleClick = () => {
    //  FIXED: Pass email as query parameter
    const targetUrl = `${createPageUrl('HostProfile')}?email=${encodeURIComponent(host.email)}`;
    console.log('Navigating to:', targetUrl, 'Host:', host);
    navigate(targetUrl);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className='flex flex-col items-center cursor-pointer group'
    >
      <div className='relative mb-3'>
        <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 border-white shadow-lg group-hover:shadow-2xl transition-all duration-300 ring-2 ring-purple-100 group-hover:ring-4 group-hover:ring-[#9933CC]'>
          {host.profile_photo ? (
            <img
              src={host.profile_photo}
              alt={host.display_name || host.full_name}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center'>
              <Users className='w-10 h-10 text-white' />
            </div>
          )}
        </div>
        <div className='absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md'>
          <CheckCircle className='w-5 h-5 text-[#9933CC]' />
        </div>
      </div>

      <h3 className='text-base font-bold text-gray-900 text-center group-hover:text-[#7B2CBF] transition-colors'>
        {getFirstName(host.display_name || host.full_name)}
      </h3>
      <p className='text-xs text-gray-500 mt-0.5'>Local Host</p>
    </motion.div>
  );
};

const AIPlannerLinkCard = ({ cityName, navigate, createPageUrl }) => {
  return (
    <Card className='bg-gradient-to-br from-[#330066] to-[#9933CC] border-0 shadow-2xl overflow-hidden relative mt-16'>
      <div className='absolute inset-0 overflow-hidden opacity-10'>
        <div className='absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl' />
        <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl' />
      </div>

      <CardContent className='relative z-10 p-8 sm:p-12 text-center'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6'>
          <Sparkles className='w-8 h-8 text-white' />
        </div>

        <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4'>
          Plan Your Perfect Trip to {cityName}
        </h2>

        <p className='text-lg text-white/90 mb-8 max-w-2xl mx-auto'>
          Let our AI travel planner create a personalized itinerary just for you in seconds
        </p>

        <Button
          onClick={() => navigate(createPageUrl('AITripPlanner'))}
          size='lg'
          className='bg-white text-[#330066] hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full px-8 py-6 text-lg font-bold'
        >
          Start Planning with AI
        </Button>
      </CardContent>
    </Card>
  );
};

export default function BookingCity({ cityName }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const { user } = UseAppContext();
  const [eventFilters, setEventFilters] = useState({
    featured: false,
    category: 'All',
    priceRange: null,
  });

  const [searchParams, setSearchParams] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromSearch = urlParams.get('fromSearch');

    if (fromSearch === 'true') {
      setSearchParams({
        startDate: urlParams.get('start') || '',
        endDate: urlParams.get('end') || '',
        adults: parseInt(urlParams.get('adults')) || 1,
        children: parseInt(urlParams.get('children')) || 0,
        fromSearch: true,
      });
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (cityName) document.title = `${cityName} | SAWA`;

    if (searchParams?.fromSearch) {
      setTimeout(() => {
        const bookingSection = document.getElementById('booking-form');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 800);
    } else if (window.location.hash === '#booking-form') {
      const bookingSection = document.getElementById('booking-form');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [cityName, searchParams]);

  const { data: city, isLoading: cityLoading } = useQuery({
    queryKey: ['city', cityName],
    queryFn: async () => {
      if (!cityName) return null;
      // Use Firestore to query cities by name
      const { queryDocuments } = await import('@/utils/firestore');
      const cities = await queryDocuments('cities', [['name', '==', cityName]]);
      return cities[0] || null;
    },
    enabled: !!cityName,
    staleTime: 15 * 60 * 1000,
  });

  const {
    data: hosts = [],
    isLoading: areHostsLoading,
    error: hostsError,
  } = useQuery({
    queryKey: ['cityHosts', cityName],
    queryFn: async () => {
      if (!cityName) return [];

      try {
        // Get all users who are approved hosts and visible in this city
        const allUsers = await getAllDocuments('users');
        const cityHosts = allUsers.filter(
          (u) => u.host_approved === true && u.visible_in_city === true && u.city === cityName
        );

        return cityHosts;
      } catch (error) {
        console.error('Error fetching hosts:', error);
        return [];
      }
    },
    enabled: !!cityName,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const { data: cityEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['cityEvents', cityName],
    queryFn: async () => {
      if (!cityName) return [];
      const allEvents = await queryDocuments('events', [['city', '==', cityName]]);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const upcomingEvents = allEvents.filter((event) => {
        const eventDate = new Date(event.start_datetime);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
      });

      upcomingEvents.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

      return upcomingEvents;
    },
    enabled: !!cityName,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const bookingId = await addDocument('bookings', {
        user_id: user.uid,
        traveler_email: user.email,
        city: bookingData.city,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        number_of_adults: bookingData.number_of_adults,
        number_of_children: bookingData.number_of_children,
        selected_services: bookingData.selected_services,
        service_durations: bookingData.service_durations,
        notes: bookingData.notes,
        state: 'open',
        status: 'pending',
        created_date: new Date().toISOString(),
      });

      // Note: Host notification would be handled by a Cloud Function trigger in production
      console.log('Booking created:', bookingId);

      return { id: bookingId, ...bookingData };
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });

      showSuccess(
        language === 'ar' ? 'تم إرسال طلب الحجز!' : 'Booking Request Sent!',
        language === 'ar'
          ? 'سيتم التواصل معك قريباً من قبل المضيفين'
          : 'Hosts will contact you soon with offers'
      );

      setTimeout(() => {
        navigate(createPageUrl('MyOffers'));
      }, 2000);
    },
    onError: (error) => {
      console.error('Booking creation failed:', error);
      showError(
        language === 'ar' ? 'فشل إنشاء الحجز' : 'Booking Failed',
        language === 'ar'
          ? 'حدث خطأ أثناء إنشاء الحجز. يرجى المحاولة مرة أخرى.'
          : 'An error occurred while creating the booking. Please try again.'
      );
    },
  });

  const handleBookingSubmit = async (bookingData) => {
    if (!user) {
      showError(
        language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        language === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please log in to continue'
      );
      navigate('/login');
      return;
    }

    createBookingMutation.mutate(bookingData);
  };

  if (cityLoading || areHostsLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-[#9933CC] mx-auto mb-4' />
          <p className='text-gray-600 text-lg'>Loading {cityName}...</p>
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6'>
        <Card className='max-w-md w-full'>
          <CardContent className='pt-8 text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>City Not Found</h2>
            <p className='text-gray-600 mb-6'>We couldn't find information for {cityName}.</p>
            <Button onClick={() => navigate(createPageUrl('Home'))}>Return to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      {/*  HERO SECTION - Using Unified PageHeroVideo */}
      <section className='relative h-[60vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden'>
        <div className='absolute inset-0'>
          {/*  Use PageHeroVideo with city-specific videos */}
          <PageHeroVideo pageType='city' cityName={cityName} />
        </div>

        {/* Hero Content */}
        <div className='relative z-10 h-full flex flex-col justify-end pb-16 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-7xl mx-auto w-full'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className='flex items-center gap-2 mb-4'>
                <MapPin className='w-6 h-6 text-white' />
                <span className='text-xl text-white/90'>{city.country}</span>
              </div>

              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl'>
                {cityName}
              </h1>

              {city.description && (
                <p className='text-xl sm:text-2xl text-white/90 max-w-3xl mb-8 drop-shadow-lg'>
                  {city.description}
                </p>
              )}

              <Button
                onClick={() =>
                  document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })
                }
                size='lg'
                className='bg-white text-[#330066] hover:bg-gray-100 shadow-2xl px-8 py-6 text-lg font-bold rounded-full'
              >
                Start Planning Your Trip
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-[2]' />
      </section>

      {/* ✨ MAIN CONTENT */}
      <div className='bg-white py-12 sm:py-16 lg:py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Search Info Badge */}
          {searchParams?.fromSearch && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className='mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-4 flex items-center gap-3'
            >
              <div className='w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md'>
                <Search className='w-6 h-6 text-purple-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-purple-900 text-sm sm:text-base'>
                  {language === 'ar'
                    ? '✨ معلومات البحث معبأة تلقائياً'
                    : '✨ Search Data Pre-filled'}
                </h3>
                <p className='text-xs sm:text-sm text-purple-700'>
                  {language === 'ar'
                    ? 'يمكنك تعديل التواريخ والضيوف أدناه'
                    : 'You can modify dates and guests below'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ✨ HOSTS SECTION */}
          {areHostsLoading ? (
            <div className='flex justify-center py-16 mb-16'>
              <div className='text-center'>
                <Loader2 className='w-10 h-10 animate-spin text-[#9933CC] mx-auto mb-4' />
                <p className='text-sm text-gray-600'>Loading local hosts...</p>
              </div>
            </div>
          ) : hosts.length > 0 ? (
            <section className='mb-16'>
              <div className='mb-8'>
                <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2'>
                  {language === 'ar'
                    ? `مضيفونا في ${cityName}`
                    : `Meet Your Local Hosts in ${cityName}`}
                </h2>
                <p className='text-base sm:text-lg text-gray-600'>
                  {language === 'ar'
                    ? 'خبراء محليون معتمدون لمساعدتك في رحلتك'
                    : 'Verified local experts ready to help you explore'}
                </p>
              </div>

              <div className='grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6'>
                {hosts.map((host) => (
                  <HostCard
                    key={host.id}
                    host={host}
                    navigate={navigate}
                    createPageUrl={createPageUrl}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className='text-center py-16 mb-16'>
              <div className='w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-6'>
                <Users className='w-12 h-12 text-[#9933CC]' />
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                {language === 'ar' ? 'لا يوجد مضيفون حالياً' : 'No Hosts Available Yet'}
              </h3>
              <p className='text-gray-600'>
                {language === 'ar'
                  ? 'نعمل على إضافة مضيفين جدد في هذه المدينة قريباً'
                  : 'We are working on adding new hosts in this city soon'}
              </p>
            </div>
          )}

          {/* ✨ BOOKING FORM */}
          <section id='booking-form' className='mb-16 scroll-mt-24'>
            <Card className='border-2 border-gray-100 shadow-xl overflow-hidden'>
              <CardHeader className='bg-gradient-to-r from-purple-50 to-white border-b border-gray-100 p-6 sm:p-8'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 bg-gradient-to-br from-[#9933CC] to-[#330066] rounded-xl flex items-center justify-center'>
                    <Calendar className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl sm:text-3xl font-bold text-gray-900'>
                      {language === 'ar' ? 'احجز رحلتك' : 'Book Your Experience'}
                    </CardTitle>
                    <p className='text-sm text-gray-600 mt-1'>
                      {language === 'ar'
                        ? 'املأ التفاصيل وسنوصلك بأفضل المضيفين'
                        : "Fill in details and we'll connect you with the best hosts"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='p-6 sm:p-8'>
                <BookingForm
                  cityName={cityName}
                  onSubmit={handleBookingSubmit}
                  isLoading={createBookingMutation.isPending}
                  initialData={searchParams}
                />
              </CardContent>
            </Card>
          </section>

          {/* ✨ CITY HIGHLIGHTS */}
          {city?.highlights && city.highlights.length > 0 && (
            <section className='mb-16'>
              <Card className='border-0 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50'>
                <CardHeader className='pb-4'>
                  <div className='flex items-center gap-3'>
                    <Star className='w-7 h-7 text-[#9933CC]' />
                    <CardTitle className='text-2xl sm:text-3xl font-bold text-gray-900'>
                      {language === 'ar' ? 'أبرز المعالم' : 'Highlights'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {city.highlights.map((highlight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className='flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow'
                      >
                        <CheckCircle className='w-5 h-5 text-[#9933CC] flex-shrink-0 mt-0.5' />
                        <span className='text-sm sm:text-base text-gray-700 font-medium'>
                          {highlight}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ✨ GALLERY */}
          {city?.gallery_images && city.gallery_images.length > 0 && (
            <section className='mb-16'>
              <div className='mb-8'>
                <div className='flex items-center gap-3 mb-2'>
                  <ImageIcon className='w-7 h-7 text-[#9933CC]' />
                  <h2 className='text-2xl sm:text-3xl font-bold text-gray-900'>
                    {language === 'ar' ? 'معرض الصور' : 'Gallery'}
                  </h2>
                </div>
                <p className='text-gray-600'>
                  {language === 'ar' ? 'استكشف جمال المدينة' : 'Explore the beauty of the city'}
                </p>
              </div>
              <CityGallery images={city.gallery_images} cityName={cityName} />
            </section>
          )}

          {/* ✨ EVENTS */}
          <section className='mb-16'>
            <div className='mb-8'>
              <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2'>
                {language === 'ar'
                  ? `الفعاليات القادمة في ${cityName}`
                  : `Upcoming Events in ${cityName}`}
              </h2>
              <p className='text-gray-600'>
                {language === 'ar'
                  ? 'اكتشف أفضل الفعاليات والتجارب المحلية'
                  : 'Discover the best local events and experiences'}
              </p>
            </div>

            <EventList
              city={cityName}
              events={cityEvents}
              isLoading={eventsLoading}
              filters={eventFilters}
            />
          </section>

          {/* ✨ AI PLANNER CTA */}
          <AIPlannerLinkCard
            cityName={cityName}
            navigate={navigate}
            createPageUrl={createPageUrl}
          />
        </div>
      </div>
    </div>
  );
}
