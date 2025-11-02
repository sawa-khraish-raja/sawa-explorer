/**
 * 🎯 Improved BookingCity Component
 * ==================================
 * Optimized, clean, professional version
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, MapPin, Info, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '../i18n/LanguageContext';
import { showSuccess, showError } from '../utils/notifications';
import PageHero from '../common/PageHero';
import CityGallery from './CityGallery';
import EventList from './EventList';
import BookingWizard from './BookingWizard';
import HostsCarousel from './HostsCarousel';
import CityHighlights from './CityHighlights';
import AIPlannerLinkCard from './AIPlannerLinkCard';

export default function ImprovedBookingCity({ cityName }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const [searchParams, setSearchParams] = useState(null);

  //  Optimized: Read URL params once
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

  //  Scroll management
  useEffect(() => {
    window.scrollTo(0, 0);
    if (cityName) document.title = `${cityName} | SAWA`;

    if (searchParams?.fromSearch) {
      setTimeout(() => {
        document.getElementById('booking-wizard')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 800);
    }
  }, [cityName, searchParams]);

  //  Current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    staleTime: 30 * 60 * 1000,
  });

  //  City data with proper caching
  const { data: city, isLoading: cityLoading } = useQuery({
    queryKey: ['city', cityName],
    queryFn: async () => {
      if (!cityName) return null;
      const res = await base44.entities.City.filter({
        name: cityName,
        is_active: true,
      });
      return res?.[0] || null;
    },
    enabled: !!cityName,
    staleTime: 30 * 60 * 1000, // City data rarely changes
  });

  //  FIXED: Direct query instead of function call
  const { data: hosts = [], isLoading: areHostsLoading } = useQuery({
    queryKey: ['cityHosts', cityName],
    queryFn: async () => {
      if (!cityName) return [];

      try {
        // Direct query - much faster!
        const allUsers = await base44.entities.User.list();

        const cityHosts = allUsers.filter(
          (user) => user.host_approved && user.city === cityName && user.visible_in_city !== false
        );

        console.log(` Found ${cityHosts.length} hosts for ${cityName}`);
        return cityHosts;
      } catch (error) {
        console.error(' Error fetching hosts:', error);
        return [];
      }
    },
    enabled: !!cityName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  //  Events with better caching
  const { data: cityEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['cityEvents', cityName],
    queryFn: async () => {
      if (!cityName) return [];
      const allEvents = await base44.entities.Event.filter({ city: cityName });

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      return allEvents
        .filter((event) => new Date(event.start_datetime) >= now)
        .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    },
    enabled: !!cityName,
    staleTime: 10 * 60 * 1000,
  });

  //  Booking submission
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      return await base44.entities.Booking.create({
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
      });
    },
    onSuccess: async (booking) => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });

      // Notify hosts
      try {
        await base44.functions.invoke('notifyHostsOfNewBooking', {
          bookingId: booking.id,
        });
      } catch (error) {
        console.error('⚠️ Failed to notify hosts:', error);
      }

      showSuccess(
        language === 'ar' ? 'تم إرسال طلب الحجز!' : 'Booking Request Sent!',
        language === 'ar'
          ? 'سيتم التواصل معك قريباً من قبل المضيفين'
          : 'Hosts will contact you soon with offers'
      );

      setTimeout(() => navigate(createPageUrl('MyOffers')), 2000);
    },
    onError: (error) => {
      showError(language === 'ar' ? 'فشل إنشاء الحجز' : 'Booking Failed', error.message);
    },
  });

  const handleBookingSubmit = async (bookingData) => {
    if (!user) {
      showError(
        language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        language === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please log in to continue'
      );
      base44.auth.redirectToLogin();
      return;
    }

    createBookingMutation.mutate(bookingData);
  };

  //  Loading state
  if (cityLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white'>
        <Loader2 className='w-12 h-12 animate-spin text-[#7B2CBF]' />
      </div>
    );
  }

  //  Not found
  if (!city) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center p-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>City Not Found</h2>
        <Button
          onClick={() => navigate(createPageUrl('Home'))}
          className='bg-[#7B2CBF] hover:bg-[#6A1FA0]'
        >
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <>
      {/*  Hero Section */}
      <PageHero
        title={city.name}
        subtitle={city.description?.substring(0, 150)}
        backgroundImage={city.cover_image}
        badge={{
          icon: <MapPin className='w-4 h-4' />,
          text: city.country || 'Middle East',
        }}
      />

      <div className='bg-gradient-to-br from-gray-50 to-white py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16'>
          {/*  Search Banner (if from search) */}
          {searchParams?.fromSearch && (
            <div className='bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-4 flex items-center gap-3'>
              <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center'>
                <Info className='w-5 h-5 text-purple-600' />
              </div>
              <div>
                <h3 className='font-bold text-purple-900 text-sm'>
                  {language === 'ar'
                    ? '✨ معلومات البحث معبية تلقائياً'
                    : '✨ Search Data Pre-filled'}
                </h3>
                <p className='text-xs text-purple-700'>
                  {language === 'ar' ? 'يمكنك تعديل التواريخ أدناه' : 'You can modify dates below'}
                </p>
              </div>
            </div>
          )}

          {/*  Hosts Carousel */}
          {hosts.length > 0 && (
            <section>
              <div className='text-center mb-8'>
                <h2 className='text-3xl font-bold text-gray-900 mb-2'>
                  {language === 'ar' ? `مضيفونا في ${cityName}` : `Meet Your Local Hosts`}
                </h2>
                <p className='text-gray-600'>
                  {language === 'ar'
                    ? 'خبراء محليون معتمدون'
                    : 'Verified local experts ready to help'}
                </p>
              </div>
              <HostsCarousel hosts={hosts} />
            </section>
          )}

          {/*  Booking Wizard */}
          <section id='booking-wizard'>
            <BookingWizard
              cityName={cityName}
              onSubmit={handleBookingSubmit}
              isLoading={createBookingMutation.isPending}
              initialData={searchParams}
            />
          </section>

          {/*  City Highlights */}
          {city.highlights && city.highlights.length > 0 && (
            <CityHighlights highlights={city.highlights} cityName={cityName} />
          )}

          {/*  Gallery */}
          {city.gallery_images && city.gallery_images.length > 0 && (
            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-8'>
                {language === 'ar' ? 'معرض الصور' : 'Gallery'}
              </h2>
              <CityGallery images={city.gallery_images} cityName={cityName} />
            </section>
          )}

          {/*  Events */}
          {cityEvents.length > 0 && (
            <section>
              <div className='text-center mb-8'>
                <h2 className='text-3xl font-bold text-gray-900 mb-3'>
                  {language === 'ar' ? 'الفعاليات القادمة' : 'Upcoming Events'}
                </h2>
                <p className='text-gray-600'>
                  {language === 'ar'
                    ? 'أفضل الفعاليات المحلية'
                    : 'Best local events and experiences'}
                </p>
              </div>
              <EventList city={cityName} events={cityEvents} isLoading={eventsLoading} />
            </section>
          )}

          {/*  AI Planner CTA */}
          <AIPlannerLinkCard
            cityName={cityName}
            navigate={navigate}
            createPageUrl={createPageUrl}
          />
        </div>
      </div>
    </>
  );
}
