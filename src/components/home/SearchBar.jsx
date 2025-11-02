import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllDocuments } from '@/utils/firestore';
import { createPageUrl } from '@/utils';
import { Users, MapPin, Search, Loader2, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/components/i18n/LanguageContext';
import SimpleDatePicker from '../booking/SimpleDatePicker';
import GuestSelector from '../booking/GuestSelector';
import { showError } from '../utils/notifications';

export default function SearchBar() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const scrollPositionRef = useRef(0);

  //  Cache cities query (using Firestore)
  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ['activeCities'],
    queryFn: async () => {
      // Get all cities from Firestore (no complex query to avoid index requirement)
      const allCities = await getAllDocuments('cities');

      // Filter for active cities
      const activeCities = (Array.isArray(allCities) ? allCities : []).filter(
        (city) =>
          city &&
          typeof city === 'object' &&
          city.name &&
          typeof city.name === 'string' &&
          city.id &&
          city.is_active === true
      );

      // Remove duplicates by name
      const uniqueCities = activeCities.reduce((acc, city) => {
        if (!acc.some((existingCity) => existingCity.name === city.name)) {
          acc.push(city);
        }
        return acc;
      }, []);

      // Sort by name in JavaScript
      uniqueCities.sort((a, b) => a.name.localeCompare(b.name));

      return uniqueCities;
    },
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  //  Validate search data
  const validateSearch = () => {
    const errors = [];

    if (!destination) {
      errors.push(language === 'ar' ? 'يرجى اختيار الوجهة' : 'Please select a destination');
    }

    if (!checkIn) {
      errors.push(language === 'ar' ? 'يرجى اختيار تاريخ الوصول' : 'Please select check-in date');
    }

    if (!checkOut) {
      errors.push(
        language === 'ar' ? 'يرجى اختيار تاريخ المغادرة' : 'Please select check-out date'
      );
    }

    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);

      if (end <= start) {
        errors.push(
          language === 'ar'
            ? 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول'
            : 'Check-out must be after check-in'
        );
      }
    }

    if (adults < 1) {
      errors.push(
        language === 'ar' ? 'يجب أن يكون هناك بالغ واحد على الأقل' : 'At least 1 adult is required'
      );
    }

    return errors;
  };

  //  Handle search submission
  const handleSearch = async () => {
    console.log('🔍 handleSearch called!', { destination, checkIn, checkOut });

    const errors = validateSearch();
    console.log('✅ Validation errors:', errors);

    if (errors.length > 0) {
      showError(language === 'ar' ? 'خطأ في البحث' : 'Search Error', errors[0]);
      return;
    }

    const city = cities.find((c) => c.name === destination);
    console.log('🏙️ Found city:', city);

    if (!city) {
      console.log('❌ City not found!');
      return;
    }

    // Create page name for routing - format: "BookingCityName"
    // If city has page_slug, use it; otherwise create from city name
    const pageName = city.page_slug || `Booking${city.name.replace(/\s+/g, '')}`;
    console.log('📍 Using page name:', pageName);

    //  Save to recent searches
    saveToRecentSearches({
      destination,
      checkIn,
      checkOut,
      adults,
      children,
      timestamp: Date.now(),
    });

    setIsSearching(true);

    //  Build URL with all params
    const params = new URLSearchParams();
    params.append('start', checkIn);
    params.append('end', checkOut);
    params.append('adults', adults.toString());
    params.append('children', children.toString());
    params.append('fromSearch', 'true');

    const url = createPageUrl(pageName);

    //  Small delay for UX
    setTimeout(() => {
      navigate(`${url}?${params.toString()}`);
      setIsOpen(false);
      setIsSearching(false);
    }, 500);
  };

  //  Recent searches management
  const saveToRecentSearches = (search) => {
    try {
      const recent = JSON.parse(localStorage.getItem('sawa_recent_searches') || '[]');
      const updated = [search, ...recent.filter((s) => s.destination !== search.destination)].slice(
        0,
        5
      );
      localStorage.setItem('sawa_recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  };

  const getRecentSearches = () => {
    try {
      return JSON.parse(localStorage.getItem('sawa_recent_searches') || '[]');
    } catch {
      return [];
    }
  };

  //  Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPositionRef.current);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  //  Get search summary
  const getSearchSummary = () => {
    const parts = [];
    if (destination) parts.push(destination);
    if (checkIn)
      parts.push(
        `${new Date(checkIn).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`
      );
    if (checkOut)
      parts.push(
        `${new Date(checkOut).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`
      );

    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const searchSummary = getSearchSummary();
  const recentSearches = getRecentSearches();

  return (
    <>
      {/*  Search Trigger Button */}
      <div className='w-full max-w-3xl mx-auto px-4 sm:px-6'>
        <button
          onClick={() => setIsOpen(true)}
          className='w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-4 py-3 sm:px-5 sm:py-3.5 hover:shadow-3xl transition-all duration-300 flex items-center justify-between group border border-gray-200/50'
        >
          <div className='flex-1 text-left min-w-0'>
            {searchSummary ? (
              <p className='text-sm sm:text-base font-semibold text-gray-900 truncate'>
                {searchSummary}
              </p>
            ) : (
              <div className='flex flex-col'>
                <p className='text-base sm:text-lg font-bold text-gray-900'>
                  {language === 'ar' ? 'اكتشف الشرق الأوسط' : 'Discover the Middle East'}
                </p>
                <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>
                  {language === 'ar'
                    ? 'رحلات أصيلة مع مضيفين محليين'
                    : 'Authentic travel with local hosts'}
                </p>
              </div>
            )}
          </div>
          <div className='ml-3 bg-gradient-to-r from-[#9933CC] to-[#330066] text-white rounded-xl p-2.5 sm:p-3 group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg'>
            <Search className='w-5 h-5 sm:w-6 sm:h-6' />
          </div>
        </button>
      </div>

      {/*  Full Screen Search Modal */}
      {isOpen && (
        <div
          className='fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm'
          onClick={() => !isSearching && setIsOpen(false)}
        >
          <div
            className='fixed inset-0 bg-white overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            {/*  Header */}
            <div className='sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10 safe-area-top'>
              <button
                onClick={() => !isSearching && setIsOpen(false)}
                disabled={isSearching}
                className='w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50'
              >
                <X className='w-5 h-5 text-gray-900' />
              </button>
              <h2 className='text-lg font-bold text-gray-900 flex-1'>{t('search.where')}</h2>
            </div>

            <div className='p-4 space-y-5 pb-32'>
              {/*  Recent Searches */}
              {recentSearches.length > 0 && !destination && (
                <div>
                  <h3 className='text-sm font-bold text-gray-900 mb-3'>
                    {language === 'ar' ? 'عمليات بحث سابقة' : 'Recent Searches'}
                  </h3>
                  <div className='space-y-2'>
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setDestination(search.destination);
                          setCheckIn(search.checkIn);
                          setCheckOut(search.checkOut);
                          setAdults(search.adults);
                          setChildren(search.children);
                        }}
                        className='w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 text-left transition-colors'
                      >
                        <div className='flex items-center gap-2'>
                          <Search className='w-4 h-4 text-purple-600' />
                          <span className='font-semibold text-gray-900'>{search.destination}</span>
                          <span className='text-sm text-gray-600'>
                            •{' '}
                            {new Date(search.checkIn).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            -
                            {new Date(search.checkOut).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/*  Destination */}
              <div>
                <label
                  htmlFor='destination-select'
                  className='block text-sm font-bold text-gray-900 mb-2'
                >
                  {t('search.where')}
                  {cities.length > 0 && (
                    <span className='ml-2 text-xs font-normal text-gray-500'>
                      ({cities.length} cities available)
                    </span>
                  )}
                </label>

                {/* Debug info */}
                {cities.length === 0 && !isLoadingCities && (
                  <div className='mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800'>
                    ⚠️ No cities found. Please go to DevTools and click "Seed Cities" to add cities
                    to the database.
                  </div>
                )}

                <Select
                  value={destination}
                  onValueChange={(value) => {
                    console.log('🎯 Selected city:', value);
                    setDestination(value);
                  }}
                  disabled={isLoadingCities || isSearching}
                >
                  <SelectTrigger
                    id='destination-select'
                    className='h-12 text-base border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl'
                  >
                    <SelectValue
                      placeholder={
                        isLoadingCities
                          ? t('common.loading')
                          : cities.length === 0
                            ? 'No cities available - Seed cities first'
                            : t('search.destination_placeholder')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className='max-h-[300px]'>
                    {cities.length === 0 ? (
                      <div className='p-4 text-center text-sm text-gray-500'>
                        No cities available
                      </div>
                    ) : (
                      cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          <div className='flex items-center gap-2'>
                            <MapPin className='w-4 h-4 text-gray-500' />
                            <span className='font-semibold'>{city.name}</span>
                            {city.country && (
                              <span className='text-sm text-gray-500'>• {city.country}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/*  Dates */}
              <div className='space-y-4'>
                <SimpleDatePicker
                  label={t('search.checkin')}
                  value={checkIn}
                  onChange={(date) => {
                    console.log('📅 Check-in date selected:', date);
                    setCheckIn(date);
                  }}
                  minDate={today}
                  placeholder={t('search.add_date')}
                  required
                  disabled={isSearching}
                />
                <SimpleDatePicker
                  label={t('search.checkout')}
                  value={checkOut}
                  onChange={(date) => {
                    console.log('📅 Check-out date selected:', date);
                    setCheckOut(date);
                  }}
                  minDate={checkIn || today}
                  placeholder={t('search.add_date')}
                  required
                  disabled={isSearching}
                />
              </div>

              {/*  Guests */}
              <div>
                <label className='block text-sm font-bold text-gray-900 mb-3'>
                  {t('search.who')}
                </label>
                <div className='border-2 border-gray-200 rounded-xl p-3 sm:p-4'>
                  <GuestSelector
                    adults={adults}
                    children={children}
                    onAdultsChange={setAdults}
                    onChildrenChange={setChildren}
                    language={language}
                  />
                </div>
              </div>
            </div>

            {/*  Bottom Action Bar */}
            <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between safe-area-bottom z-20 shadow-lg'>
              <button
                onClick={() => {
                  if (!isSearching) {
                    setDestination('');
                    setCheckIn('');
                    setCheckOut('');
                    setAdults(1);
                    setChildren(0);
                  }
                }}
                disabled={isSearching}
                className='text-sm font-semibold text-gray-600 hover:text-gray-900 underline disabled:opacity-50'
              >
                {t('search.clear_all')}
              </button>
              <Button
                onClick={handleSearch}
                disabled={!destination || !checkIn || !checkOut || isSearching}
                className='bg-gradient-to-r from-[#9933CC] to-[#330066] hover:from-[#7B2CBF] hover:to-[#1a0033] text-white rounded-xl px-8 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSearching ? (
                  <>
                    <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                    {language === 'ar' ? 'جارٍ البحث...' : 'Searching...'}
                  </>
                ) : (
                  <>
                    <Search className='w-5 h-5 mr-2' />
                    {t('search.search')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
