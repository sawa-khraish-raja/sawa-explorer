import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Share2,
} from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { createNotification } from '@/features/shared/notifications/notificationHelpers';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/app/providers/AuthProvider';
import { createPageUrl } from '@/utils';
import { getDocument, addDocument } from '@/utils/firestore';

import { trackAdventureView, trackEvent } from '@/features/admin/components/GoogleAnalytics';
import { showSuccess, showError } from '@/shared/utils/notifications';

export default function AdventureDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth(); //  Use Firebase Auth from context

  const params = new URLSearchParams(window.location.search);
  const adventureId = params.get('id');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  //  Fetch adventure from Firestore
  const { data: adventure, isLoading } = useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: async () => {
      if (!adventureId) return null;

      // Get adventure from Firestore
      const adv = await getDocument('adventures', adventureId);

      //  Track adventure view
      if (adv) {
        trackAdventureView(adv);
      }

      return adv;
    },
    enabled: !!adventureId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  //  Create booking in Firestore
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        // Redirect to login if not authenticated
        navigate('/login');
        throw new Error('Please login to book this adventure');
      }

      console.log('Creating booking with user:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
      });

      console.log('Adventure details:', {
        id: adventure.id,
        title: adventure.title,
        host_id: adventure.host_id,
        price: adventure.traveler_total_price || adventure.price,
      });

      // Create booking in Firestore
      const bookingData = {
        user_id: currentUser.uid,
        user_email: currentUser.email,
        adventure_id: adventure.id,
        adventure_title: adventure.title,
        host_id: adventure.host_id,
        city_id: adventure.city_id,
        city_name: adventure.city_name || adventure.city,
        date: adventure.date,
        start_date: adventure.date,
        end_date: adventure.date,
        adults: 1,
        children: 0,
        total_price: adventure.traveler_total_price || adventure.price || 0,
        currency: adventure.currency || 'USD',
        status: 'pending', // pending, confirmed, cancelled
        payment_status: 'pending', // pending, paid, refunded
      };

      console.log('Booking data to be saved:', bookingData);

      let bookingId;
      try {
        bookingId = await addDocument('bookings', bookingData);
        console.log('Booking created successfully! ID:', bookingId);
      } catch (error) {
        console.error('Booking creation failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
      }

      //  Track adventure booking
      trackEvent('add_to_cart', {
        currency: adventure.currency || 'USD',
        value: adventure.traveler_total_price || adventure.price || 0,
        items: [
          {
            item_id: adventure.id,
            item_name: adventure.title,
            item_category: adventure.category,
            item_category2: adventure.city_name || adventure.city,
            price: adventure.traveler_total_price || adventure.price || 0,
            quantity: 1,
          },
        ],
      });

      return { id: bookingId, ...bookingData };
    },
    onSuccess: async (booking) => {
      showSuccess('Adventure booking created!', 'Check your messages for confirmation');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      //  Send notification to user (booking confirmation)
      try {
        await createNotification({
          recipient_email: currentUser.email,
          recipient_type: 'user',
          type: 'booking_confirmed',
          title: '🎊 Adventure Booking Confirmed',
          message: `Your booking for "${adventure.title}" has been confirmed! Get ready for an amazing experience.`,
          link: `/MyOffers`,
          related_booking_id: booking.id,
        });
      } catch (error) {
        console.error('Failed to send user notification:', error);
      }

      //  Send notification to host (new booking alert)
      if (adventure.host_email) {
        try {
          await createNotification({
            recipient_email: adventure.host_email,
            recipient_type: 'host',
            type: 'adventure_booking',
            title: '🎉 New Adventure Booking',
            message: `${currentUser.email} booked your adventure: "${adventure.title}"`,
            link: `/HostAdventures`,
            related_booking_id: booking.id,
          });
        } catch (error) {
          console.error('Failed to send host notification:', error);
        }
      }

      // Navigate to messages or booking confirmation
      navigate(createPageUrl(`Messages?conversation_id=${booking.id}`));
    },
    onError: (error) => {
      showError('Booking failed', error.message);
    },
  });

  const handleShare = async () => {
    //  Track share
    trackEvent('share', {
      method: 'Web Share API',
      content_type: 'adventure',
      item_id: adventure.id,
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: adventure.title,
          text: adventure.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  if (!adventure) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-4'>
        <h2 className='text-2xl font-bold mb-4'>Adventure not found</h2>
        <Button onClick={() => navigate(createPageUrl('Adventures'))}>Browse Adventures</Button>
      </div>
    );
  }

  //  Calculate spots using Firestore schema
  const spotsLeft = (adventure.max_guests || 0) - (adventure.current_participants || 0);
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-5xl mx-auto'>
        {/* Back Button & Share */}
        <div className='flex items-center justify-between mb-6'>
          <Button variant='ghost' onClick={() => navigate(-1)} className='gap-2'>
            <ArrowLeft className='w-4 h-4' />
            Back
          </Button>
          <Button variant='outline' onClick={handleShare} className='gap-2'>
            <Share2 className='w-4 h-4' />
            Share
          </Button>
        </div>

        <Card className='overflow-hidden'>
          <div className='relative h-96'>
            <img
              src={
                (adventure.images && adventure.images[0]) ||
                adventure.image_url ||
                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200'
              }
              alt={adventure.title}
              className='main-adventure-image w-full h-full object-cover'
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200';
              }}
            />
            <div className='absolute top-4 right-4 flex gap-2'>
              <Badge className='bg-white text-purple-900'>{adventure.category}</Badge>
              {adventure.is_featured && (
                <Badge className='bg-yellow-500 text-white'>⭐ Featured</Badge>
              )}
            </div>
          </div>

          <CardContent className='p-6 space-y-6'>
            {/* Image Gallery */}
            {adventure.images && adventure.images.length > 1 && (
              <div className='grid grid-cols-4 gap-2'>
                {adventure.images.slice(1).map((img, idx) => (
                  <div key={idx} className='relative aspect-square rounded-lg overflow-hidden'>
                    <img
                      src={img}
                      alt={`${adventure.title} - Image ${idx + 2}`}
                      className='w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer'
                      onClick={(e) => {
                        // Show full image in main view
                        const mainImg = document.querySelector('.main-adventure-image');
                        if (mainImg) mainImg.src = img;
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <h1 className='text-3xl font-bold mb-2'>{adventure.title}</h1>
              <p className='text-gray-600'>{adventure.description}</p>
            </div>

            {/* Details Grid */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-purple-600' />
                <div>
                  <div className='text-xs text-gray-500'>Location</div>
                  <div className='font-semibold'>{adventure.city_name || adventure.city}</div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-purple-600' />
                <div>
                  <div className='text-xs text-gray-500'>Date</div>
                  <div className='font-semibold'>
                    {format(new Date(adventure.date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Clock className='w-5 h-5 text-purple-600' />
                <div>
                  <div className='text-xs text-gray-500'>Duration</div>
                  <div className='font-semibold'>{adventure.duration || 'TBD'}</div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Users className='w-5 h-5 text-purple-600' />
                <div>
                  <div className='text-xs text-gray-500'>Spots Left</div>
                  <div
                    className={`font-semibold ${
                      isFull ? 'text-red-600' : isAlmostFull ? 'text-orange-600' : ''
                    }`}
                  >
                    {isFull ? 'Full' : `${spotsLeft}/${adventure.max_guests || 0}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Book */}
            <div className='flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl'>
              <div>
                <div className='text-sm text-gray-600 mb-1'>Price per person</div>
                <div className='flex items-center gap-2'>
                  <DollarSign className='w-6 h-6 text-green-600' />
                  <span className='text-3xl font-bold text-green-600'>
                    {(adventure.price || 0).toFixed(0)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => createBookingMutation.mutate()}
                disabled={isFull || createBookingMutation.isLoading}
                size='lg'
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              >
                {createBookingMutation.isLoading ? (
                  <>
                    <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                    Booking...
                  </>
                ) : isFull ? (
                  'Fully Booked'
                ) : (
                  <>
                    Book Now
                    <ArrowLeft className='w-5 h-5 ml-2 rotate-180' />
                  </>
                )}
              </Button>
            </div>

            {/* What's Included */}
            {adventure.what_included && adventure.what_included.length > 0 && (
              <div>
                <h3 className='font-bold text-lg mb-3'>What's Included</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {adventure.what_included.map((item, idx) => (
                    <div key={idx} className='flex items-center gap-2'>
                      <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0' />
                      <span className='text-gray-700'>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Point */}
            {adventure.meeting_point && (
              <div>
                <h3 className='font-bold text-lg mb-2'>Meeting Point</h3>
                <p className='text-gray-600'>{adventure.meeting_point}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
