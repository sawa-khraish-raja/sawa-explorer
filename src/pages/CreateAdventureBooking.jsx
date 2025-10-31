import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  DollarSign,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Zap,
  ArrowLeft,
  Plus,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CreateAdventureBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(location.search);
  const adventureId = urlParams.get('adventure_id');
  const initialGuests = parseInt(urlParams.get('guests')) || 1;

  const [numberOfGuests, setNumberOfGuests] = useState(initialGuests);
  const [notes, setNotes] = useState('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const currentUser = await base44.auth.me();
        return currentUser;
      } catch (e) {
        return null;
      }
    },
  });

  const { data: adventure, isLoading: adventureLoading } = useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: () => base44.entities.Adventure.get(adventureId),
    enabled: !!adventureId,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      if (!user) {
        throw new Error('Please login to book this adventure');
      }

      // Create booking
      const booking = await base44.entities.Booking.create({
        ...bookingData,
        traveler_email: user.email,
        adventure_id: adventureId,
        start_date: adventure.date,
        end_date: adventure.date,
        number_of_adults: numberOfGuests,
        number_of_children: 0,
        city: adventure.city,
        status: 'confirmed',
        state: 'confirmed',
        host_email: adventure.host_email,
        total_price: totalPrice,
        notes: notes,
      });

      // Update adventure participants count
      await base44.entities.Adventure.update(adventureId, {
        current_participants: (adventure.current_participants || 0) + numberOfGuests
      });

      // Send notification to host
      await base44.entities.Notification.create({
        recipient_email: adventure.host_email,
        recipient_type: 'host',
        type: 'booking_request',
        title: 'New Adventure Booking!',
        message: `${user.full_name || user.email} booked your adventure: ${adventure.title}`,
        link: `/HostAdventures?tab=bookings`,
        related_booking_id: booking.id,
      });

      return booking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adventure', adventureId] });
      queryClient.invalidateQueries({ queryKey: ['adventures'] });
      queryClient.invalidateQueries({ queryKey: ['homeAdventures'] });
      
      toast.success('🎉 Adventure booked successfully!');
      navigate(createPageUrl('MyOffers'));
    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (numberOfGuests < 1) {
      toast.error('Please select at least 1 guest');
      return;
    }

    const spotsLeft = adventure.max_participants - (adventure.current_participants || 0);
    if (numberOfGuests > spotsLeft) {
      toast.error(`Only ${spotsLeft} spots available!`);
      return;
    }

    createBookingMutation.mutate({});
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (adventureLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#9933CC]" />
      </div>
    );
  }

  if (!adventure) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Adventure Not Found</h2>
        <Button onClick={() => navigate(createPageUrl('Adventures'))} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Adventures
        </Button>
      </div>
    );
  }

  const spotsLeft = adventure.max_participants - (adventure.current_participants || 0);
  const pricePerPerson = adventure.traveler_total_price || adventure.host_price || 0;
  const totalPrice = pricePerPerson * numberOfGuests;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(createPageUrl(`AdventureDetails?id=${adventureId}`))}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Adventure</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-[#9933CC] to-[#330066] text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="w-7 h-7" />
                  Book This Adventure
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* ✅ Number of Guests Selector */}
                <div>
                  <Label className="text-base font-bold mb-3 block">Number of Guests (Adults)</Label>
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setNumberOfGuests(prev => Math.max(1, prev - 1))}
                      disabled={numberOfGuests <= 1}
                      className="w-12 h-12 rounded-full border-2"
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    
                    <div className="flex-1 text-center">
                      <p className="text-3xl font-bold text-gray-900">{numberOfGuests}</p>
                      <p className="text-sm text-gray-500">
                        {numberOfGuests === 1 ? 'Guest' : 'Guests'}
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setNumberOfGuests(prev => Math.min(spotsLeft, prev + 1))}
                      disabled={numberOfGuests >= spotsLeft}
                      className="w-12 h-12 rounded-full border-2"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {spotsLeft <= 5 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-800 font-medium">
                        Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left!
                      </p>
                    </div>
                  )}
                </div>

                {/* Special Requests */}
                <div>
                  <Label htmlFor="notes" className="text-base font-bold mb-2 block">
                    Special Requests or Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any dietary restrictions, accessibility needs, or special requests..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={createBookingMutation.isPending || numberOfGuests > spotsLeft}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#9933CC] to-[#330066] hover:from-[#7B2CBF] hover:to-[#1a0033] shadow-lg hover:shadow-xl transition-all"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Book Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-white">
                <CardTitle className="text-xl">Booking Summary</CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  <img
                    src={adventure.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
                    alt={adventure.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                  {adventure.title}
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-5 h-5 text-[#9933CC]" />
                    <span>{format(new Date(adventure.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="w-5 h-5 text-[#9933CC]" />
                    <span>{format(new Date(adventure.date), 'h:mm a')} • {adventure.duration_hours}h</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-[#9933CC]" />
                    <span>{adventure.city}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-5 h-5 text-[#9933CC]" />
                    <span>{numberOfGuests} {numberOfGuests === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Base price:</span>
                    <span className="font-semibold text-gray-900">${pricePerPerson.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Number of guests:</span>
                    <span className="font-semibold text-gray-900">× {numberOfGuests}</span>
                  </div>
                  
                  {adventure.commission_breakdown?.sawa_amount > 0 && (
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Service fee:</span>
                      <span>${adventure.commission_breakdown.sawa_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-purple-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-[#9933CC] to-[#330066] bg-clip-text text-transparent">
                        ${totalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">${pricePerPerson.toFixed(2)} per person</p>
                    </div>
                  </div>
                </div>

                {spotsLeft <= 3 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">
                      Almost full! Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}