import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Loader2,
  Check,
  X,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  MessageSquare,
  Users,
  User,
  Package,
  FileText,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  List,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Compass,
  MapPin,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/utils';
import { createPageUrl } from '@/utils';
import { updateDocument, getDocument, queryDocuments, getAllDocuments } from '@/utils/firestore';

import BookingDetailsModal from '@/features/shared/booking-components/BookingDetailsModal';
import BookingFilters from '@/features/shared/booking-components/BookingFilters';
import BookingServicesDisplay from '@/features/shared/booking-components/BookingServicesDisplay';
import BookingStats from '@/features/shared/booking-components/BookingStats';
import CancelBookingDialog from '@/features/shared/booking-components/CancelBookingDialog';
import { BookingID } from '@/shared/components/BookingID';
import PageHeroVideo from '@/shared/components/PageHeroVideo';
import { UseAppContext } from '@/shared/context/AppContext';
import { useTranslation } from '@/shared/i18n/LanguageContext';
import { showSuccess, showError, showInfo } from '@/shared/utils/notifications';
import { normalizeText } from '@/shared/utils/textHelpers';
import { getUserDisplayName } from '@/shared/utils/userHelpers';

export default function MyOffers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Cancel booking state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  // Only one modal open at a time
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    search: '',
    sortBy: 'newest',
  });

  const { user, userLoading: isLoadingUser } = UseAppContext();

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['travelerBookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const allBookings = await queryDocuments('bookings', [['user_id', '==', user.id]]);

        return allBookings.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: allOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['myOffers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      // Query offers where user is the traveler
      const offers = await queryDocuments('offers', [['traveler_email', '==', user.email]]);

      return offers.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: allHosts = [] } = useQuery({
    queryKey: ['allHosts'],
    queryFn: async () => {
      const users = await getAllDocuments('users');
      return users.filter((u) => u.host_approved);
    },
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  const { data: adventureConversations = [] } = useQuery({
    queryKey: ['myAdventureConversations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        // Query conversations collection (not chats) for adventure conversations
        const allConvos = await queryDocuments('conversations', [
          ['traveler_email', '==', user.email],
        ]);
        return allConvos;
      } catch (error) {
        console.warn(' Could not fetch adventure conversations:', error.message);
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  // Apply Filters and Sorting
  const filteredAndSortedBookings = useMemo(() => {
    let result = [...bookings];

    // Apply status filter
    if (filters.status) {
      if (filters.status === 'review_offers') {
        result = result.filter((b) =>
          allOffers.some((o) => o.booking_id === b.id && o.status === 'pending')
        );
      } else {
        result = result.filter((b) => b.status === filters.status);
      }
    }

    // Apply city filter
    if (filters.city) {
      result = result.filter((b) => b.city?.toLowerCase().includes(filters.city.toLowerCase()));
    }

    // Apply search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.city?.toLowerCase().includes(searchLower) ||
          b.id?.toLowerCase().includes(searchLower) ||
          b.notes?.toLowerCase().includes(searchLower) ||
          (b.adventure_id && b.adventure_id.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case 'date_asc':
        result.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        break;
      case 'date_desc':
        result.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        break;
      case 'price_high':
        result.sort((a, b) => (b.total_price || 0) - (a.total_price || 0));
        break;
      case 'price_low':
        result.sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return result;
  }, [bookings, filters, allOffers]);

  // Booking Counts for Filter Display
  const bookingCounts = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      rejected: bookings.filter((b) => b.status === 'rejected').length,
      review_offers: bookings.filter((b) =>
        allOffers.some((o) => o.booking_id === b.id && o.status === 'pending')
      ).length,
    }),
    [bookings, allOffers]
  );

  useEffect(() => {
    if (!isLoadingUser && !user) {
      showInfo(
        t('notifications.loginRequired.title') || 'Login Required',
        t('notifications.loginRequired.message') || 'Please log in to view your bookings'
      );
      navigate(createPageUrl('Home'));
    }
  }, [user, isLoadingUser, navigate, t]);

  // Simplified accept offer flow (using Firestore)
  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId) => {
      const offer = allOffers.find((o) => o.id === offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Update booking to confirmed status and set host_id

      try {
        await updateDocument('bookings', offer.booking_id, {
          status: 'confirmed',
          host_id: offer.host_id, // Set the host_id so host can read the booking
          host_email: offer.host_email,
          confirmed_at: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to update booking:', error);
        throw new Error(`Failed to update booking: ${error.message}`);
      }

      // Update offer to accepted status
      console.log('Updating offer:', offerId);
      try {
        await updateDocument('offers', offerId, {
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        });
        console.log(' Offer updated successfully');
      } catch (error) {
        console.error('Failed to update offer:', error);
        throw new Error(`Failed to update offer: ${error.message}`);
      }

      console.log(' Booking and offer confirmed successfully');

      return {
        ok: true,
        booking_id: offer.booking_id,
        offer_id: offerId,
      };
    },
    onSuccess: (data) => {
      console.log(' Offer accepted successfully:', data);
      queryClient.invalidateQueries({
        queryKey: ['travelerBookings', user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['travelerAdventureBookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['myOffers', user?.email] });

      showSuccess(
        '🎉 Booking Confirmed!',
        'Your booking has been confirmed successfully. Get ready for your amazing trip!'
      );

      setShowConfirmDialog(false);
      setSelectedOffer(null);
    },
    onError: (error) => {
      console.error(' Accept offer error:', error);
      showError(
        ' Failed to Accept Offer',
        error.message || 'Something went wrong. Please try again.'
      );
    },
  });

  // Simplified decline offer flow (using Firestore)
  const declineOfferMutation = useMutation({
    mutationFn: async (offerId) => {
      console.log(' Declining offer:', offerId);

      // Get the offer to find the booking and host
      const offer = allOffers.find((o) => o.id === offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Update the offer status
      await updateDocument('offers', offerId, {
        status: 'declined',
        declined_at: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      // Update the booking's host_responses to mark this host as declined
      const booking = await getDocument('bookings', offer.booking_id);
      if (booking) {
        const hostResponses = booking.host_responses || {};

        // Mark this specific host's offer as declined by traveler
        hostResponses[offer.host_email] = {
          ...hostResponses[offer.host_email],
          action: 'declined_by_traveler',
          declined_by_traveler_date: new Date().toISOString(),
          offer_id: offerId,
        };

        await updateDocument('bookings', offer.booking_id, {
          host_responses: hostResponses,
          updated_date: new Date().toISOString(),
        });
      }

      return offerId;
    },
    onSuccess: () => {
      console.log(' Offer declined successfully');
      queryClient.invalidateQueries({ queryKey: ['myOffers', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['travelerBookings', user?.id] });
      showInfo('ℹ️ Offer Declined', 'The offer has been declined.');
    },
    onError: (error) => {
      console.error(' Decline offer error:', error);
      showError(' Failed to Decline Offer', 'Could not decline the offer. Please try again.');
    },
  });

  //  UPDATED: Cancel Booking Mutation - Direct cancellation (using Firestore)
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason, reasonCategory }) => {
      // Get the current booking to check status and calculate refund
      const booking = await getDocument('bookings', bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      // Update booking with cancellation details
      await updateDocument('bookings', bookingId, {
        status: 'cancelled',
        cancellation_reason: reason,
        cancellation_category: reasonCategory,
        cancelled_at: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      // Calculate refund amount (simplified - you may want more complex logic)
      const refundAmount = booking.traveler_total_price || 0;

      return {
        ok: true,
        refundAmount,
        booking_id: bookingId,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['travelerBookings', user?.email],
      });
      queryClient.invalidateQueries({
        queryKey: ['travelerAdventureBookings', user?.email],
      });
      queryClient.invalidateQueries({ queryKey: ['myOffers', user?.email] });

      //  Always show success - no more pending approval
      const refundText =
        data.refundAmount > 0
          ? ` You will receive a refund of $${data.refundAmount?.toFixed(2)}.`
          : '';
      showSuccess(
        ' Booking Cancelled',
        `Your booking has been cancelled successfully.${refundText}`
      );

      setShowCancelDialog(false);
      setBookingToCancel(null);
    },
    onError: (error) => {
      console.error(' Cancel booking error:', error);
      showError(
        ' Cancellation Failed',
        error.message || 'Could not cancel the booking. Please try again.'
      );
    },
  });

  const isLoading = isLoadingUser || bookingsLoading || offersLoading;

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-purple-600 mx-auto mb-4' />
          <p className='text-gray-600 text-sm'>{t('common.loadingBookings')}</p>
        </div>
      </div>
    );
  }

  if (!isLoadingUser && !user) {
    return null;
  }

  // Separate pending offers for services
  const pendingOffers = allOffers.filter((o) => o.status === 'pending');

  const getHost = (hostEmail) => {
    const host = allHosts.find((h) => h.email === hostEmail);
    return host;
  };

  const getHostDisplayName = (hostEmail) => {
    const host = getHost(hostEmail);
    return getUserDisplayName(host);
  };

  // Get booking status styling
  const getBookingStatusConfig = (booking) => {
    const hasOffers = allOffers.some((o) => o.booking_id === booking.id);
    const hasPendingOffers = allOffers.some(
      (o) => o.booking_id === booking.id && o.status === 'pending'
    );

    if (booking.status === 'confirmed' || booking.state === 'confirmed') {
      return {
        label: t('bookingStatus.confirmed'),
        labelAr: 'مؤكد',
        icon: CheckCircle,
        bg: 'bg-green-50',
        border: 'border-green-200',
        textColor: 'text-green-700',
        iconColor: 'text-green-600',
      };
    }

    if (booking.status === 'cancelled' || booking.state === 'cancelled') {
      return {
        label: t('bookingStatus.cancelled'),
        labelAr: 'ملغي',
        icon: XCircle,
        bg: 'bg-red-50',
        border: 'border-red-200',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
      };
    }

    if (booking.status === 'completed' || booking.state === 'completed') {
      return {
        label: t('bookingStatus.completed'),
        labelAr: 'مكتمل',
        icon: CheckCircle2,
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-600',
      };
    }

    if (booking.status === 'rejected' || booking.state === 'rejected') {
      return {
        label: t('bookingStatus.rejected'),
        labelAr: 'مرفوض',
        icon: XCircle,
        bg: 'bg-red-50',
        border: 'border-red-200',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
      };
    }

    if (hasPendingOffers) {
      return {
        label: t('bookingStatus.reviewOffers'),
        labelAr: 'راجع العروض',
        icon: Clock,
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        textColor: 'text-orange-700',
        iconColor: 'text-orange-600',
      };
    }

    if (hasOffers) {
      return {
        label: t('bookingStatus.offersReceived'),
        labelAr: 'تم استلام عروض',
        icon: AlertTriangle,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
        iconColor: 'text-amber-600',
      };
    }

    return {
      label: t('bookingStatus.awaitingOffers'),
      labelAr: 'بانتظار العروض',
      icon: Clock,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
    };
  };

  // Close all modals before opening new one
  const handleBookingClick = (booking) => {
    // Close any open modals
    setShowConfirmDialog(false);
    setShowCancelDialog(false);

    // Open details modal
    setSelectedBookingForDetails(booking);
    setShowDetailsModal(true);
  };

  const handleCancelClick = (e, booking) => {
    e.stopPropagation();

    // Close any open modals
    setShowDetailsModal(false);
    setShowConfirmDialog(false);

    // Open cancel dialog
    setBookingToCancel(booking);
    setShowCancelDialog(true);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      city: '',
      search: '',
      sortBy: 'newest',
    });
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      {/* Hero Section - Optimized Height */}
      <section className='relative h-[40vh] sm:h-[45vh] lg:h-[50vh] overflow-hidden bg-black'>
        <PageHeroVideo pageType='my_trips' />

        <div className='relative z-10 flex flex-col items-center justify-center h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-white/30'>
              <Briefcase className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>
                {t('offers.yourBookings') || 'Your Bookings'}
              </span>
            </div>
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-2xl'>
              {t('offers.myTripsTitle') || 'My Trips'}
            </h1>
            <p className='text-base sm:text-lg text-white/95 font-medium drop-shadow-lg max-w-2xl mx-auto'>
              {t('offers.myTripsDescription') ||
                'Manage your bookings, view offers, and track your adventures'}
            </p>
          </div>
        </div>

        {/* Bottom Fade */}
        <div className='absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-white/40 to-transparent z-[11] pointer-events-none' />
      </section>

      {/* All Bookings Section - Proper Spacing */}
      <section className='py-8 sm:py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>

          {/* Filters */}
          {bookings.length > 0 && (
            <div className='mb-8'>
              <BookingFilters
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={handleClearFilters}
                bookingCounts={bookingCounts}
                allBookings={bookings}
              />
            </div>
          )}

          {/* Conditional rendering for no bookings vs. bookings */}
          {bookings.length === 0 ? (
            <Card className='text-center py-12'>
              <CardContent>
                <List className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Bookings Yet</h3>
                <p className='text-gray-500 mb-6'>
                  Start exploring destinations and create your first booking
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('Home'))}
                  className='bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white'
                >
                  <Compass className='w-4 h-4 mr-2' />
                  Explore Destinations
                </Button>
              </CardContent>
            </Card>
          ) : filteredAndSortedBookings.length === 0 ? (
            <Card className='text-center py-12'>
              <CardContent>
                <AlertCircle className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Results Found</h3>
                <p className='text-gray-500 mb-6'>Try adjusting your filters</p>
                <Button variant='outline' onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-8'>
              {/* All Bookings Grid */}
              <div>
                <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
                  <List className='w-6 h-6 text-purple-600' />
                  {filters.status || filters.city || filters.search ? 'Filtered' : 'All'} Bookings (
                  {filteredAndSortedBookings.length})
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {filteredAndSortedBookings.map((booking) => {
                    const statusConfig = getBookingStatusConfig(booking);
                    const StatusIcon = statusConfig.icon;
                    const isCancellable = ['pending', 'confirmed', 'accepted'].includes(
                      booking.status
                    );
                    const isAdventure = !!booking.adventure_id;
                    const hasConversation = adventureConversations.some(
                      (c) => c.booking_id === booking.id
                    );

                    return (
                      <Card
                        key={booking.id}
                        className={cn(
                          'cursor-pointer hover:shadow-lg transition-all overflow-hidden group flex flex-col',
                          'min-h-[200px]', // Fixed minimum height
                          isAdventure
                            ? 'bg-gradient-to-br from-purple-50 via-purple-100/50 to-pink-50 border-2 border-purple-300 hover:border-purple-400'
                            : `${statusConfig.bg} border-2 ${statusConfig.border}`
                        )}
                        onClick={() => handleBookingClick(booking)}
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-start justify-between gap-2'>
                            <div className='flex items-center gap-1.5 flex-wrap'>
                              <BookingID booking={booking} size='small' showCopy={false} t={t} />
                              {isAdventure ? (
                                <Badge className='bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] px-1.5 py-0.5 shadow-md'>
                                  <Sparkles className='w-2.5 h-2.5 mr-0.5' />
                                  Adventure
                                </Badge>
                              ) : (
                                <Badge className='bg-blue-500 text-white text-[10px] px-1.5 py-0.5'>
                                  <Briefcase className='w-2.5 h-2.5 mr-0.5' />
                                  Service
                                </Badge>
                              )}
                            </div>
                            <div
                              className={cn(
                                'flex items-center gap-1 px-2 py-0.5 rounded-full border whitespace-nowrap',
                                statusConfig.bg,
                                statusConfig.border
                              )}
                            >
                              <StatusIcon
                                className={cn('w-3 h-3 flex-shrink-0', statusConfig.iconColor)}
                              />
                              <span
                                className={cn('text-[10px] font-semibold', statusConfig.textColor)}
                              >
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                          <div className='mt-3 p-2 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg border border-purple-200'>
                            <h3
                              className={cn(
                                'font-bold text-lg truncate flex items-center gap-2',
                                isAdventure ? 'text-purple-900' : 'text-gray-900'
                              )}
                            >
                              <MapPin className='w-5 h-5 text-purple-600 flex-shrink-0' />
                              {normalizeText(booking.city || booking.city_name || 'Unknown')}
                            </h3>
                          </div>
                        </CardHeader>
                        <CardContent className='p-3 space-y-2 flex-1 flex flex-col'>
                          <div className='flex flex-wrap items-center gap-2 text-[10px] text-gray-600'>
                            <div className='flex items-center gap-1'>
                              <Calendar className='w-3 h-3 flex-shrink-0' />
                              <span className='truncate'>
                                {format(new Date(booking.start_date), 'MMM d')} -{' '}
                                {format(new Date(booking.end_date), 'MMM d')}
                              </span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Users className='w-3 h-3 flex-shrink-0' />
                              <span className='whitespace-nowrap'>
                                {booking.number_of_adults}{' '}
                                {t(
                                  booking.number_of_adults === 1 ? 'common.adult' : 'common.adults'
                                )}
                                {booking.number_of_children > 0 &&
                                  ` +${booking.number_of_children} ${t(
                                    booking.number_of_children === 1
                                      ? 'common.child'
                                      : 'common.children'
                                  )}`}
                              </span>
                            </div>
                          </div>

                          {booking.total_price && (
                            <div className='flex items-center justify-between pt-2 border-t border-gray-100 mt-auto'>
                              <span className='text-[10px] text-gray-500'>
                                {t('offers.totalPriceLabel')}:
                              </span>
                              <span
                                className={cn(
                                  'text-sm font-bold',
                                  isAdventure ? 'text-purple-600' : 'text-green-600'
                                )}
                              >
                                ${booking.total_price.toFixed(2)}
                              </span>
                            </div>
                          )}

                          <div className='flex flex-col gap-2 pt-2 border-t border-gray-100'>
                            {isCancellable && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => handleCancelClick(e, booking)}
                                className='w-full border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs'
                              >
                                <XCircle className='w-3 h-3 mr-1' />
                                {t('offers.cancelBookingButton')}
                              </Button>
                            )}

                            {isAdventure && hasConversation && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening booking details
                                  navigate(`${createPageUrl('Messages')}?bookingId=${booking.id}`);
                                }}
                                className='w-full border-blue-200 text-blue-600 hover:bg-blue-50 h-8 text-xs'
                              >
                                <MessageSquare className='w-3 h-3 mr-1' />
                                {t('offers.viewMessagesButton')}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              {t('offers.confirmBookingDialog.title')}
            </DialogTitle>
            <DialogDescription className='text-base'>
              {t('offers.confirmBookingDialog.reviewOfferDetails')}
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <div className='py-4 space-y-4'>
              {/* Price */}
              <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>
                    {t('offers.confirmBookingDialog.totalPrice')}:
                  </span>
                  <span className='text-2xl font-bold text-green-700'>
                    ${(selectedOffer.price_total || selectedOffer.price)?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* What's Included */}
              {selectedOffer.inclusions && (
                <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                  <p className='text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <Package className='w-4 h-4' />
                    {t('offers.confirmBookingDialog.whatIsIncludedTitle')}:
                  </p>
                  <p className='text-sm text-gray-700'>{normalizeText(selectedOffer.inclusions)}</p>
                </div>
              )}

              {/* Expiry Warning */}
              {selectedOffer.expiry_date && (
                <div className='flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-3 rounded-lg'>
                  <Clock className='w-4 h-4' />
                  {t('offers.confirmBookingDialog.offerExpiresOn')}{' '}
                  {format(new Date(selectedOffer.expiry_date), 'MMM d, yyyy')}
                </div>
              )}

              {/* Important Note */}
              <div className='bg-amber-50 p-4 rounded-lg border border-amber-200'>
                <p className='text-xs text-gray-700 flex items-start gap-2'>
                  <AlertCircle className='w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5' />
                  {t('offers.confirmBookingDialog.importantNote')}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className='flex justify-end gap-3'>
            <Button
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
              disabled={acceptOfferMutation.isPending}
            >
              {t('common.cancelButton')}
            </Button>
            <Button
              onClick={() => {
                if (selectedOffer) {
                  console.log('User clicked confirm for offer:', selectedOffer.id);
                  acceptOfferMutation.mutate(selectedOffer.id);
                }
              }}
              disabled={acceptOfferMutation.isPending}
              className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 min-w-[140px]'
            >
              {acceptOfferMutation.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  {t('common.confirmingButton')}...
                </>
              ) : (
                <>
                  <Check className='w-4 h-4 mr-2' />
                  {t('offers.confirmBookingButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBookingForDetails}
        open={showDetailsModal}
        onOpenChange={(isOpen) => {
          setShowDetailsModal(isOpen);
          if (!isOpen) {
            setSelectedBookingForDetails(null);
          }
        }}
        viewerType='traveler'
      />

      {/* Enhanced Cancel Dialog */}
      <CancelBookingDialog
        open={showCancelDialog}
        onOpenChange={(isOpen) => {
          setShowCancelDialog(isOpen);
          if (!isOpen) {
            setBookingToCancel(null);
          }
        }}
        booking={bookingToCancel}
        onConfirm={(data) => {
          if (bookingToCancel) {
            cancelBookingMutation.mutate({
              bookingId: bookingToCancel.id,
              ...data,
            });
          }
        }}
        isLoading={cancelBookingMutation.isPending}
        userType='traveler'
      />
    </div>
  );
}
