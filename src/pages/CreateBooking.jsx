import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Send, User, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppContext } from '@/components/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { addDocument, queryDocuments, createNotification } from '@/utils/firestore';

import ProgressBar from '../components/booking/ProgressBar';
import TravelerInfoForm from '../components/booking/TravelerInfoForm';

export default function CreateBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppContext();
  const [bookingData, setBookingData] = useState(null);
  const [selectedHostId, setSelectedHostId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const city = params.get('city');
    if (city) {
      setBookingData({
        city,
        start_date: params.get('start'),
        end_date: params.get('end'),
        number_of_adults: parseInt(params.get('adults'), 10) || 1,
        number_of_children: parseInt(params.get('children'), 10) || 0,
        selected_services: params.get('services')?.split(',') || [],
        notes: '',
        traveler_email: '',
      });
    } else {
      // Handle case where no city is provided, maybe redirect or show error
      toast.error('Booking details are missing. Please start over.');
      navigate(createPageUrl('Home'));
    }
  }, [location.search, navigate]);

  // Fetch available hosts in the selected city
  const { data: availableHosts = [], isLoading: hostsLoading } = useQuery({
    queryKey: ['cityHosts', bookingData?.city],
    queryFn: async () => {
      if (!bookingData?.city) return [];
      console.log(' Fetching hosts for city:', bookingData.city);

      const allUsers = await queryDocuments('users', [['host_approved', '==', true]]);
      const cityHosts = allUsers.filter((host) => host.city === bookingData.city);

      console.log(` Found ${cityHosts.length} hosts in ${bookingData.city}`);
      return cityHosts;
    },
    enabled: !!bookingData?.city,
    staleTime: 5 * 60 * 1000,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingPayload) => {
      console.log('📦 Creating booking:', bookingPayload);

      // Create booking in Firestore
      const bookingId = await addDocument('bookings', {
        traveler_email: bookingPayload.traveler_email,
        traveler_id: bookingPayload.traveler_id,
        city_name: bookingPayload.city,
        start_date: bookingPayload.start_date,
        end_date: bookingPayload.end_date,
        number_of_adults: bookingPayload.number_of_adults,
        number_of_children: bookingPayload.number_of_children,
        selected_services: bookingPayload.selected_services,
        notes: bookingPayload.notes,
        preferred_host_id: bookingPayload.preferred_host_id || null,
        status: 'pending',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      console.log(' Booking created with ID:', bookingId);
      return { id: bookingId, ...bookingPayload };
    },
    onSuccess: async (newBooking) => {
      console.log(' Booking created successfully:', newBooking);

      const message = selectedHostId
        ? 'Your booking request has been sent to the selected host!'
        : 'Your booking request has been sent to all available hosts!';

      toast.success(message, { duration: 5000 });

      try {
        // Determine which hosts to notify
        const hostsToNotify = selectedHostId
          ? availableHosts.filter((h) => h.id === selectedHostId)
          : availableHosts;

        // Send notifications to hosts
        for (const host of hostsToNotify) {
          const notificationData = {
            recipient_email: host.email,
            type: 'booking_request',
            title: 'New Booking Request',
            message: `New booking request for ${newBooking.city} from ${newBooking.start_date} to ${newBooking.end_date}`,
            booking_id: newBooking.id,
            read: false,
            created_date: new Date().toISOString(),
          };

          // Only add user_id if it exists
          if (host.id) {
            notificationData.user_id = host.id;
          }

          await createNotification(notificationData);
        }

        console.log(` Sent ${hostsToNotify.length} notification(s)`);
      } catch (error) {
        console.error('Failed to send booking request notifications:', error);
        // Don't block user flow, but log the error
      }

      // Redirect to MyOffers page to see status
      navigate(createPageUrl('MyOffers'));
    },
    onError: (error) => {
      toast.error('There was a problem sending your request. Please try again.');
      console.error('Booking Creation Error:', error);
    },
  });

  const handleFinalizeBooking = async (formData) => {
    if (!user) {
      toast.error('You must be logged in to book.');
      navigate(createPageUrl('Login'));
      return;
    }

    const finalBookingData = {
      ...bookingData,
      notes: formData.notes,
      traveler_email: user.email,
      traveler_id: user.id,
      preferred_host_id: selectedHostId,
    };

    createBookingMutation.mutate(finalBookingData);
  };

  if (!bookingData) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='w-8 h-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#E6E6FF] via-white to-[#CCCCFF] py-12 sm:py-16'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <ProgressBar currentStep={3} />

        {/* Host Selection Section (Optional) */}
        {availableHosts.length > 0 && (
          <Card className='shadow-2xl border-2 border-white/50 rounded-3xl mt-8'>
            <CardHeader className='bg-gray-50/50 rounded-t-3xl p-6 border-b'>
              <CardTitle className='text-xl font-bold text-gray-900'>
                Choose a Host (Optional)
              </CardTitle>
              <p className='text-gray-600 text-sm mt-1'>
                Select a specific host or leave unselected to broadcast your request to all{' '}
                {availableHosts.length} available host{availableHosts.length > 1 ? 's' : ''} in{' '}
                <span className='font-semibold text-[#330066]'>{bookingData.city}</span>.
              </p>
            </CardHeader>
            <CardContent className='p-6'>
              {hostsLoading ? (
                <div className='flex justify-center items-center py-8'>
                  <Loader2 className='w-6 h-6 animate-spin text-[#330066]' />
                </div>
              ) : (
                <div className='grid gap-3'>
                  {/* Option: Broadcast to all hosts */}
                  <button
                    onClick={() => setSelectedHostId(null)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedHostId === null
                        ? 'border-[#330066] bg-[#330066]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-[#330066]/10 rounded-lg'>
                          <Send className='w-5 h-5 text-[#330066]' />
                        </div>
                        <div>
                          <h3 className='font-semibold text-gray-900'>Broadcast to All Hosts</h3>
                          <p className='text-sm text-gray-600'>
                            Get offers from all {availableHosts.length} available hosts
                          </p>
                        </div>
                      </div>
                      {selectedHostId === null && (
                        <CheckCircle2 className='w-5 h-5 text-[#330066]' />
                      )}
                    </div>
                  </button>

                  {/* Individual host options */}
                  {availableHosts.map((host) => (
                    <button
                      key={host.id}
                      onClick={() => setSelectedHostId(host.id)}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        selectedHostId === host.id
                          ? 'border-[#330066] bg-[#330066]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'>
                            {host.profile_photo ? (
                              <img
                                src={host.profile_photo}
                                alt={host.full_name}
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <User className='w-6 h-6 text-gray-400' />
                            )}
                          </div>
                          <div>
                            <h3 className='font-semibold text-gray-900'>
                              {host.full_name || host.email}
                            </h3>
                            <p className='text-sm text-gray-600'>{host.email}</p>
                            {host.bio && (
                              <p className='text-sm text-gray-500 mt-1 line-clamp-1'>{host.bio}</p>
                            )}
                          </div>
                        </div>
                        {selectedHostId === host.id && (
                          <CheckCircle2 className='w-5 h-5 text-[#330066]' />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Traveler Info Form */}
        <Card className='shadow-2xl border-2 border-white/50 rounded-3xl mt-8'>
          <CardHeader className='bg-gray-50/50 rounded-t-3xl p-6 border-b'>
            <CardTitle className='text-2xl font-bold text-gray-900'>
              Finalize Your Request
            </CardTitle>
            <p className='text-gray-600'>
              Confirm your details and add any special requests.
              {selectedHostId
                ? ' Your request will be sent to the selected host.'
                : ` We'll send this to ${availableHosts.length || 'all'} available host${availableHosts.length !== 1 ? 's' : ''} in ${bookingData.city}.`}
            </p>
          </CardHeader>
          <CardContent className='p-6 sm:p-8'>
            <TravelerInfoForm
              onSubmit={handleFinalizeBooking}
              isLoading={createBookingMutation.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
