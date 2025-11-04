import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  User,
  Mail,
  Phone,
  MessageSquare,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Sparkles,
  Building2,
  Copy,
  History,
  Receipt,
  Info,
  Briefcase,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { queryDocuments, getDocument } from '@/utils/firestore';

import { BookingID, UserID } from '../common/BookingID';
import { normalizeText } from '../utils/textHelpers';
import { getUserDisplayName } from '../utils/userHelpers';

import BookingServicesDisplay from './BookingServicesDisplay';

export default function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
  viewerType = 'traveler',
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const isAdventureBooking = !!booking?.adventure_id;

  // FIXED: Disable all queries when modal is closed
  const queryEnabled = open && !!booking?.id;

  // Fetch related data (Hooks must be called unconditionally at the top level)
  const { data: offers = [] } = useQuery({
    queryKey: ['bookingOffers', booking?.id],
    queryFn: async () => {
      if (!booking?.id || isAdventureBooking) return []; // No offers for adventures
      return queryDocuments('offers', [['booking_id', '==', booking.id]]);
    },
    enabled: queryEnabled && !isAdventureBooking,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get all conversations for this booking
  const { data: conversations = [] } = useQuery({
    queryKey: ['bookingConversations', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      return queryDocuments('conversations', [['booking_id', '==', booking.id]]);
    },
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: traveler } = useQuery({
    queryKey: ['travelerUser', booking?.traveler_email],
    queryFn: async () => {
      if (!booking?.traveler_email) return null;
      const users = await queryDocuments('users', [['email', '==', booking.traveler_email]]);
      return users[0] || null;
    },
    enabled: queryEnabled && !!booking?.traveler_email,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: host } = useQuery({
    queryKey: ['hostUser', booking?.host_email],
    queryFn: async () => {
      if (!booking?.host_email) return null;
      const users = await queryDocuments('users', [['email', '==', booking.host_email]]);
      return users[0] || null;
    },
    enabled: queryEnabled && !!booking?.host_email,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch all user data for hosts who have submitted an offer for this booking
  const { data: allOfferHostsData = [] } = useQuery({
    queryKey: ['allOfferHostsData', offers.map((o) => o.host_email).filter(Boolean)],
    queryFn: async ({ queryKey }) => {
      const [, hostEmails] = queryKey;
      if (hostEmails.length === 0) return [];
      const uniqueEmails = Array.from(new Set(hostEmails));
      const hostUserPromises = uniqueEmails.map((email) =>
        queryDocuments('users', [['email', '==', email]])
          .then((res) => res[0])
          .catch(() => null)
      );
      return (await Promise.all(hostUserPromises)).filter(Boolean);
    },
    enabled: queryEnabled && offers.length > 0 && !isAdventureBooking, // Disabled for adventure bookings
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch adventure data if adventure booking
  const { data: adventure } = useQuery({
    queryKey: ['adventure', booking?.adventure_id],
    queryFn: async () => {
      if (!booking?.adventure_id) return null;
      return getDocument('adventures', booking.adventure_id);
    },
    enabled: queryEnabled && !!booking?.adventure_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: cancellationRequest } = useQuery({
    queryKey: ['cancellationRequest', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return null;
      const requests = await queryDocuments('cancellation_requests', [
        ['booking_id', '==', booking.id],
      ]);
      return requests[0] || null;
    },
    enabled: queryEnabled && ['cancelled', 'pending'].includes(booking?.status),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate derived data with useMemo BEFORE any conditional returns
  const acceptedOffer = useMemo(
    () => offers.find((o) => o.id === booking?.accepted_offer_id),
    [offers, booking?.accepted_offer_id]
  );

  const pendingOffers = useMemo(() => offers.filter((o) => o.status === 'pending'), [offers]);

  const declinedOffers = useMemo(() => offers.filter((o) => o.status === 'declined'), [offers]);

  const isBookingConfirmed = useMemo(
    () => booking?.status === 'confirmed' || booking?.state === 'confirmed' || !!acceptedOffer,
    [booking?.status, booking?.state, acceptedOffer]
  );

  // Get ALL hosts who sent offers (not just pending) - Original logic kept here for `offers` tab
  const hostsWithOffers = useMemo(() => {
    const hostMap = new Map();

    offers.forEach((offer) => {
      if (!hostMap.has(offer.host_email)) {
        const hostUser = allOfferHostsData.find((u) => u.email === offer.host_email);
        const conversation = conversations.find(
          (c) =>
            c.booking_id === booking?.id &&
            c.host_emails &&
            c.host_emails.includes(offer.host_email)
        );

        hostMap.set(offer.host_email, {
          email: offer.host_email,
          user: hostUser,
          offer: offer,
          conversation: conversation,
        });
      }
    });

    return Array.from(hostMap.values());
  }, [offers, allOfferHostsData, conversations, booking?.id]);

  // Get ONLY hosts who have active conversations (accepted the request)
  const hostsWithConversations = useMemo(() => {
    // This logic is primarily for service bookings where multiple hosts might accept.
    // For adventure bookings, we primarily care about the 'host' object itself.
    if (isAdventureBooking) {
      if (host) {
        const conversation = conversations.find(
          (c) => c.booking_id === booking?.id && c.host_emails && c.host_emails.includes(host.email)
        );
        return [{ email: host.email, user: host, offer: null, conversation: conversation }];
      }
      return [];
    }

    const hostList = [];
    conversations.forEach((conversation) => {
      if (conversation.host_emails && Array.isArray(conversation.host_emails)) {
        conversation.host_emails.forEach((hostEmail) => {
          // Skip if already added
          if (hostList.some((h) => h.email === hostEmail)) return;

          const hostUser = allOfferHostsData.find((u) => u.email === hostEmail);
          const offer = offers.find((o) => o.host_email === hostEmail);

          hostList.push({
            email: hostEmail,
            user: hostUser,
            offer: offer,
            conversation: conversation,
          });
        });
      }
    });
    return hostList;
  }, [conversations, allOfferHostsData, offers, isAdventureBooking, host, booking?.id]);

  // NOW we can do conditional returns
  if (!booking) return null;

  // Status Configuration
  const getStatusConfig = () => {
    const status = booking.status || booking.state;

    const configs = {
      pending: {
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        label: 'Pending',
      },
      confirmed: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        label: 'Confirmed',
      },
      completed: {
        icon: CheckCircle2,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        label: 'Completed',
      },
      cancelled: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Cancelled',
      },
      expired: {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        label: 'Expired',
      },
    };

    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openChat = (conversationId) => {
    if (!conversationId) {
      toast.error('No conversation found for this host.');
      return;
    }

    // Close the modal first
    onOpenChange(false);

    // Navigate to Messages page with conversation_id after a short delay
    // This delay ensures the modal has time to close, preventing potential issues.
    setTimeout(() => {
      navigate(`${createPageUrl('Messages')}?conversation_id=${conversationId}`);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-hidden p-0'>
        {/* 🎨 Header */}
        <DialogHeader className='p-3 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white'>
          <div className='flex items-start justify-between gap-2 sm:gap-4'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap'>
                <BookingID booking={booking} size='small' />
                {isAdventureBooking ? (
                  <Badge className='bg-purple-500 text-white text-[10px] sm:text-xs'>
                    <Sparkles className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1' />
                    Adventure
                  </Badge>
                ) : (
                  <Badge className='bg-blue-500 text-white text-[10px] sm:text-xs'>
                    <Briefcase className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1' />
                    Service
                  </Badge>
                )}
              </div>
              <DialogTitle className='text-lg sm:text-2xl font-bold text-gray-900 mb-1 truncate'>
                {isAdventureBooking && adventure ? adventure.title : normalizeText(booking.city)}
              </DialogTitle>
              <p className='text-xs sm:text-sm text-gray-600'>
                {format(new Date(booking.start_date), 'MMM d, yyyy')} -{' '}
                {format(new Date(booking.end_date), 'MMM d, yyyy')}
              </p>
            </div>

            <div
              className={cn(
                'px-2 sm:px-4 py-1 sm:py-2 rounded-full border-2 flex items-center gap-1 sm:gap-2 flex-shrink-0',
                statusConfig.bg,
                statusConfig.border
              )}
            >
              <StatusIcon className={cn('w-3.5 h-3.5 sm:w-5 sm:h-5', statusConfig.color)} />
              <span className={cn('font-semibold text-[10px] sm:text-sm', statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Content Tabs */}
        <div className='overflow-y-auto max-h-[calc(90vh-160px)] sm:max-h-[calc(90vh-120px)]'>
          <Tabs value={activeTab} onValueChange={setActiveTab} className='p-3 sm:p-6'>
            <TabsList
              className={cn(
                'w-full mb-4 sm:mb-6 grid gap-1',
                isAdventureBooking
                  ? 'grid-cols-3' // Adventure: Overview, People, Timeline (no Offers)
                  : isBookingConfirmed
                    ? 'grid-cols-4' // Service Confirmed: Overview, Offers, People, Timeline
                    : 'grid-cols-3' // Service Pending: Overview, Offers, Timeline
              )}
            >
              <TabsTrigger value='overview' className='text-[10px] sm:text-xs px-1 sm:px-3'>
                <Info className='w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1' />
                <span className='hidden sm:inline'>Overview</span>
                <span className='sm:hidden'>Info</span>
              </TabsTrigger>

              {/* Only show Offers tab for SERVICE bookings */}
              {!isAdventureBooking && (
                <TabsTrigger value='offers' className='text-[10px] sm:text-xs px-1 sm:px-3'>
                  <Receipt className='w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1' />
                  <span className='hidden sm:inline'>Offers ({offers.length})</span>
                  <span className='sm:hidden'>({offers.length})</span>
                  {pendingOffers.length > 0 && (
                    <Badge className='ml-0.5 sm:ml-1 bg-orange-500 text-white text-[8px] sm:text-[10px] px-1'>
                      {pendingOffers.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}

              {(isBookingConfirmed || isAdventureBooking) && (
                <TabsTrigger value='people' className='text-[10px] sm:text-xs px-1 sm:px-3'>
                  <Users className='w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1' />
                  <span className='hidden sm:inline'>People</span>
                  <span className='sm:hidden'>👥</span>
                </TabsTrigger>
              )}

              <TabsTrigger value='timeline' className='text-[10px] sm:text-xs px-1 sm:px-3'>
                <History className='w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1' />
                <span className='hidden sm:inline'>Timeline</span>
                <span className='sm:hidden'>📅</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Overview */}
            <TabsContent value='overview' className='space-y-3 sm:space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'>
                {/* ADVENTURE BOOKING: Show Adventure Info */}
                {isAdventureBooking && adventure ? (
                  <>
                    {/* Adventure Card */}
                    <Card className='md:col-span-2 border-purple-200'>
                      <CardHeader className='p-3 sm:p-4'>
                        <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                          <Sparkles className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600' />
                          Adventure Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-3 sm:p-4 space-y-3 sm:space-y-4'>
                        {/* Adventure Image */}
                        {adventure.image_url && (
                          <div className='aspect-video rounded-lg overflow-hidden'>
                            <img
                              src={adventure.image_url}
                              alt={adventure.title}
                              className='w-full h-full object-cover'
                            />
                          </div>
                        )}

                        {/* Adventure Info */}
                        <div className='grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm'>
                          <div className='flex items-center justify-between'>
                            <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                              <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                              Location:
                            </span>
                            <span className='font-semibold truncate ml-1'>{adventure.city}</span>
                          </div>

                          <div className='flex items-center justify-between'>
                            <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                              <Calendar className='w-3 h-3 sm:w-4 sm:h-4' />
                              Date:
                            </span>
                            <span className='font-semibold truncate ml-1'>
                              {format(new Date(adventure.date), 'MMM d')}
                            </span>
                          </div>

                          <div className='flex items-center justify-between'>
                            <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                              <Clock className='w-3 h-3 sm:w-4 sm:h-4' />
                              Duration:
                            </span>
                            <span className='font-semibold'>{adventure.duration_hours}h</span>
                          </div>

                          <div className='flex items-center justify-between'>
                            <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                              <Users className='w-3 h-3 sm:w-4 sm:h-4' />
                              Guests:
                            </span>
                            <span className='font-semibold'>
                              {booking.number_of_adults}{' '}
                              {booking.number_of_adults === 1 ? 'Guest' : 'Guests'}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {adventure.description && (
                          <div className='pt-2 sm:pt-3 border-t'>
                            <p className='text-xs sm:text-sm text-gray-700 line-clamp-3'>
                              {adventure.description}
                            </p>
                          </div>
                        )}

                        {/* What's Included */}
                        {adventure.included && adventure.included.length > 0 && (
                          <div className='pt-2 sm:pt-3 border-t'>
                            <h4 className='text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2'>
                              <CheckCircle2 className='w-3 h-3 sm:w-4 sm:h-4 text-green-600' />
                              What's Included:
                            </h4>
                            <ul className='grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600'>
                              {adventure.included.slice(0, 4).map((item, idx) => (
                                <li key={idx} className='flex items-start gap-1.5 sm:gap-2'>
                                  <CheckCircle2 className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500 mt-0.5 flex-shrink-0' />
                                  <span className='line-clamp-1'>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Price Card */}
                    <Card>
                      <CardHeader className='p-3 sm:p-4'>
                        <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                          <DollarSign className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600' />
                          Booking Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-3 sm:p-4'>
                        <div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Price per person:</span>
                            <span className='font-semibold'>
                              ${(adventure.traveler_total_price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Number of guests:</span>
                            <span className='font-semibold'>× {booking.number_of_adults}</span>
                          </div>
                          <div className='flex justify-between pt-2 border-t border-gray-200 text-sm sm:text-base font-bold'>
                            <span>Total:</span>
                            <span className='text-green-600'>
                              ${(booking.total_price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Host Info for Adventure */}
                    {host && (
                      <Card className='bg-gradient-to-r from-purple-50 to-purple-100/50 border-2 border-purple-200'>
                        <CardHeader className='p-3 sm:p-4'>
                          <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                            <User className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600' />
                            Your Host
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-3 sm:p-4'>
                          <div className='flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3'>
                            {host.profile_photo ? (
                              <img
                                src={host.profile_photo}
                                alt={getUserDisplayName(host)}
                                className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-purple-300'
                              />
                            ) : (
                              <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base'>
                                {getUserDisplayName(host).charAt(0)}
                              </div>
                            )}
                            <div className='flex-1 min-w-0'>
                              <p className='font-semibold text-sm sm:text-base truncate'>
                                {getUserDisplayName(host)}
                              </p>
                              {host.rating && (
                                <div className='flex items-center gap-1 text-[10px] sm:text-xs text-amber-600'>
                                  <Star className='w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current' />
                                  {host.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>

                          {(() => {
                            const hostConversation = conversations.find(
                              (c) =>
                                c.booking_id === booking.id && c.host_emails?.includes(host.email)
                            );
                            return hostConversation?.id ? (
                              <Button
                                size='sm'
                                onClick={() => openChat(hostConversation.id)}
                                className='w-full bg-purple-600 hover:bg-purple-700 h-8 sm:h-9 text-xs sm:text-sm'
                              >
                                <MessageSquare className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                                Chat with Host
                              </Button>
                            ) : (
                              <Button
                                size='sm'
                                disabled
                                className='w-full bg-gray-400 text-white h-8 sm:h-9 text-xs sm:text-sm cursor-not-allowed'
                              >
                                <MessageSquare className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                                No Chat Available
                              </Button>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <>
                    {/* SERVICE BOOKING: Show Service Info */}
                    <Card>
                      <CardHeader className='p-3 sm:p-4'>
                        <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                          <Briefcase className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600' />
                          Booking Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-3 sm:p-4 space-y-2 sm:space-y-3 text-xs sm:text-sm'>
                        <div className='flex items-center justify-between'>
                          <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                            <MapPin className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                            Destination:
                          </span>
                          <span className='font-semibold truncate ml-1'>
                            {normalizeText(booking.city)}
                          </span>
                        </div>

                        <div className='flex items-center justify-between'>
                          <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                            <Calendar className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                            Check-in:
                          </span>
                          <span className='font-semibold'>
                            {format(new Date(booking.start_date), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <div className='flex items-center justify-between'>
                          <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                            <Calendar className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                            Check-out:
                          </span>
                          <span className='font-semibold'>
                            {format(new Date(booking.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <div className='flex items-center justify-between'>
                          <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                            <Users className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                            Guests:
                          </span>
                          <span className='font-semibold'>
                            {booking.number_of_adults}{' '}
                            {booking.number_of_adults === 1 ? 'Adult' : 'Adults'}
                            {booking.number_of_children > 0 &&
                              ` + ${booking.number_of_children} ${booking.number_of_children === 1 ? 'Child' : 'Children'}`}
                          </span>
                        </div>

                        <div className='flex items-center justify-between pt-2 border-t'>
                          <span className='text-gray-600 flex items-center gap-1 sm:gap-2'>
                            <Clock className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                            Created:
                          </span>
                          <span className='font-semibold text-[10px] sm:text-xs'>
                            {format(new Date(booking.created_date), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Services */}
                    <Card>
                      <CardHeader className='p-3 sm:p-4'>
                        <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                          <Package className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600' />
                          Requested Services
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-3 sm:p-4'>
                        {booking.selected_services && booking.selected_services.length > 0 ? (
                          <BookingServicesDisplay serviceIds={booking.selected_services} />
                        ) : (
                          <p className='text-xs sm:text-sm text-gray-500 italic'>
                            No specific services requested
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Hosts Who Accepted */}
                    {hostsWithConversations.length > 0 && (
                      <Card className='md:col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200'>
                        <CardHeader className='p-3 sm:p-4'>
                          <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                            <Users className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600' />
                            Hosts Who Accepted Request ({hostsWithConversations.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-3 sm:p-4'>
                          <div className='space-y-3'>
                            {hostsWithConversations.map(({ email, user, offer, conversation }) => {
                              const getOfferStatusBadge = () => {
                                if (!offer) {
                                  return (
                                    <Badge className='bg-blue-500 text-white text-[8px] sm:text-[10px]'>
                                      📩 No Offer Yet
                                    </Badge>
                                  );
                                }

                                switch (offer.status) {
                                  case 'accepted':
                                    return (
                                      <Badge className='bg-green-600 text-white text-[8px] sm:text-[10px]'>
                                        ✓ Offer Accepted
                                      </Badge>
                                    );
                                  case 'pending':
                                    return (
                                      <Badge className='bg-orange-500 text-white text-[8px] sm:text-[10px]'>
                                        ⏳ Offer Pending
                                      </Badge>
                                    );
                                  case 'declined':
                                    return (
                                      <Badge className='bg-gray-400 text-white text-[8px] sm:text-[10px]'>
                                        ✗ Offer Declined
                                      </Badge>
                                    );
                                  default:
                                    return (
                                      <Badge className='bg-blue-500 text-white text-[8px] sm:text-[10px]'>
                                        {offer.status}
                                      </Badge>
                                    );
                                }
                              };

                              return (
                                <div
                                  key={email}
                                  className={cn(
                                    'bg-white rounded-lg p-3 flex items-center justify-between border-2 shadow-sm hover:shadow-md transition-all',
                                    offer?.status === 'accepted' && 'border-green-300 bg-green-50',
                                    offer?.status === 'pending' && 'border-orange-300 bg-orange-50',
                                    offer?.status === 'declined' && 'border-gray-300 bg-gray-50',
                                    !offer && 'border-blue-300 bg-blue-50'
                                  )}
                                >
                                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                                    {user?.profile_photo ? (
                                      <img
                                        src={user.profile_photo}
                                        alt={getUserDisplayName(user)}
                                        className='w-10 h-10 rounded-full object-cover border-2 border-purple-300'
                                      />
                                    ) : (
                                      <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm'>
                                        {getUserDisplayName(user)?.charAt(0) ||
                                          email.charAt(0).toUpperCase()}
                                      </div>
                                    )}

                                    <div className='flex-1 min-w-0'>
                                      <div className='flex items-center gap-2 flex-wrap'>
                                        <p className='font-semibold text-gray-900 truncate text-sm'>
                                          {getUserDisplayName(user) || email.split('@')[0]}
                                        </p>
                                        {getOfferStatusBadge()}
                                      </div>
                                      <div className='flex items-center gap-2'>
                                        <p className='text-xs text-gray-600 truncate'>{email}</p>
                                        {user?.rating && (
                                          <div className='flex items-center gap-0.5'>
                                            <Star className='w-3 h-3 fill-amber-500 text-amber-500' />
                                            <span className='text-xs font-semibold text-amber-600'>
                                              {user.rating.toFixed(1)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {offer && (
                                        <p
                                          className={cn(
                                            'text-xs font-semibold mt-0.5',
                                            offer.status === 'accepted' && 'text-green-700',
                                            offer.status === 'pending' && 'text-orange-600',
                                            offer.status === 'declined' && 'text-gray-500'
                                          )}
                                        >
                                          Offered: ${(offer.price_total || offer.price)?.toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {conversation && conversation.id ? (
                                    <Button
                                      size='sm'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openChat(conversation.id);
                                      }}
                                      className='bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 flex-shrink-0 h-8 text-xs'
                                    >
                                      <MessageSquare className='w-3.5 h-3.5' />
                                      <span className='hidden sm:inline'>Chat</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      size='sm'
                                      disabled
                                      className='bg-gray-400 text-white flex items-center gap-1 flex-shrink-0 cursor-not-allowed h-8 text-xs'
                                    >
                                      <MessageSquare className='w-3.5 h-3.5' />
                                      <span className='hidden sm:inline'>No Chat</span>
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Price Breakdown - Services Only */}
                    {booking.total_price && (
                      <Card className='md:col-span-2'>
                        <CardHeader className='p-3 sm:p-4'>
                          <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                            <DollarSign className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600' />
                            Price Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-3 sm:p-4'>
                          {acceptedOffer?.price_breakdown ? (
                            <div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm'>
                              <div className='flex justify-between'>
                                <span className='text-gray-600'>Host Services:</span>
                                <span className='font-semibold'>
                                  ${acceptedOffer.price_breakdown.base_price?.toFixed(2)}
                                </span>
                              </div>
                              <div className='flex justify-between text-[10px] sm:text-xs text-gray-500'>
                                <span>
                                  + SAWA Commission ({acceptedOffer.price_breakdown.sawa_percent}%):
                                </span>
                                <span>${acceptedOffer.price_breakdown.sawa_fee?.toFixed(2)}</span>
                              </div>
                              {acceptedOffer.price_breakdown.office_percent > 0 && (
                                <div className='flex justify-between text-[10px] sm:text-xs text-gray-500'>
                                  <span>
                                    + Office Commission (
                                    {acceptedOffer.price_breakdown.office_percent}%):
                                  </span>
                                  <span>
                                    ${acceptedOffer.price_breakdown.office_fee?.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <div className='flex justify-between pt-2 border-t border-gray-200 text-sm sm:text-base font-bold'>
                                <span>Total:</span>
                                <span className='text-green-600'>
                                  ${booking.total_price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className='flex justify-between items-center'>
                              <span className='text-base sm:text-lg font-semibold'>
                                Total Amount:
                              </span>
                              <span className='text-xl sm:text-2xl font-bold text-green-600'>
                                ${booking.total_price.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Notes */}
                {booking.notes && (
                  <Card className='md:col-span-2'>
                    <CardHeader className='p-3 sm:p-4'>
                      <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                        <FileText className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600' />
                        Special Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-3 sm:p-4'>
                      <p className='text-xs sm:text-sm text-gray-700 italic'>
                        "{normalizeText(booking.notes)}"
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Cancellation Info */}
                {booking.status === 'cancelled' && (
                  <Card className='md:col-span-2 bg-red-50 border-red-200'>
                    <CardHeader className='p-3 sm:p-4'>
                      <CardTitle className='text-xs sm:text-sm flex items-center gap-2 text-red-600'>
                        <XCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                        Cancellation Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-3 sm:p-4 space-y-2 text-xs sm:text-sm'>
                      {cancellationRequest && (
                        <>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Cancelled by:</span>
                            <span className='font-semibold capitalize'>
                              {cancellationRequest.requester_type}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Reason:</span>
                            <span className='font-semibold'>
                              {cancellationRequest.reason_category?.replace('_', ' ')}
                            </span>
                          </div>
                          {cancellationRequest.calculated_refund && (
                            <div className='flex justify-between pt-2 border-t'>
                              <span className='text-gray-600'>Refund Amount:</span>
                              <span className='font-bold text-green-600'>
                                ${cancellationRequest.calculated_refund.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {booking.cancelled_at && (
                        <div className='flex justify-between text-[10px] sm:text-xs text-gray-500'>
                          <span>Cancelled on:</span>
                          <span>{format(new Date(booking.cancelled_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: Offers - ONLY FOR SERVICE BOOKINGS */}
            {!isAdventureBooking && (
              <TabsContent value='offers' className='space-y-3 sm:space-y-4'>
                {offers.length === 0 ? (
                  <Card className='text-center py-8'>
                    <CardContent className='p-3 sm:p-4'>
                      <Receipt className='w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300' />
                      <p className='text-sm sm:text-base text-gray-600'>No offers yet</p>
                      <p className='text-xs sm:text-sm text-gray-500 mt-1'>
                        Waiting for hosts to submit offers
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className='space-y-3'>
                    {/* Accepted Offer */}
                    {acceptedOffer && (
                      <Card className='bg-green-50 border-2 border-green-200'>
                        <CardHeader className='p-3 sm:p-4'>
                          <div className='flex items-center justify-between'>
                            <CardTitle className='text-xs sm:text-sm flex items-center gap-2 text-green-700'>
                              <CheckCircle2 className='w-4 h-4 sm:w-5 sm:h-5' />
                              Accepted Offer
                            </CardTitle>
                            <Badge className='bg-green-600 text-white text-[10px]'>Active</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className='p-3 sm:p-4 space-y-3'>
                          <div className='flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3'>
                            {host?.profile_photo ? (
                              <img
                                src={host.profile_photo}
                                alt={getUserDisplayName(host)}
                                className='w-10 h-10 rounded-full object-cover border-2 border-green-300'
                              />
                            ) : (
                              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm'>
                                {getUserDisplayName(host)?.charAt(0) || 'H'}
                              </div>
                            )}
                            <div>
                              <p className='font-semibold text-gray-900 text-sm'>
                                {getUserDisplayName(host)}
                              </p>
                              <p className='text-xs text-gray-600'>{acceptedOffer.host_email}</p>
                            </div>
                          </div>

                          <div className='grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm'>
                            <div>
                              <span className='text-gray-600'>Price:</span>
                              <p className='text-base sm:text-lg font-bold text-green-600'>
                                ${(acceptedOffer.price_total || acceptedOffer.price)?.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <span className='text-gray-600'>Type:</span>
                              <p className='font-semibold capitalize'>{acceptedOffer.offer_type}</p>
                            </div>
                          </div>

                          {acceptedOffer.inclusions && (
                            <div className='pt-2 border-t border-green-200'>
                              <p className='text-xs font-semibold text-gray-700 mb-1'>
                                Inclusions:
                              </p>
                              <p className='text-xs text-gray-600'>{acceptedOffer.inclusions}</p>
                            </div>
                          )}

                          {acceptedOffer.message && (
                            <div className='pt-2 border-t border-green-200'>
                              <p className='text-xs font-semibold text-gray-700 mb-1'>Message:</p>
                              <p className='text-xs text-gray-600 italic'>
                                "{acceptedOffer.message}"
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Pending Offers */}
                    {pendingOffers.length > 0 && (
                      <>
                        <div className='flex items-center gap-2 mt-4'>
                          <Clock className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600' />
                          <h4 className='font-semibold text-sm'>
                            Pending Offers ({pendingOffers.length})
                          </h4>
                        </div>
                        {pendingOffers.map((offer) => (
                          <Card key={offer.id} className='border-orange-200 bg-orange-50'>
                            <CardContent className='p-3 sm:p-4 space-y-3'>
                              <div className='flex justify-between items-start'>
                                <div className='flex-1'>
                                  <div className='flex items-center gap-2 mb-2'>
                                    <p className='font-semibold text-gray-900 text-sm'>
                                      {offer.host_email}
                                    </p>
                                    <Badge className='bg-orange-500 text-white text-[10px]'>
                                      Pending
                                    </Badge>
                                  </div>

                                  <div className='grid grid-cols-2 gap-2 text-sm'>
                                    <div>
                                      <span className='text-gray-600 text-xs'>Price:</span>
                                      <p className='font-bold text-orange-600'>
                                        ${(offer.price_total || offer.price)?.toFixed(2)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className='text-gray-600 text-xs'>Type:</span>
                                      <p className='font-semibold capitalize text-xs'>
                                        {offer.offer_type}
                                      </p>
                                    </div>
                                  </div>

                                  {offer.inclusions && (
                                    <div className='mt-2 pt-2 border-t border-orange-200'>
                                      <p className='text-xs text-gray-700'>{offer.inclusions}</p>
                                    </div>
                                  )}

                                  {offer.message && (
                                    <div className='mt-2 pt-2 border-t border-orange-200'>
                                      <p className='text-xs text-gray-600 italic'>
                                        "{offer.message}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className='text-[10px] sm:text-xs text-gray-500 flex items-center gap-1'>
                                <Clock className='w-3 h-3' />
                                Sent {format(new Date(offer.created_date), 'MMM d, yyyy HH:mm')}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}

                    {/* Declined Offers */}
                    {declinedOffers.length > 0 && (
                      <>
                        <div className='flex items-center gap-2 mt-4'>
                          <XCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400' />
                          <h4 className='font-semibold text-sm text-gray-600'>
                            Declined Offers ({declinedOffers.length})
                          </h4>
                        </div>
                        {declinedOffers.map((offer) => (
                          <Card key={offer.id} className='border-gray-200 bg-gray-50 opacity-60'>
                            <CardContent className='p-3 sm:p-4'>
                              <div className='flex justify-between items-center'>
                                <div>
                                  <p className='font-semibold text-gray-600 text-sm'>
                                    {offer.host_email}
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    ${(offer.price_total || offer.price)?.toFixed(2)} •{' '}
                                    {offer.offer_type}
                                  </p>
                                </div>
                                <Badge
                                  variant='outline'
                                  className='text-gray-500 border-gray-300 text-[10px]'
                                >
                                  Declined
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            )}

            {/* TAB 3: People */}
            {(isBookingConfirmed || isAdventureBooking) && (
              <TabsContent value='people' className='space-y-3 sm:space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'>
                  {/* Traveler */}
                  <Card>
                    <CardHeader className='p-3 sm:p-4'>
                      <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                        <User className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600' />
                        Traveler
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-3 sm:p-4 space-y-2 sm:space-y-3'>
                      {traveler ? (
                        <>
                          <div className='flex items-center gap-2 sm:gap-3'>
                            {traveler.profile_photo ? (
                              <img
                                src={traveler.profile_photo}
                                alt={getUserDisplayName(traveler)}
                                className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-purple-200'
                              />
                            ) : (
                              <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base'>
                                {getUserDisplayName(traveler).charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className='font-semibold text-sm sm:text-base'>
                                {getUserDisplayName(traveler)}
                              </p>
                              <UserID user={traveler} size='small' />
                            </div>
                          </div>

                          <div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm'>
                            <div className='flex items-center gap-2'>
                              <Mail className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400' />
                              <span className='text-gray-600'>{traveler.email}</span>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={() => copyToClipboard(traveler.email, 'Email')}
                              >
                                <Copy className='w-3 h-3' />
                              </Button>
                            </div>
                            {traveler.phone && (
                              <div className='flex items-center gap-2'>
                                <Phone className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400' />
                                <span className='text-gray-600'>{traveler.phone}</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className='text-xs sm:text-sm text-gray-500'>
                          No traveler information available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Host */}
                  <Card>
                    <CardHeader className='p-3 sm:p-4'>
                      <CardTitle className='text-xs sm:text-sm flex items-center gap-2'>
                        <Building2 className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600' />
                        Host
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-3 sm:p-4 space-y-2 sm:space-y-3'>
                      {host ? (
                        <>
                          <div className='flex items-center gap-2 sm:gap-3'>
                            {host.profile_photo ? (
                              <img
                                src={host.profile_photo}
                                alt={getUserDisplayName(host)}
                                className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-green-200'
                              />
                            ) : (
                              <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm sm:text-base'>
                                {getUserDisplayName(host).charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className='font-semibold text-sm sm:text-base'>
                                {getUserDisplayName(host)}
                              </p>
                              {host.rating && (
                                <div className='flex items-center gap-1 text-[10px] sm:text-xs text-amber-600'>
                                  <Star className='w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current' />
                                  {host.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm'>
                            <div className='flex items-center gap-2'>
                              <Mail className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400' />
                              <span className='text-gray-600'>{host.email}</span>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={() => copyToClipboard(host.email, 'Email')}
                              >
                                <Copy className='w-3 h-3' />
                              </Button>
                            </div>
                            {host.phone && (
                              <div className='flex items-center gap-2'>
                                <Phone className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400' />
                                <span className='text-gray-600'>{host.phone}</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className='text-xs sm:text-sm text-gray-500'>No host assigned yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* TAB 4: Timeline */}
            <TabsContent value='timeline' className='space-y-3 sm:space-y-4'>
              <div className='relative'>
                <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200' />

                <div className='space-y-3 sm:space-y-4'>
                  {/* Created */}
                  <div className='relative flex gap-3 sm:gap-4 items-center'>
                    <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center z-10 flex-shrink-0'>
                      <Clock className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600' />
                    </div>
                    <div className='flex-1'>
                      <p className='font-semibold text-xs sm:text-sm'>Booking Created</p>
                      <p className='text-[10px] sm:text-xs text-gray-500'>
                        {format(new Date(booking.created_date), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>

                  {/* Offers Received - Only for service bookings */}
                  {!isAdventureBooking && offers.length > 0 && (
                    <div className='relative flex gap-3 sm:gap-4 items-center'>
                      <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 flex items-center justify-center z-10 flex-shrink-0'>
                        <Receipt className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-xs sm:text-sm'>
                          {offers.length} Offer(s) Received
                        </p>
                        <p className='text-[10px] sm:text-xs text-gray-500'>
                          {format(new Date(offers[0].created_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Accepted */}
                  {acceptedOffer && (
                    <div className='relative flex gap-3 sm:gap-4 items-center'>
                      <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center z-10 flex-shrink-0'>
                        <CheckCircle2 className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-xs sm:text-sm'>Offer Accepted</p>
                        <p className='text-[10px] sm:text-xs text-gray-500'>
                          {format(
                            new Date(acceptedOffer.updated_date || acceptedOffer.created_date),
                            'MMM d, yyyy HH:mm'
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cancelled */}
                  {booking.status === 'cancelled' && (
                    <div className='relative flex gap-3 sm:gap-4 items-center'>
                      <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center z-10 flex-shrink-0'>
                        <XCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-xs sm:text-sm'>Booking Cancelled</p>
                        {booking.cancelled_at && (
                          <p className='text-[10px] sm:text-xs text-gray-500'>
                            {format(new Date(booking.cancelled_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Check-in Date */}
                  {booking.status !== 'cancelled' && (
                    <div className='relative flex gap-3 sm:gap-4 items-center'>
                      <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center z-10 flex-shrink-0'>
                        <Calendar className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-xs sm:text-sm'>
                          {isAdventureBooking ? 'Adventure Date' : 'Check-in'}
                        </p>
                        <p className='text-[10px] sm:text-xs text-gray-500'>
                          {format(new Date(booking.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 🔽 Footer Actions */}
        <div className='p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => copyToClipboard(booking.id, 'Booking ID')}
            className='h-8 text-xs'
          >
            <Copy className='w-3 h-3 mr-1' />
            Copy ID
          </Button>
          <Button onClick={() => onOpenChange(false)} size='sm' className='h-8 text-xs'>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
