import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Check,
  X,
  DollarSign,
  Calendar,
  Package,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';

export default function OfferCard({
  offer,
  booking,
  onAccept,
  onDecline,
  viewerType = 'traveler',
}) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

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

  //  FIXED: Accept offer mutation - use offer.booking_id if booking prop is undefined
  const acceptMutation = useMutation({
    mutationFn: async (offerId) => {
      console.log('🚀 [OfferCard] Starting accept for offer:', offerId);

      if (!offerId || typeof offerId !== 'string') {
        throw new Error('Invalid offer ID');
      }

      if (!offer.booking_id) {
        throw new Error('Booking ID not found in offer');
      }

      setIsProcessing(true);

      //  Use offer.booking_id directly
      const response = await base44.functions.invoke('confirmBooking', {
        booking_id: offer.booking_id,
        offer_id: offerId,
      });

      console.log(' [OfferCard] Backend response:', response.data);

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to accept offer');
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log(' [OfferCard] Offer accepted successfully');

      showSuccess(
        'Offer Accepted! 🎉',
        'Your booking is now confirmed. Check your messages for details.'
      );

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['travelerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['myOffers'] });
      queryClient.invalidateQueries({ queryKey: ['bookingOffers'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      // Call parent callback if provided
      if (onAccept) {
        onAccept();
      }

      setIsProcessing(false);
    },
    onError: (error) => {
      console.error(' [OfferCard] Accept error:', error.message);

      showError('Failed to Accept Offer', error.message || 'Please try again or contact support.');

      setIsProcessing(false);
    },
  });

  //  FIXED: Decline offer mutation
  const declineMutation = useMutation({
    mutationFn: async (offerId) => {
      console.log('🚀 [OfferCard] Declining offer:', offerId);

      if (!offerId || typeof offerId !== 'string') {
        throw new Error('Invalid offer ID');
      }

      setIsProcessing(true);

      await base44.entities.Offer.update(offerId, {
        status: 'declined',
      });

      return { success: true };
    },
    onSuccess: () => {
      console.log(' [OfferCard] Offer declined');

      showSuccess('Offer Declined', 'The host has been notified.');

      queryClient.invalidateQueries({ queryKey: ['myOffers'] });
      queryClient.invalidateQueries({ queryKey: ['bookingOffers'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      if (onDecline) {
        onDecline();
      }

      setIsProcessing(false);
    },
    onError: (error) => {
      console.error(' [OfferCard] Decline error:', error.message);

      showError('Failed to Decline Offer', 'Please try again.');

      setIsProcessing(false);
    },
  });

  //  FIXED: Handle accept click - only pass offer ID
  const handleAccept = () => {
    if (isProcessing) return;

    console.log('🔵 [OfferCard] Accept button clicked for offer:', offer.id);
    acceptMutation.mutate(offer.id);
  };

  //  FIXED: Handle decline click - only pass offer ID
  const handleDecline = () => {
    if (isProcessing) return;

    console.log('🔵 [OfferCard] Decline button clicked for offer:', offer.id);
    declineMutation.mutate(offer.id);
  };

  const isPending = offer.status === 'pending';
  const isAccepted = offer.status === 'accepted';
  const isDeclined = offer.status === 'declined';
  const isExpired = offer.status === 'expired';

  //  FIXED: Check traveler email from booking OR offer
  const travelerEmail = booking?.traveler_email || offer.traveler_email;
  const isTraveler = viewerType === 'traveler' || user?.email === travelerEmail;
  const isHost = viewerType === 'host' || user?.email === offer?.host_email;

  // Status badge
  const statusBadge = () => {
    if (isAccepted) {
      return (
        <Badge className='bg-green-100 text-green-800 border-green-200'>
          <CheckCircle2 className='w-3 h-3 mr-1' />
          Accepted
        </Badge>
      );
    }
    if (isDeclined) {
      return (
        <Badge className='bg-red-100 text-red-800 border-red-200'>
          <X className='w-3 h-3 mr-1' />
          Declined
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge className='bg-orange-100 text-orange-800 border-orange-200'>
          <AlertCircle className='w-3 h-3 mr-1' />
          Expired
        </Badge>
      );
    }
    return <Badge className='bg-blue-100 text-blue-800 border-blue-200'>⏳ Pending</Badge>;
  };

  return (
    <Card className='border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-bold text-gray-900 flex items-center gap-2'>
            <Package className='w-5 h-5 text-purple-600' />
            {offer.offer_type === 'rental' ? 'Rental Offer' : 'Service Offer'}
          </CardTitle>
          {statusBadge()}
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Price */}
        <div className='flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
              <DollarSign className='w-4 h-4 text-green-600' />
            </div>
            <span className='text-sm text-gray-600'>Total Price</span>
          </div>
          <span className='text-2xl font-bold text-gray-900'>
            ${offer.price_total || offer.price_base}
          </span>
        </div>

        {/* Price Breakdown */}
        {offer.price_breakdown && offer.offer_type === 'service' && (
          <div className='p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1'>
            <div className='flex justify-between text-gray-600'>
              <span>Base Price</span>
              <span className='font-semibold'>${offer.price_breakdown.base_price}</span>
            </div>
            {offer.price_breakdown.sawa_fee > 0 && (
              <div className='flex justify-between text-gray-600'>
                <span>SAWA Fee ({offer.price_breakdown.sawa_percent}%)</span>
                <span className='font-semibold'>${offer.price_breakdown.sawa_fee}</span>
              </div>
            )}
            {offer.price_breakdown.office_fee > 0 && (
              <div className='flex justify-between text-gray-600'>
                <span>Office Fee ({offer.price_breakdown.office_percent}%)</span>
                <span className='font-semibold'>${offer.price_breakdown.office_fee}</span>
              </div>
            )}
            <div className='flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-300'>
              <span>Total</span>
              <span>${offer.price_breakdown.total}</span>
            </div>
          </div>
        )}

        {/* Inclusions */}
        {offer.inclusions && (
          <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <p className='text-xs font-semibold text-gray-900 mb-1'>What's Included:</p>
            <p className='text-xs text-gray-700 whitespace-pre-wrap'>{offer.inclusions}</p>
          </div>
        )}

        {/* Rental Details */}
        {offer.rental_details && (
          <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <p className='text-xs font-semibold text-gray-900 mb-1'>Rental Details:</p>
            <p className='text-xs text-gray-700 whitespace-pre-wrap'>{offer.rental_details}</p>
          </div>
        )}

        {/* Host Message */}
        {offer.message && (
          <div className='p-3 bg-purple-50 rounded-lg border border-purple-200'>
            <p className='text-xs font-semibold text-gray-900 mb-1'>Message from Host:</p>
            <p className='text-xs text-gray-700 whitespace-pre-wrap'>{offer.message}</p>
          </div>
        )}

        {/* Expiry Date */}
        {offer.expiry_date && isPending && (
          <div className='flex items-center gap-2 text-xs text-gray-600 p-2 bg-orange-50 rounded-lg border border-orange-200'>
            <Calendar className='w-3 h-3 text-orange-600' />
            <span>Expires on {format(new Date(offer.expiry_date), 'MMM dd, yyyy')}</span>
          </div>
        )}

        {/* Action Buttons - Only for travelers with pending offers */}
        {isTraveler && isPending && !isProcessing && (
          <div className='flex gap-2 pt-2'>
            <Button
              onClick={handleAccept}
              disabled={isProcessing || acceptMutation.isLoading}
              className='flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
            >
              {acceptMutation.isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Accepting...
                </>
              ) : (
                <>
                  <Check className='w-4 h-4 mr-2' />
                  Accept Offer
                </>
              )}
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isProcessing || declineMutation.isLoading}
              variant='outline'
              className='flex-1 border-2 border-red-300 text-red-600 hover:bg-red-50'
            >
              {declineMutation.isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Declining...
                </>
              ) : (
                <>
                  <X className='w-4 h-4 mr-2' />
                  Decline
                </>
              )}
            </Button>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className='flex items-center justify-center gap-2 text-sm text-gray-600 py-2'>
            <Loader2 className='w-4 h-4 animate-spin' />
            <span>Processing your request...</span>
          </div>
        )}

        {/* Info for hosts */}
        {isHost && isPending && (
          <div className='text-xs text-center text-gray-500 pt-2 border-t border-gray-200'>
            Waiting for traveler's response
          </div>
        )}
      </CardContent>
    </Card>
  );
}
