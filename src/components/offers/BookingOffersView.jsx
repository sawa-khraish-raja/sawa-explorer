import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Clock, User, MessageCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { queryDocuments, updateDocument, deleteDocument } from '@/utils/firestore';

import { NotificationHelpers } from '../notifications/notificationHelpers';

function AcceptedHostItem({ hostEmail, booking }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: host,
    isLoading: hostLoading,
    isError,
  } = useQuery({
    queryKey: ['acceptedHost', hostEmail],
    queryFn: async () => {
      const users = await queryDocuments('users', [['email', '==', hostEmail]]);
      if (users && users.length > 0) {
        return users[0];
      }
      return null;
    },
    enabled: !!hostEmail,
    retry: 2,
  });

  const { data: hostConversation } = useQuery({
    queryKey: ['hostConversation', booking.id, hostEmail],
    queryFn: async () => {
      const conversations = await queryDocuments('conversations', [
        ['booking_id', '==', booking.id],
      ]);
      return conversations.find((c) => c.host_emails && c.host_emails.includes(hostEmail));
    },
    enabled: !!booking.id && !!hostEmail,
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async ({ offer }) => {
      // 1. Update the offer status
      await updateDocument('offers', offer.id, {
        status: 'accepted',
        updated_date: new Date().toISOString(),
      });
      const updatedOffer = { ...offer, status: 'accepted' };

      // 2. Update the booking status and assign host
      await updateDocument('bookings', booking.id, {
        status: 'confirmed',
        host_email: offer.host_email,
        total_price: offer.price,
        updated_date: new Date().toISOString(),
      });
      const updatedBooking = {
        ...booking,
        status: 'confirmed',
        host_email: offer.host_email,
        total_price: offer.price,
      };

      // 3. Send notifications
      await NotificationHelpers.onOfferAccepted(updatedOffer, updatedBooking);
      await NotificationHelpers.onBookingConfirmed(updatedBooking);

      const conversation = hostConversation;

      return {
        acceptedOffer: updatedOffer,
        updatedBooking,
        conversation_id: conversation?.id,
      };
    },
    onSuccess: async ({ acceptedOffer, updatedBooking, conversation_id }) => {
      queryClient.invalidateQueries({
        queryKey: ['bookingConversations', booking.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['offersForBooking', booking.id],
      });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });

      toast.success('Offer accepted! Your booking is confirmed.', {
        description: 'You can now finalize details with your host.',
      });

      // --- NEW: CLEANUP LOGIC FOR OTHER HOSTS ---
      try {
        const winningHostEmail = acceptedOffer.host_email;
        const bookingId = updatedBooking.id;

        const allConversations = await queryDocuments('conversations', [
          ['booking_id', '==', bookingId],
        ]);
        const allOffers = await queryDocuments('offers', [['booking_id', '==', bookingId]]);

        const conversationsToDelete = allConversations.filter(
          (c) => c.host_emails && !c.host_emails.includes(winningHostEmail)
        );

        for (const convo of conversationsToDelete) {
          console.log(`Deleting conversation ${convo.id} for losing host...`);
          const messagesToDelete = await queryDocuments('messages', [
            ['conversation_id', '==', convo.id],
          ]);
          for (const msg of messagesToDelete) {
            await deleteDocument('messages', msg.id);
          }
          await deleteDocument('conversations', convo.id);
        }

        const offersToDelete = allOffers.filter(
          (o) => o.host_email !== winningHostEmail && o.status === 'pending'
        );

        for (const offer of offersToDelete) {
          console.log(`Deleting offer ${offer.id} for losing host...`);
          await deleteDocument('offers', offer.id);
        }

        queryClient.invalidateQueries({ queryKey: ['hostBookings'] });
        queryClient.invalidateQueries({ queryKey: ['hostConversations'] });
        queryClient.invalidateQueries({ queryKey: ['hostOffers'] });

        console.log(' Cleanup complete.');
      } catch (error) {
        console.error('Error during other hosts cleanup:', error);
        toast.error('Cleanup for other hosts encountered an issue, but your booking is confirmed.');
      }
      // --- END: CLEANUP LOGIC ---

      if (conversation_id) {
        navigate(createPageUrl(`Messages?conversation_id=${conversation_id}`));
      }
    },
    onError: (error) => {
      console.error('Accept Offer Error:', error);
      toast.error('Failed to accept offer. Please try again.');
    },
  });

  const handleChatWithHost = () => {
    try {
      if (hostConversation && hostConversation.id) {
        console.log('Opening conversation:', hostConversation.id);
        // Use full URL with conversation_id parameter
        window.location.href = `/Messages?conversation_id=${hostConversation.id}`;
      } else {
        toast.error('Conversation not found. Please refresh the page.');
        console.error('No conversation found for host:', hostEmail, 'booking:', booking.id);
      }
    } catch (error) {
      toast.error('Could not open chat. Please try again.');
      console.error('Error opening chat:', error);
    }
  };

  const { data: offers } = useQuery({
    queryKey: ['offersFromHost', booking.id, hostEmail],
    queryFn: () =>
      queryDocuments('offers', [
        ['booking_id', '==', booking.id],
        ['host_email', '==', hostEmail],
      ]),
    enabled: !!booking.id && !!hostEmail,
  });

  const pendingOffers = offers?.filter((o) => o.status === 'pending');
  const hasPendingOffer = pendingOffers && pendingOffers.length > 0;

  if (hostLoading) {
    return (
      <div className='bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-100 animate-pulse'>
        <div className='flex items-center gap-4'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex-shrink-0' />
          <div className='flex-1 space-y-3'>
            <div className='h-5 w-32 bg-gray-200 rounded' />
            <div className='h-4 w-24 bg-gray-200 rounded' />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !host) {
    return (
      <div className='bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 shadow-sm border-2 border-[var(--brand-bg-accent)]'>
        <div className='flex items-center gap-4 mb-4'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 bg-[var(--brand-bg-accent)] rounded-full flex items-center justify-center flex-shrink-0'>
            <User className='w-8 h-8 sm:w-10 sm:h-10 text-[var(--brand-primary)]' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-bold text-base sm:text-lg text-[var(--brand-primary)] truncate'>
              Host
            </p>
            <p className='text-xs sm:text-sm text-gray-600 truncate'>{hostEmail}</p>
          </div>
        </div>
        <Button
          onClick={handleChatWithHost}
          disabled={!hostConversation}
          className='w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-md'
        >
          <MessageCircle className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
          Chat Now
        </Button>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-2xl p-4 shadow-md border-2 border-[var(--brand-bg-accent)] hover:border-[var(--brand-primary)] hover:shadow-lg transition-all duration-300'>
      <div className='flex items-center gap-4 mb-4'>
        <Avatar className='w-16 h-16 sm:w-20 sm:h-20 border-3 border-[var(--brand-primary)] flex-shrink-0'>
          <AvatarImage src={host.profile_photo} alt={host.full_name} />
          <AvatarFallback className='bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white text-xl sm:text-2xl font-bold'>
            {host.full_name
              ? host.full_name.charAt(0).toUpperCase()
              : host.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1 min-w-0'>
          <p className='font-bold text-base sm:text-xl text-gray-900 mb-1 truncate'>
            {host.full_name || host.email}
          </p>
          {host.city && <p className='text-xs sm:text-sm text-gray-600 mb-1'>{host.city}</p>}
          {host.rating && (
            <div className='flex items-center gap-1'>
              <Star className='w-4 h-4 fill-amber-400 text-amber-400' />
              <span className='text-sm sm:text-base font-semibold text-gray-900'>
                {host.rating.toFixed(1)}
              </span>
            </div>
          )}
          {!hostConversation && <p className='text-xs text-red-500 mt-1'>No conversation found</p>}
        </div>
      </div>
      {hasPendingOffer ? (
        <Button
          onClick={() => acceptOfferMutation.mutate({ offer: pendingOffers[0] })}
          disabled={acceptOfferMutation.isPending}
          className='w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-md'
        >
          {acceptOfferMutation.isPending ? (
            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
          ) : (
            <Star className='w-5 h-5 mr-2' />
          )}
          Accept Offer (${pendingOffers[0].price})
        </Button>
      ) : (
        <Button
          onClick={handleChatWithHost}
          disabled={!hostConversation}
          className='w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:from-[var(--brand-primary-hover)] hover:to-[var(--brand-secondary-hover)] text-white h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <MessageCircle className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
          Chat with Host
        </Button>
      )}
    </div>
  );
}

export default function BookingOffersView({ booking, onBack }) {
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['bookingConversations', booking.id],
    queryFn: async () => {
      return queryDocuments('conversations', [['booking_id', '==', booking.id]]);
    },
    enabled: !!booking.id,
    refetchInterval: 5000,
  });

  const { data: offers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ['offersForBooking', booking.id],
    queryFn: () => queryDocuments('offers', [['booking_id', '==', booking.id]]),
    enabled: !!booking.id,
  });

  const isLoading = isLoadingConversations || isLoadingOffers;

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-full pt-20'>
        <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
      </div>
    );
  }

  // Get ALL unique host emails from all conversations for this booking
  const acceptedHosts = [];
  if (conversations && conversations.length > 0) {
    conversations.forEach((convo) => {
      if (convo.host_emails && convo.host_emails.length > 0) {
        convo.host_emails.forEach((email) => {
          if (!acceptedHosts.includes(email)) {
            acceptedHosts.push(email);
          }
        });
      }
    });
  }

  const hasAcceptedHosts = acceptedHosts.length > 0;
  const pendingOffers = offers?.filter((o) => o.status === 'pending') || [];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 px-4 py-6 sm:p-6'>
      <Button
        variant='ghost'
        onClick={onBack}
        className='mb-4 -ml-2 hover:bg-[var(--brand-bg-accent-light)]'
      >
        <ArrowLeft className='w-5 h-5 sm:w-6 sm:h-6' />
      </Button>

      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--brand-primary)] mb-2'>
          Choose Your Host
        </h1>
        <p className='text-sm sm:text-base text-gray-600'>
          {hasAcceptedHosts
            ? `${acceptedHosts.length} host${
                acceptedHosts.length > 1 ? 's' : ''
              } accepted your booking request for ${booking.city}`
            : `Waiting for hosts in ${booking.city} to accept your request`}
        </p>
      </div>

      <div className='space-y-4'>
        {hasAcceptedHosts ? (
          <>
            {acceptedHosts.map((hostEmail) => (
              <AcceptedHostItem key={hostEmail} hostEmail={hostEmail} booking={booking} />
            ))}

            {pendingOffers.length > 0 && (
              <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200 shadow-sm'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-white text-xl'>✓</span>
                  </div>
                  <p className='text-sm sm:text-base text-green-800 font-semibold'>
                    {pendingOffers.length} price {pendingOffers.length === 1 ? 'offer' : 'offers'}{' '}
                    received! Check your messages to see details.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className='bg-white rounded-2xl p-6 sm:p-8 text-center shadow-lg border-2 border-[var(--brand-bg-accent)]'>
            <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[var(--brand-bg-accent)] to-[var(--brand-bg-accent-light)] rounded-full flex items-center justify-center mx-auto mb-4'>
              <Clock className='w-8 h-8 sm:w-10 sm:h-10 text-[var(--brand-primary)]' />
            </div>
            <h3 className='text-lg sm:text-xl font-bold text-[var(--brand-primary)] mb-2'>
              Waiting for Host Approval
            </h3>
            <p className='text-sm sm:text-base text-gray-600 mb-4'>
              Your booking request has been sent to all local hosts in {booking.city}. They will
              review and accept your request soon.
            </p>
            <p className='text-xs sm:text-sm text-gray-500'>
              This usually takes a few hours. We'll notify you when hosts accept!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
