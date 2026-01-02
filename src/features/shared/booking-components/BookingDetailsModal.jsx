import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils';
import { createPageUrl } from '@/utils';
import { queryDocuments, getDocument, updateDocument, deleteDocument } from '@/utils/firestore';

import { NotificationHelpers } from '@/features/shared/notifications/notificationHelpers';

import { BookingID, UserID } from '@/shared/components/BookingID';
import { normalizeText } from '@/shared/utils/textHelpers';
import { getUserDisplayName } from '@/shared/utils/userHelpers';

import BookingServicesDisplay from './BookingServicesDisplay';

export default function BookingDetailsModal({
  booking: bookingProp,
  open,
  onOpenChange,
  defaultTab = 'overview',
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const bookingRef = useRef(bookingProp);

  useEffect(() => {
    if (bookingProp && open) {
      bookingRef.current = bookingProp;
    }
  }, [bookingProp, open]);

  useEffect(() => {
    if (open && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const booking = open ? (bookingProp || bookingRef.current) : bookingRef.current;

  const isAdventureBooking = !!booking?.adventure_id;

  const acceptOfferMutation = useMutation({
    mutationFn: async (offer) => {
      const currentBooking = await getDocument('bookings', booking.id);
      if (currentBooking?.status === 'confirmed' || currentBooking?.accepted_offer_id) {
        throw new Error('This booking already has an accepted offer');
      }

      const totalPrice = offer.price_breakdown?.total || offer.price_total || offer.price || 0;

      await updateDocument('offers', offer.id, {
        status: 'accepted',
        updated_date: new Date().toISOString(),
      });
      const updatedOffer = { ...offer, status: 'accepted' };

      await updateDocument('bookings', booking.id, {
        status: 'confirmed',
        host_email: offer.host_email,
        host_name: offer.host_name,
        accepted_offer_id: offer.id,
        total_price: totalPrice,
        updated_date: new Date().toISOString(),
      });
      const updatedBooking = {
        ...booking,
        status: 'confirmed',
        host_email: offer.host_email,
        host_name: offer.host_name,
        accepted_offer_id: offer.id,
        total_price: totalPrice,
      };

      await NotificationHelpers.onOfferAccepted(updatedOffer, updatedBooking);
      await NotificationHelpers.onBookingConfirmed(updatedBooking);

      const winningHostEmail = offer.host_email;
      const bookingId = booking.id;

      try {
        const allConversations = await queryDocuments('conversations', [
          ['booking_id', '==', bookingId],
        ]);

        const conversationsToDelete = allConversations.filter(
          (c) => c.host_emails && !c.host_emails.includes(winningHostEmail)
        );

        for (const convo of conversationsToDelete) {
          try {
            const messagesToDelete = await queryDocuments('messages', [
              ['conversation_id', '==', convo.id],
            ]);
            for (const msg of messagesToDelete) {
              await deleteDocument('messages', msg.id);
            }
            await deleteDocument('conversations', convo.id);
          } catch (deleteErr) {
            console.warn('Could not delete conversation:', deleteErr.message);
          }
        }
      } catch (convErr) {
        console.warn('Could not clean up conversations:', convErr.message);
      }

      try {
        const allOffers = await queryDocuments('offers', [['booking_id', '==', bookingId]]);

        const otherOffers = allOffers.filter(
          (o) => o.id !== offer.id && o.status === 'pending'
        );

        for (const otherOffer of otherOffers) {
          try {
            await updateDocument('offers', otherOffer.id, {
              status: 'not_selected',
              closed_reason: 'another_host_selected',
              updated_date: new Date().toISOString(),
            });

            await NotificationHelpers.createNotification({
              recipient_email: otherOffer.host_email,
              recipient_type: 'host',
              type: 'booking_taken',
              title: 'Booking No Longer Available',
              message: `The traveler has accepted another host's offer for their ${updatedBooking.city_name || updatedBooking.city || ''} trip.`,
              link: `/HostDashboard`,
              related_booking_id: updatedBooking.id,
              read: false,
            });
          } catch (offerErr) {
            console.warn('Could not update other offer:', offerErr.message);
          }
        }
      } catch (offersErr) {
        console.warn('Could not clean up other offers:', offersErr.message);
      }

      return { acceptedOffer: updatedOffer, updatedBooking };
    },
    onSuccess: () => {
      toast.success('Offer accepted! Your booking is confirmed.');

      queryClient.invalidateQueries({ queryKey: ['bookingOffers'] });
      queryClient.invalidateQueries({ queryKey: ['travelerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['myOffers'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['hostBookings'] });
      queryClient.invalidateQueries({ queryKey: ['hostConversations'] });
      queryClient.invalidateQueries({ queryKey: ['hostOffers'] });
      queryClient.invalidateQueries({ queryKey: ['availableBookings'] });
      queryClient.invalidateQueries({ queryKey: ['rejectedBookings'] });
      queryClient.invalidateQueries({ queryKey: ['closedOffers'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to accept offer');
    },
  });

  const declineOfferMutation = useMutation({
    mutationFn: async (offerId) => {
      await updateDocument('offers', offerId, {
        status: 'declined',
        declined_date: new Date().toISOString(),
      });
      if (booking?.id) {
        const currentBooking = await getDocument('bookings', booking.id);
        const hostResponses = currentBooking?.host_responses || {};
        const offer = await getDocument('offers', offerId);
        if (offer?.host_email) {
          hostResponses[offer.host_email] = {
            ...hostResponses[offer.host_email],
            action: 'declined_by_traveler',
            declined_by_traveler_date: new Date().toISOString(),
          };
          await updateDocument('bookings', booking.id, { host_responses: hostResponses });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingOffers'] });
      queryClient.invalidateQueries({ queryKey: ['travelerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['myOffers'] });
      toast.success('Offer declined');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to decline offer');
    },
  });

  // FIXED: Disable all queries when modal is closed
  const queryEnabled = open && !!booking?.id;

  // Fetch related data (Hooks must be called unconditionally at the top level)
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['bookingOffers', booking?.id, booking?.traveler_email],
    queryFn: async () => {
      if (!booking?.id || !booking?.traveler_email || isAdventureBooking) return [];
      const result = await queryDocuments('offers', [
        ['booking_id', '==', booking.id],
        ['traveler_email', '==', booking.traveler_email],
      ]);
      return result;
    },
    enabled: queryEnabled && !isAdventureBooking && !!booking?.traveler_email,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Get all conversations for this booking
  const { data: conversations = [] } = useQuery({
    queryKey: ['bookingConversations', booking?.id, booking?.traveler_email],
    queryFn: async () => {
      if (!booking?.id || !booking?.traveler_email) return [];
      return queryDocuments('conversations', [
        ['booking_id', '==', booking.id],
        ['traveler_email', '==', booking.traveler_email],
      ]);
    },
    enabled: queryEnabled && !!booking?.traveler_email,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
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
    enabled: queryEnabled && offers.length > 0 && !isAdventureBooking,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
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
    queryKey: ['cancellationRequest', booking?.id, booking?.traveler_email],
    queryFn: async () => {
      if (!booking?.id || !booking?.traveler_email) return null;
      try {
        const requests = await queryDocuments('cancellation_requests', [
          ['booking_id', '==', booking.id],
          ['traveler_email', '==', booking.traveler_email],
        ]);
        return requests[0] || null;
      } catch {
        return null;
      }
    },
    enabled: queryEnabled && booking?.status === 'cancelled' && !!booking?.traveler_email,
    staleTime: 10 * 60 * 1000,
  });

  const allHostEmails = useMemo(() => {
    const emails = new Set();
    if (Array.isArray(booking?.target_hosts)) {
      booking.target_hosts.forEach((email) => emails.add(email));
    }
    offers.forEach((o) => o.host_email && emails.add(o.host_email));
    conversations.forEach((c) => {
      if (Array.isArray(c.host_emails)) {
        c.host_emails.forEach((e) => emails.add(e));
      }
    });
    const hostResponses = booking?.host_responses || {};
    Object.keys(hostResponses).forEach((email) => emails.add(email));
    return Array.from(emails);
  }, [booking?.target_hosts, offers, conversations, booking?.host_responses]);

  const { data: allHostsData = [], isLoading: hostsDataLoading } = useQuery({
    queryKey: ['bookingHostsData', allHostEmails],
    queryFn: async () => {
      if (allHostEmails.length === 0) return [];
      const hostPromises = allHostEmails.map((email) =>
        queryDocuments('users', [['email', '==', email]])
          .then((res) => res[0])
          .catch(() => ({ email, first_name: email.split('@')[0] }))
      );
      return (await Promise.all(hostPromises)).filter(Boolean);
    },
    enabled: queryEnabled && !isAdventureBooking && allHostEmails.length > 0,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });

  // Calculate derived data with useMemo BEFORE any conditional returns
  const acceptedOffer = useMemo(
    () => offers.find((o) => o.id === booking?.accepted_offer_id),
    [offers, booking?.accepted_offer_id]
  );

  const pendingOffers = useMemo(() => {
    const confirmed = booking?.status === 'confirmed' || booking?.state === 'confirmed' || !!acceptedOffer;
    if (confirmed) return [];
    return offers.filter((o) => o.status === 'pending');
  }, [offers, booking?.status, booking?.state, acceptedOffer]);

  const declinedOffers = useMemo(() => offers.filter((o) => o.status === 'declined'), [offers]);

  const allRelevantHosts = useMemo(() => {
    const hostsMap = new Map();

    allHostsData.forEach((host) => {
      if (host.email) {
        hostsMap.set(host.email, host);
      }
    });

    allHostEmails.forEach((email) => {
      if (!hostsMap.has(email)) {
        hostsMap.set(email, {
          email,
          first_name: email.split('@')[0],
        });
      }
    });

    return Array.from(hostsMap.values());
  }, [allHostsData, allHostEmails]);

  const pendingHosts = useMemo(() => {
    const offerHostEmails = offers.map((o) => o.host_email);
    const hostResponses = booking?.host_responses || {};
    return allRelevantHosts.filter((host) => {
      const hasOffer = offerHostEmails.includes(host.email);
      const hasResponse = hostResponses[host.email];
      return !hasOffer && !hasResponse;
    });
  }, [allRelevantHosts, offers, booking?.host_responses]);

  const declinedByHosts = useMemo(() => {
    const hostResponses = booking?.host_responses || {};
    return allRelevantHosts.filter((host) => {
      const response = hostResponses[host.email];
      return response?.action === 'rejected';
    });
  }, [allRelevantHosts, booking?.host_responses]);

  const isBookingConfirmed = useMemo(
    () => booking?.status === 'confirmed' || booking?.state === 'confirmed' || !!acceptedOffer,
    [booking?.status, booking?.state, acceptedOffer]
  );

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
              <DialogTitle className='text-lg sm:text-2xl font-bold text-gray-900 mb-1 truncate flex items-center gap-2'>
                <MapPin className='w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0' />
                {normalizeText(booking.city || booking.city_name)}
              </DialogTitle>
              {isAdventureBooking && adventure && (
                <p className='text-sm sm:text-base font-medium text-purple-700 mb-1 truncate'>
                  {adventure.title}
                </p>
              )}
              <p className='text-xs sm:text-sm text-gray-600 flex items-center gap-1'>
                <Calendar className='w-3 h-3 sm:w-4 sm:h-4' />
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
              <TabsContent value='offers' className='space-y-4'>
                {/* Loading State */}
                {(offersLoading || hostsDataLoading) && (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='w-6 h-6 animate-spin text-purple-500 mr-2' />
                    <span className='text-sm text-gray-500'>Loading hosts...</span>
                  </div>
                )}

                {/* Unified Hosts List */}
                {!offersLoading && !hostsDataLoading && (
                  <div className='space-y-2'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='font-semibold text-sm flex items-center gap-2'>
                        <Users className='w-4 h-4 text-purple-600' />
                        Host Responses ({allRelevantHosts.length})
                      </h4>
                      {pendingOffers.length > 0 && (
                        <Badge className='bg-orange-500 text-white'>
                          {pendingOffers.length} offer{pendingOffers.length > 1 ? 's' : ''} to review
                        </Badge>
                      )}
                    </div>

                    {allRelevantHosts.length === 0 ? (
                      <Card className='text-center py-8'>
                        <CardContent className='p-4'>
                          <Users className='w-10 h-10 mx-auto mb-3 text-gray-300' />
                          <p className='text-sm text-gray-600'>Waiting for hosts to respond...</p>
                          <p className='text-xs text-gray-400 mt-1'>Hosts in this city will see your request</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className='space-y-3'>
                        {/* Header Row */}
                        <div className='flex items-center gap-6 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200'>
                          <div className='w-10 flex-shrink-0'></div>
                          <div className='flex-1 min-w-0'>Host</div>
                          <div className='w-24 text-center flex-shrink-0'>Price</div>
                          <div className='w-16 flex-shrink-0 text-center'>Chat</div>
                          <div className='w-44 text-center flex-shrink-0'>Actions</div>
                        </div>

                        {allRelevantHosts.map((hostItem) => {
                          const hostOffer = offers.find((o) => o.host_email === hostItem.email);
                          const hostResponse = booking?.host_responses?.[hostItem.email];
                          const hostConversation = conversations.find(
                            (c) => c.host_emails && c.host_emails.includes(hostItem.email)
                          );
                          const isAccepted = hostOffer?.status === 'accepted' || acceptedOffer?.host_email === hostItem.email;
                          const wasDeclinedByHost = hostResponse?.action === 'rejected';
                          const wasDeclinedByTraveler = hostOffer?.status === 'declined';
                          const wasNotSelected = hostOffer?.status === 'not_selected' ||
                            (isBookingConfirmed && hostOffer && !isAccepted && hostOffer.status !== 'declined');
                          const hasPendingOffer = hostOffer?.status === 'pending' && !isBookingConfirmed;
                          const isAwaiting = !hostOffer && !wasDeclinedByHost;
                          const didNotRespond = isAwaiting && isBookingConfirmed;

                          const isAccepting = acceptOfferMutation.isPending && acceptOfferMutation.variables?.id === hostOffer?.id;
                          const isDeclining = declineOfferMutation.isPending && declineOfferMutation.variables === hostOffer?.id;
                          const totalPrice = hostOffer?.price_breakdown?.total || hostOffer?.price_total || hostOffer?.price;

                          let rowStyle = 'bg-gray-50 border-gray-200';
                          let statusBadge = null;

                          if (isAccepted) {
                            rowStyle = 'bg-green-50 border-green-300';
                            statusBadge = <Badge className='bg-green-600 text-white text-[10px]'>Accepted</Badge>;
                          } else if (hasPendingOffer) {
                            rowStyle = 'bg-orange-50 border-orange-200';
                          } else if (wasNotSelected) {
                            rowStyle = 'bg-gray-50 border-gray-200 opacity-60';
                            statusBadge = <Badge variant='outline' className='text-gray-500 border-gray-300 text-[10px]'>Not Selected</Badge>;
                          } else if (wasDeclinedByHost) {
                            rowStyle = 'bg-gray-50 border-gray-200 opacity-50';
                            statusBadge = <Badge variant='outline' className='text-gray-500 border-gray-300 text-[10px]'>Declined</Badge>;
                          } else if (wasDeclinedByTraveler) {
                            rowStyle = 'bg-gray-50 border-gray-200 opacity-50';
                            statusBadge = <Badge variant='outline' className='text-red-500 border-red-300 text-[10px]'>You Declined</Badge>;
                          } else if (didNotRespond) {
                            rowStyle = 'bg-gray-50 border-gray-200 opacity-50';
                            statusBadge = <Badge variant='outline' className='text-gray-400 border-gray-200 text-[10px]'>No Response</Badge>;
                          } else if (isAwaiting) {
                            rowStyle = 'bg-blue-50 border-blue-200';
                            statusBadge = <Badge className='bg-blue-100 text-blue-700 text-[10px]'>Awaiting</Badge>;
                          }

                          return (
                            <div
                              key={hostItem.email}
                              className={`flex items-center gap-6 p-4 rounded-lg border ${rowStyle} transition-colors`}
                            >
                              {/* Avatar */}
                              {hostItem.profile_photo ? (
                                <img
                                  src={hostItem.profile_photo}
                                  alt={getUserDisplayName(hostItem)}
                                  className='w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0'
                                />
                              ) : (
                                <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                                  {getUserDisplayName(hostItem)?.charAt(0) || 'H'}
                                </div>
                              )}

                              {/* Host Info */}
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2'>
                                  <p className='font-semibold text-gray-900 text-sm truncate'>
                                    {getUserDisplayName(hostItem)}
                                  </p>
                                  {hostItem.rating && (
                                    <div className='flex items-center gap-0.5 text-xs text-amber-600'>
                                      <Star className='w-3 h-3 fill-current' />
                                      {hostItem.rating.toFixed(1)}
                                    </div>
                                  )}
                                </div>
                                <p className='text-xs text-gray-500 truncate'>
                                  {hasPendingOffer ? (hostOffer.inclusions || 'Offer received') :
                                   isAccepted ? 'Your host for this trip' :
                                   wasNotSelected ? 'You selected another host' :
                                   didNotRespond ? 'Did not send an offer' :
                                   isAwaiting ? 'Waiting for response...' : ''}
                                </p>
                                {hostOffer && (
                                  <div className='flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-gray-400 mt-0.5'>
                                    {hostOffer.created_date && (
                                      <span className='flex items-center gap-1'>
                                        <Clock className='w-2.5 h-2.5' />
                                        Sent: {format(new Date(hostOffer.created_date), 'MMM d, h:mm a')}
                                      </span>
                                    )}
                                    {isAccepted && (hostOffer.accepted_at || hostOffer.updated_date) && (
                                      <span className='flex items-center gap-1 text-green-500'>
                                        <CheckCircle2 className='w-2.5 h-2.5' />
                                        Accepted: {format(new Date(hostOffer.accepted_at || hostOffer.updated_date), 'MMM d, h:mm a')}
                                      </span>
                                    )}
                                    {wasDeclinedByTraveler && (hostOffer.declined_date || hostOffer.updated_date) && (
                                      <span className='flex items-center gap-1 text-red-400'>
                                        <XCircle className='w-2.5 h-2.5' />
                                        Declined: {format(new Date(hostOffer.declined_date || hostOffer.updated_date), 'MMM d, h:mm a')}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Price Column */}
                              <div className='w-24 text-center flex-shrink-0'>
                                {(hasPendingOffer || isAccepted || wasNotSelected) && totalPrice ? (
                                  <p className={`font-bold text-lg ${
                                    isAccepted ? 'text-green-600' :
                                    wasNotSelected ? 'text-gray-400 line-through' :
                                    'text-green-600'
                                  }`}>
                                    ${totalPrice?.toFixed(2)}
                                  </p>
                                ) : (
                                  <span className='text-xs text-gray-400'>-</span>
                                )}
                              </div>

                              {/* Chat Column */}
                              <div className='w-16 flex-shrink-0 flex justify-center'>
                                {hostConversation?.id && !wasNotSelected ? (
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='h-8 w-8 p-0 border-purple-200 text-purple-600 hover:bg-purple-50'
                                    onClick={() => openChat(hostConversation.id)}
                                  >
                                    <MessageSquare className='w-4 h-4' />
                                  </Button>
                                ) : (
                                  <span className='text-xs text-gray-300'>-</span>
                                )}
                              </div>

                              {/* Status/Actions Column */}
                              <div className='w-44 flex justify-center flex-shrink-0'>
                                {hasPendingOffer && !isAccepted ? (
                                  <div className='flex gap-3'>
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      className='h-8 px-4 border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium'
                                      onClick={() => declineOfferMutation.mutate(hostOffer.id)}
                                      disabled={isDeclining || isAccepting}
                                    >
                                      {isDeclining ? <Loader2 className='w-3 h-3 animate-spin' /> : 'Reject'}
                                    </Button>
                                    <Button
                                      size='sm'
                                      className='h-8 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium'
                                      onClick={() => acceptOfferMutation.mutate(hostOffer)}
                                      disabled={isDeclining || isAccepting}
                                    >
                                      {isAccepting ? <Loader2 className='w-3 h-3 animate-spin' /> : 'Accept'}
                                    </Button>
                                  </div>
                                ) : (
                                  statusBadge
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
