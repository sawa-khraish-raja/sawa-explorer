
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Calendar, Users, DollarSign, Clock, MapPin,
  ArrowLeft, Star, CheckCircle2, Loader2, Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '../components/utils/notifications';
import { trackAdventureView, trackEvent } from '../components/analytics/GoogleAnalytics';

export default function AdventureDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const adventureId = params.get('id');

  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  const { data: adventure, isLoading } = useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: async () => {
      if (!adventureId) return null;
      const adv = await base44.entities.Adventure.get(adventureId);

      // ✅ Track adventure view
      if (adv) {
        trackAdventureView(adv);
      }

      return adv;
    },
    enabled: !!adventureId,
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      const booking = await base44.entities.Booking.create({
        traveler_email: user.email,
        city: adventure.city,
        start_date: adventure.date,
        end_date: adventure.date,
        number_of_adults: 1,
        number_of_children: 0,
        adventure_id: adventure.id,
        total_price: adventure.traveler_total_price,
        state: 'open'
      });

      // ✅ Track adventure booking
      trackEvent('add_to_cart', {
        currency: 'USD',
        value: adventure.traveler_total_price || 0,
        items: [{
          item_id: adventure.id,
          item_name: adventure.title,
          item_category: adventure.category,
          item_category2: adventure.city,
          price: adventure.traveler_total_price || 0,
          quantity: 1
        }]
      });

      return booking;
    },
    onSuccess: (booking) => {
      showSuccess('Adventure booking created!', 'Check your messages for confirmation');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate(createPageUrl(`Messages?conversation_id=${booking.id}`));
    },
    onError: (error) => {
      showError('Booking failed', error.message);
    }
  });

  const handleShare = async () => {
    // ✅ Track share
    trackEvent('share', {
      method: 'Web Share API',
      content_type: 'adventure',
      item_id: adventure.id
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: adventure.title,
          text: adventure.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Link copied to clipboard!');
    }
  };


  if (isLoading || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!adventure) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Adventure not found</h2>
        <Button onClick={() => navigate(createPageUrl('Adventures'))}>
          Browse Adventures
        </Button>
      </div>
    );
  }

  const spotsLeft = adventure.max_participants - (adventure.current_participants || 0);
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button & Share */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="relative h-96">
            <img
              src={adventure.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200'}
              alt={adventure.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200';
              }}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge className="bg-white text-purple-900">{adventure.category}</Badge>
              {adventure.is_featured && (
                <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{adventure.title}</h1>
              <p className="text-gray-600">{adventure.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-xs text-gray-500">Location</div>
                  <div className="font-semibold">{adventure.city}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-semibold">
                    {format(new Date(adventure.date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="font-semibold">{adventure.duration_hours}h</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-xs text-gray-500">Spots Left</div>
                  <div className={`font-semibold ${isFull ? 'text-red-600' : isAlmostFull ? 'text-orange-600' : ''}`}>
                    {isFull ? 'Full' : `${spotsLeft}/${adventure.max_participants}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Book */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <div>
                <div className="text-sm text-gray-600 mb-1">Price per person</div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <span className="text-3xl font-bold text-green-600">
                    {adventure.traveler_total_price?.toFixed(0)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => createBookingMutation.mutate()}
                disabled={isFull || createBookingMutation.isLoading}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {createBookingMutation.isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : isFull ? (
                  'Fully Booked'
                ) : (
                  <>
                    Book Now
                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                  </>
                )}
              </Button>
            </div>

            {/* Included */}
            {adventure.included && adventure.included.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3">What's Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {adventure.included.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Point */}
            {adventure.meeting_point && (
              <div>
                <h3 className="font-bold text-lg mb-2">Meeting Point</h3>
                <p className="text-gray-600">{adventure.meeting_point}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
