import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Loader2,
  Calendar,
  MessageSquare,
  DollarSign,
  CheckCircle,
  User,
  Clock,
  Users,
  Building2,
  Send,
  X,
  Package,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';
import { createPageUrl } from '@/utils';
import {
  queryDocuments,
  addDocument,
  getDocument,
  getOrCreateConversation,
  updateDocument,
} from '@/utils/firestore';

import BookingServicesDisplay from '@/features/shared/booking-components/BookingServicesDisplay';
import { UseAppContext } from '@/shared/context/AppContext';
import HostProfileSettings from '@/features/host/components/HostProfileSettings';
import { useTranslation } from '@/shared/i18n/LanguageContext';
import { showSuccess, showError, showInfo } from '@/shared/utils/notifications';
import { getUserDisplayName } from '@/shared/utils/userHelpers';

export default function HostDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('requests');
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [offerForm, setOfferForm] = useState({
    price: '',
    inclusions: '',
    message: '',
  });

  const { user, userLoading } = UseAppContext();

  useEffect(() => {
    if (!userLoading && (!user || !user.host_approved)) {
      navigate(createPageUrl('Home'));
    }
  }, [user, userLoading, navigate]);

  const hostCities = useMemo(() => {
    if (!user) return [];
    const cities = new Set();
    if (user.city) cities.add(user.city);
    if (Array.isArray(user.assigned_cities)) {
      user.assigned_cities.forEach((c) => cities.add(c));
    }
    return Array.from(cities);
  }, [user]);

  const sendOfferMutation = useMutation({
    mutationFn: async ({ booking, offerData }) => {
      // Calculate fees (15% SAWA fee + 10% office fee = 25% total)
      const basePrice = parseFloat(offerData.price);
      const sawaFee = basePrice * 0.15;
      const officeFee = basePrice * 0.1;
      const totalPrice = basePrice + sawaFee + officeFee;

      const offer = {
        booking_id: booking.id,
        host_id: user.id,
        host_email: user.email,
        host_name: user.full_name || user.email,
        traveler_email: booking.traveler_email,
        price: basePrice,
        price_total: totalPrice,
        price_breakdown: {
          base_price: basePrice,
          sawa_fee: sawaFee,
          sawa_percent: 15,
          office_fee: officeFee,
          office_percent: 10,
          total: totalPrice,
        },
        status: 'pending',
        inclusions: offerData.inclusions,
        message: offerData.message,
        expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };

      const offerId = await addDocument('offers', offer);
      console.log(' Offer created with ID:', offerId);

      // Track host response in booking
      const currentBooking = await getDocument('bookings', booking.id);
      const hostResponses = currentBooking.host_responses || {};

      hostResponses[user.email] = {
        action: 'offered',
        offer_id: offerId,
        offered_date: new Date().toISOString(),
        host_name: user.full_name || user.email,
      };

      await updateDocument('bookings', booking.id, {
        host_responses: hostResponses,
        updated_date: new Date().toISOString(),
      });

      // Create notification for traveler
      const notificationData = {
        recipient_email: booking.traveler_email,
        type: 'offer_received',
        title: 'New Offer Received',
        message: `You received an offer for your booking in ${booking.city_name || booking.city}`,
        booking_id: booking.id,
        offer_id: offerId,
        read: false,
        created_date: new Date().toISOString(),
      };

      // Only add user_id if it exists
      if (booking.traveler_id) {
        notificationData.user_id = booking.traveler_id;
      }

      await addDocument('notifications', notificationData);

      return { offerId, booking };
    },
    onSuccess: async (data) => {
      // Invalidate all relevant queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: ['availableBookings'] });
      queryClient.invalidateQueries({ queryKey: ['myOffers'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      toast.success('Offer sent successfully! Opening chat...');
      setShowOfferDialog(false);
      setSelectedBooking(null);
      setOfferForm({ price: '', inclusions: '', message: '' });

      try {
        // Create or get conversation for this booking
        const conversation = await getOrCreateConversation({
          id: data.booking.id,
          traveler_email: data.booking.traveler_email,
          host_email: user.email,
          city_name: data.booking.city_name || data.booking.city,
        });

        console.log('Conversation created/found:', conversation.id);

        // Navigate to Messages page with conversation ID
        navigate(createPageUrl(`Messages?conversation_id=${conversation.id}`));
      } catch (error) {
        console.error('Error opening chat:', error);
        toast.error('Offer sent, but failed to open chat. Please check Messages page.');
      }
    },
    onError: (error) => {
      console.error('Error sending offer:', error);
      toast.error(error.message || 'Failed to send offer');
    },
  });

  const { data: availableBookings = [], isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['availableBookings', user?.email, hostCities],
    queryFn: async () => {
      if (!user?.email || !hostCities || hostCities.length === 0) {
        return [];
      }

      try {
        // Get only pending bookings (hosts can only read pending bookings per Firestore rules)
        const allBookings = await queryDocuments('bookings', [['status', '==', 'pending']]);

        // Get all offers made by this host
        const myOffers = await queryDocuments('offers', [['host_email', '==', user.email]]);
        const myOfferedBookingIds = new Set(myOffers.map((o) => o.booking_id));

        // Filter for available bookings
        const available = allBookings.filter((booking) => {
          // Filter by city
          const bookingCity = booking.city_name || booking.city;
          if (!hostCities.includes(bookingCity)) {
            return false;
          }

          // Exclude adventure bookings
          if (booking.adventure_id) return false;

          // Exclude cancelled, expired, or confirmed bookings
          if (['cancelled', 'expired', 'confirmed'].includes(booking.status)) return false;

          // Exclude bookings where host already sent an offer
          if (myOfferedBookingIds.has(booking.id)) return false;

          // Exclude bookings where this host already rejected
          if (booking.host_responses && booking.host_responses[user.email]) {
            return false;
          }

          // Only show pending bookings
          if (booking.status !== 'pending') return false;

          return true;
        });

        console.log(' Available bookings:', available.length);
        return available.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } catch (error) {
        console.error('Error fetching available bookings:', error);
        return [];
      }
    },
    enabled: !!user?.email && hostCities.length > 0,
    staleTime: 30 * 1000, // 30 seconds - shorter to show updates faster
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false,
  });

  const { data: myBookings = [], isLoading: isLoadingMy } = useQuery({
    queryKey: ['myBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      try {
        console.log(' Fetching my bookings (where I sent offers)');

        // Get all offers made by this host
        const myOffers = await queryDocuments('offers', [['host_email', '==', user.email]]);
        console.log('My offers:', myOffers.length);

        if (myOffers.length === 0) {
          return [];
        }

        // Get the booking IDs
        const bookingIds = [...new Set(myOffers.map((o) => o.booking_id))];

        // Get bookings for each offer (fetch individually since we can't query by ID list)
        const myBookings = [];
        for (const bookingId of bookingIds) {
          try {
            const booking = await getDocument('bookings', bookingId);
            if (booking) {
              myBookings.push(booking);
            }
          } catch (error) {
            console.warn(`Could not fetch booking ${bookingId}:`, error.message);
          }
        }

        // Add offer details to bookings
        const bookingsWithOffers = myBookings.map((booking) => {
          // Find the offer for this booking
          const offer = myOffers.find((o) => o.booking_id === booking.id);
          return {
            ...booking,
            offer_id: offer?.id,
            offer_status: offer?.status,
            offer_price: offer?.price_total,
          };
        });

        console.log(' My bookings:', bookingsWithOffers.length);
        return bookingsWithOffers.sort(
          (a, b) => new Date(b.created_date) - new Date(a.created_date)
        );
      } catch (error) {
        console.error('Error fetching my bookings:', error);
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000, // 30 seconds - shorter to show updates faster
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false,
  });

  const { data: rejectedBookings = [], isLoading: isLoadingRejected } = useQuery({
    queryKey: ['rejectedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      try {
        const allBookings = await queryDocuments('bookings', [['status', '==', 'pending']]);

        const rejected = allBookings.filter((booking) => {
          return (
            booking.host_responses &&
            booking.host_responses[user.email] &&
            booking.host_responses[user.email].action === 'rejected'
          );
        });

        const rejectedWithTravelers = await Promise.all(
          rejected.map(async (booking) => {
            try {
              if (booking.user_id) {
                const traveler = await getDocument('users', booking.user_id);
                return {
                  ...booking,
                  traveler_name:
                    traveler?.full_name || traveler?.display_name || booking.traveler_email,
                };
              }
            } catch (error) {
              console.warn('Could not fetch traveler info:', error);
            }
            return {
              ...booking,
              traveler_name: booking.traveler_email,
            };
          })
        );

        return rejectedWithTravelers.sort((a, b) => {
          const aRejectedDate = a.host_responses?.[user.email]?.rejected_date;
          const bRejectedDate = b.host_responses?.[user.email]?.rejected_date;
          return new Date(bRejectedDate) - new Date(aRejectedDate);
        });
      } catch (error) {
        console.error('Error fetching rejected bookings:', error);
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000, // 30 seconds - shorter to show updates faster
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false,
  });

  const conversations = [];
  const unreadCount = 0;

  const stats = useMemo(() => {
    const confirmed = myBookings.filter(
      (b) => b.status === 'confirmed' || b.state === 'confirmed'
    ).length;

    const totalEarnings = myBookings
      .filter((b) => b.status === 'confirmed' || b.state === 'confirmed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    return {
      newRequests: availableBookings.length,
      confirmed,
      earnings: totalEarnings,
      activeChats: myBookings.length,
    };
  }, [availableBookings, myBookings]);

  if (userLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  if (!user) {
    return null; // Should be handled by useEffect redirect, but good as a fallback
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <section className='relative bg-gradient-to-br from-[#330066] via-[#9933CC] to-[#AD5CD6] pt-16 pb-24 overflow-hidden'>
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl' />
          <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-[#330066] opacity-20 rounded-full blur-3xl' />
        </div>

        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='flex flex-col items-start gap-4'
          >
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30'>
              <Building2 className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>Host Dashboard</span>
            </div>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight'>
              Welcome back, {getUserDisplayName(user)}
            </h1>

            <p className='text-lg sm:text-xl text-white/90 max-w-2xl'>
              Manage your bookings and connect with travelers
            </p>
          </motion.div>
        </div>

        <div className='absolute bottom-0 left-0 right-0 h-16 sm:h-24'>
          <svg
            className='w-full h-full'
            viewBox='0 0 1440 120'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            preserveAspectRatio='none'
          >
            <path
              d='M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z'
              fill='white'
              fillOpacity='1'
            />
          </svg>
        </div>
      </section>

      <section className='relative -mt-16 pb-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className='bg-white shadow-lg border-2 border-orange-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>New Requests</p>
                      <p className='text-3xl font-bold text-orange-600'>{stats.newRequests}</p>
                    </div>
                    <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                      <Clock className='w-6 h-6 text-orange-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className='bg-white shadow-lg border-2 border-green-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Confirmed</p>
                      <p className='text-3xl font-bold text-green-600'>{stats.confirmed}</p>
                    </div>
                    <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                      <CheckCircle className='w-6 h-6 text-green-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className='bg-white shadow-lg border-2 border-purple-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Earnings</p>
                      <p className='text-3xl font-bold text-purple-600'>
                        ${stats.earnings.toFixed(0)}
                      </p>
                    </div>
                    <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                      <DollarSign className='w-6 h-6 text-purple-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className='bg-white shadow-lg border-2 border-blue-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Active Chats</p>
                      <p className='text-3xl font-bold text-blue-600'>{stats.activeChats}</p>
                    </div>
                    <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <MessageSquare className='w-6 h-6 text-blue-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className='pb-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='bg-white shadow-sm mb-6 flex'>
              <TabsTrigger value='requests' className='flex items-center gap-2 flex-1'>
                <Clock className='w-4 h-4' />
                New Requests ({availableBookings.length})
              </TabsTrigger>
              <TabsTrigger value='bookings' className='flex items-center gap-2 flex-1'>
                <Calendar className='w-4 h-4' />
                My Bookings ({myBookings.length})
              </TabsTrigger>
              <TabsTrigger value='rejected' className='flex items-center gap-2 flex-1'>
                <X className='w-4 h-4' />
                Rejected ({rejectedBookings.length})
              </TabsTrigger>
              <TabsTrigger value='profile' className='flex items-center gap-2 flex-1'>
                <User className='w-4 h-4' />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value='requests'>
              {isLoadingAvailable ? (
                <div className='flex justify-center py-12'>
                  <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
                </div>
              ) : availableBookings.length === 0 ? (
                <Card>
                  <CardContent className='py-12 text-center'>
                    <Clock className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                    <h3 className='text-lg font-semibold text-gray-700 mb-2'>No New Requests</h3>
                    <p className='text-gray-500'>New booking requests will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {availableBookings.map((booking) => (
                    <Card key={booking.id} className='hover:shadow-lg transition-shadow'>
                      <CardHeader className='pb-3'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <CardTitle className='text-lg'>{booking.city}</CardTitle>
                            <p className='text-sm text-gray-500 mt-1'>
                              {format(new Date(booking.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge className='bg-orange-100 text-orange-700'>New Request</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Calendar className='w-4 h-4' />
                          <span>
                            {format(new Date(booking.start_date), 'MMM d')} -{' '}
                            {format(new Date(booking.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Users className='w-4 h-4' />
                          <span>
                            {booking.number_of_adults}{' '}
                            {booking.number_of_adults === 1 ? 'Adult' : 'Adults'}
                            {booking.number_of_children > 0 &&
                              ` + ${booking.number_of_children} ${
                                booking.number_of_children === 1 ? 'Child' : 'Children'
                              }`}
                          </span>
                        </div>

                        {booking.notes && (
                          <div className='bg-blue-50 p-3 rounded-lg'>
                            <p className='text-xs text-gray-700 italic'>"{booking.notes}"</p>
                          </div>
                        )}

                        <div className='flex gap-2'>
                          <Button
                            onClick={async () => {
                              try {
                                const conversation = await getOrCreateConversation({
                                  id: booking.id,
                                  traveler_email: booking.traveler_email,
                                  host_email: user.email,
                                  city_name: booking.city_name || booking.city,
                                });
                                console.log('Opening chat for booking:', booking.id);

                                navigate(
                                  createPageUrl(`Messages?conversation_id=${conversation.id}`)
                                );
                              } catch (error) {
                                console.error('Error opening chat:', error);
                                toast.error('Failed to open chat. Please try again.');
                              }
                            }}
                            className='flex-1 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6]'
                          >
                            <MessageSquare className='w-4 h-4 mr-2' />
                            Accept Request
                          </Button>
                          <Button
                            onClick={async () => {
                              try {
                                const currentBooking = await getDocument('bookings', booking.id);
                                const hostResponses = currentBooking.host_responses || {};

                                hostResponses[user.email] = {
                                  action: 'rejected',
                                  rejected_date: new Date().toISOString(),
                                  host_name: user.full_name || user.email,
                                };

                                // Check if all hosts in the city have rejected
                                const bookingCity = currentBooking.city_name || currentBooking.city;

                                // Get all approved hosts in this city
                                const allHostsInCity = await queryDocuments('users', [
                                  ['host_approved', '==', true],
                                ]);

                                // Filter hosts who have access to this city
                                const cityHosts = allHostsInCity.filter((host) => {
                                  return (
                                    host.city === bookingCity ||
                                    (Array.isArray(host.assigned_cities) &&
                                      host.assigned_cities.includes(bookingCity))
                                  );
                                });

                                // Check if all hosts have responded with rejection
                                const allRejected = cityHosts.every((host) => {
                                  const response = hostResponses[host.email];
                                  return response && response.action === 'rejected';
                                });

                                // Update booking with new status if all hosts rejected
                                const updateData = {
                                  host_responses: hostResponses,
                                  updated_date: new Date().toISOString(),
                                };

                                if (allRejected) {
                                  updateData.status = 'rejected';
                                  updateData.rejected_at = new Date().toISOString();
                                  updateData.rejection_reason =
                                    'All hosts in the city have declined this request';

                                  // Notify the traveler
                                  const notificationData = {
                                    recipient_email: currentBooking.traveler_email,
                                    type: 'booking_rejected',
                                    title: 'Booking Request Declined',
                                    message: `Unfortunately, all available hosts in ${bookingCity} have declined your booking request. Please try adjusting your dates or requirements.`,
                                    booking_id: booking.id,
                                    read: false,
                                    created_date: new Date().toISOString(),
                                  };

                                  if (currentBooking.user_id) {
                                    notificationData.user_id = currentBooking.user_id;
                                  }

                                  await addDocument('notifications', notificationData);
                                }

                                await updateDocument('bookings', booking.id, updateData);

                                // Always show the same message to the host who rejected
                                showSuccess(
                                  'Request Rejected',
                                  'The booking request has been rejected.'
                                );

                                // Invalidate all relevant queries to update UI immediately
                                queryClient.invalidateQueries({ queryKey: ['availableBookings'] });
                                queryClient.invalidateQueries({ queryKey: ['rejectedBookings'] });
                              } catch (error) {
                                console.error('Error rejecting request:', error);
                                showError('Failed to reject request', 'Please try again.');
                              }
                            }}
                            variant='outline'
                            className='border-2 border-red-300 text-red-600 hover:bg-red-50'
                          >
                            <X className='w-4 h-4 mr-2' />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='bookings'>
              {isLoadingMy ? (
                <div className='flex justify-center py-12'>
                  <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
                </div>
              ) : myBookings.length === 0 ? (
                <Card>
                  <CardContent className='py-12 text-center'>
                    <Calendar className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                    <h3 className='text-lg font-semibold text-gray-700 mb-2'>No Bookings Yet</h3>
                    <p className='text-gray-500'>Your accepted bookings will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {myBookings.map((booking) => (
                    <Card key={booking.id} className='hover:shadow-lg transition-shadow'>
                      <CardHeader className='pb-3'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <CardTitle className='text-lg'>{booking.city}</CardTitle>
                            <p className='text-sm text-gray-500 mt-1'>
                              {format(new Date(booking.start_date), 'MMM d')} -{' '}
                              {format(new Date(booking.end_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              booking.status === 'confirmed' || booking.state === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            )}
                          >
                            {booking.status === 'confirmed' || booking.state === 'confirmed'
                              ? 'Confirmed'
                              : 'Pending'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Users className='w-4 h-4' />
                          <span>
                            {booking.number_of_adults}{' '}
                            {booking.number_of_adults === 1 ? 'Adult' : 'Adults'}
                            {booking.number_of_children > 0 &&
                              ` + ${booking.number_of_children} ${
                                booking.number_of_children === 1 ? 'Child' : 'Children'
                              }`}
                          </span>
                        </div>

                        {booking.total_price && (
                          <div className='flex items-center gap-2 text-sm font-semibold text-green-600'>
                            <DollarSign className='w-4 h-4' />
                            <span>${booking.total_price.toFixed(2)}</span>
                          </div>
                        )}

                        <Button
                          onClick={() => {
                            if (booking.conversation_id) {
                              navigate(
                                createPageUrl(`Messages?conversation_id=${booking.conversation_id}`)
                              );
                            } else {
                              toast.error('Conversation not found');
                            }
                          }}
                          variant='outline'
                          className='w-full'
                        >
                          <MessageSquare className='w-4 h-4 mr-2' />
                          View Messages
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='rejected'>
              {isLoadingRejected ? (
                <div className='flex justify-center py-12'>
                  <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
                </div>
              ) : rejectedBookings.length === 0 ? (
                <Card>
                  <CardContent className='py-12 text-center'>
                    <X className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                    <h3 className='text-lg font-semibold text-gray-700 mb-2'>
                      No Rejected Requests
                    </h3>
                    <p className='text-gray-500'>Requests you reject will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {rejectedBookings.map((booking) => (
                    <Card key={booking.id} className='bg-red-50 border-2 border-red-200'>
                      <CardHeader>
                        <CardTitle className='text-lg flex items-center justify-between'>
                          <span className='flex items-center gap-2'>
                            {booking.city_name || booking.city}
                            <Badge
                              variant='outline'
                              className='bg-red-100 text-red-700 border-red-300'
                            >
                              Rejected
                            </Badge>
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        {/* Traveler Info */}
                        {booking.traveler_name && (
                          <div className='flex items-center gap-2 text-sm font-semibold text-gray-700'>
                            <User className='w-4 h-4 text-purple-600' />
                            {booking.traveler_name}
                          </div>
                        )}

                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Calendar className='w-4 h-4' />
                          {format(new Date(booking.start_date), 'MMM dd')} -{' '}
                          {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Users className='w-4 h-4' />
                          {booking.number_of_adults}{' '}
                          {t(booking.number_of_adults === 1 ? 'common.adult' : 'common.adults')}
                          {booking.number_of_children > 0 && (
                            <>
                              , {booking.number_of_children}{' '}
                              {t(
                                booking.number_of_children === 1
                                  ? 'common.child'
                                  : 'common.children'
                              )}
                            </>
                          )}
                        </div>

                        {/* Requested Services */}
                        {booking.selected_services && booking.selected_services.length > 0 && (
                          <div className='bg-white p-3 rounded-lg border border-red-200'>
                            <div className='flex items-center gap-2 mb-2'>
                              <Package className='w-4 h-4 text-purple-600' />
                              <p className='text-xs font-semibold text-gray-700'>
                                Requested Services:
                              </p>
                            </div>
                            <BookingServicesDisplay serviceIds={booking.selected_services} />
                          </div>
                        )}

                        {booking.notes && (
                          <div className='bg-white p-3 rounded-lg border border-red-200'>
                            <p className='text-xs font-semibold text-gray-700 mb-1'>Notes:</p>
                            <p className='text-sm text-gray-600'>{booking.notes}</p>
                          </div>
                        )}
                        <div className='pt-3 border-t border-red-200'>
                          <p className='text-xs text-gray-500'>
                            Rejected on{' '}
                            {format(
                              new Date(booking.host_responses[user.email].rejected_date),
                              "MMM dd, yyyy 'at' h:mm a"
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='profile'>
              <HostProfileSettings user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Send Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Send Offer to Traveler</DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                <>
                  Booking for {selectedBooking.city_name || selectedBooking.city} from{' '}
                  {format(new Date(selectedBooking.start_date), 'MMM d')} to{' '}
                  {format(new Date(selectedBooking.end_date), 'MMM d, yyyy')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='price'>Base Price (USD)</Label>
              <Input
                id='price'
                type='number'
                placeholder='200'
                value={offerForm.price}
                onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
              />
              {offerForm.price && (
                <p className='text-xs text-gray-500'>
                  Total with fees (25%): ${(parseFloat(offerForm.price) * 1.25).toFixed(2)}
                  <br />
                  <span className='text-xs text-gray-400'>(SAWA 15% + Office 10%)</span>
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='inclusions'>What's Included</Label>
              <Textarea
                id='inclusions'
                placeholder='e.g., Airport pickup, City tour, Guide services, Meals...'
                value={offerForm.inclusions}
                onChange={(e) => setOfferForm({ ...offerForm, inclusions: e.target.value })}
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='message'>Message to Traveler</Label>
              <Textarea
                id='message'
                placeholder='Introduce yourself and explain your offer...'
                value={offerForm.message}
                onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowOfferDialog(false);
                setSelectedBooking(null);
                setOfferForm({ price: '', inclusions: '', message: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!offerForm.price || !offerForm.inclusions || !offerForm.message) {
                  toast.error('Please fill in all fields');
                  return;
                }
                sendOfferMutation.mutate({
                  booking: selectedBooking,
                  offerData: offerForm,
                });
              }}
              disabled={sendOfferMutation.isPending}
              className='bg-gradient-to-r from-[#330066] to-[#9933CC]'
            >
              {sendOfferMutation.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Sending...
                </>
              ) : (
                <>
                  <Send className='w-4 h-4 mr-2' />
                  Send Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
