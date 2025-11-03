import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { addDocument, queryDocuments } from '@/utils/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Send, Loader2, Plus, Minus, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SimpleDatePicker from './SimpleDatePicker';
import ServiceCard from '../common/ServiceCard';
import { SAWA_SERVICES } from '../config/sawaServices';
import { useAppContext } from '../context/AppContext';

export default function SimpleBookingForm({ city, onSuccess }) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [notes, setNotes] = useState('');
  const { user, userLoading } = useAppContext();
  const requiresLogin = !user && !userLoading;

  // Query to check for available hosts in this city
  const { data: cityHosts = [] } = useQuery({
    queryKey: ['cityHosts', city?.name],
    queryFn: async () => {
      if (!city?.name) return [];
      const allUsers = await queryDocuments('users', [['host_approved', '==', true]]);
      const hostsInCity = allUsers.filter((host) => host.city === city.name);
      console.log(`📍 Found ${hostsInCity.length} hosts in ${city.name}`);
      return hostsInCity;
    },
    enabled: !!city?.name,
    staleTime: 5 * 60 * 1000,
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 Starting booking creation...');

      //  Validate user
      if (!user) {
        throw new Error('Please login to create a booking');
      }

      //  Validate dates
      if (!startDate || !endDate) {
        throw new Error('Please select check-in and check-out dates');
      }

      //  Format dates correctly (YYYY-MM-DD)
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      console.log('📝 Booking data:', {
        user_id: user.id, // ← Added for Firestore rules
        user_email: user.email,
        traveler_email: user.email,
        traveler_id: user.id,
        city_name: city.name,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        number_of_adults: adults,
        number_of_children: children,
        selected_services: selectedServices,
        notes: notes || '',
      });

      //  Create booking in Firestore
      const bookingId = await addDocument('bookings', {
        user_id: user.id,
        user_email: user.email,
        traveler_email: user.email,
        traveler_id: user.id,
        city_name: city.name,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        number_of_adults: adults,
        number_of_children: children,
        selected_services: selectedServices,
        notes: notes || '',
        status: 'pending',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      console.log('✅ Booking created with ID:', bookingId);

      // Send notifications to hosts in this city
      // Wrapped in try-catch because notification creation requires admin permissions
      try {
        for (const host of cityHosts) {
          const notificationData = {
            recipient_email: host.email,
            type: 'booking_request',
            title: 'New Booking Request',
            message: `New booking request for ${city.name} from ${formattedStartDate} to ${formattedEndDate}`,
            booking_id: bookingId,
            read: false,
            created_date: new Date().toISOString(),
          };

          // Only add user_id if it exists
          if (host.id) {
            notificationData.user_id = host.id;
          }

          await addDocument('notifications', notificationData);
        }
        console.log(`✅ Sent notifications to ${cityHosts.length} host(s)`);
      } catch (error) {
        console.warn('⚠️ Could not send notifications (requires admin permissions):', error.message);
        // Don't throw - booking was already created successfully
      }

      return { id: bookingId };
    },
    onSuccess: (booking) => {
      toast.success('Booking Submitted!', {
        description: 'Hosts will contact you soon with offers',
        duration: 4000,
      });

      if (onSuccess) {
        onSuccess(booking);
      } else {
        setTimeout(() => {
          navigate(createPageUrl('MyOffers'));
        }, 1500);
      }
    },
    onError: (error) => {
      console.error('Booking error:', error);
      if (error?.response) {
        console.error('Booking error response:', error.response);
      }
      toast.error('Booking Failed', {
        description: error.message || 'Could not create booking. Please try again.',
        duration: 5000,
      });
    },
  });

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    //  Validate before submit
    if (!startDate || !endDate) {
      toast.error('Missing Dates', {
        description: 'Please select check-in and check-out dates',
      });
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('Invalid Dates', {
        description: 'Check-out must be after check-in',
      });
      return;
    }

    createBookingMutation.mutate();
  };

  const isFormDisabled = userLoading || createBookingMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {requiresLogin && (
        <Card className='border-yellow-300 bg-yellow-50 text-yellow-800'>
          <CardContent className='py-4 text-sm'>
            Please sign in to submit a booking request.
          </CardContent>
        </Card>
      )}

      {/* No Hosts Warning */}
      {!userLoading && cityHosts.length === 0 && (
        <Card className='border-orange-300 bg-orange-50'>
          <CardContent className='py-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm text-orange-800'>
                <p className='font-semibold mb-1'>No Hosts Available Yet</p>
                <p>
                  We're working on adding new hosts in {city.name} soon. You can still submit your
                  request, and we'll notify you when hosts become available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Calendar className='w-5 h-5 text-purple-600' />
            Travel Dates
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <Label className='text-sm font-medium mb-2 block'>Check-in *</Label>
              <SimpleDatePicker
                value={startDate}
                onChange={setStartDate}
                minDate={new Date().toISOString().split('T')[0]}
                placeholder='Select check-in'
                required
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label className='text-sm font-medium mb-2 block'>Check-out *</Label>
              <SimpleDatePicker
                value={endDate}
                onChange={setEndDate}
                minDate={startDate || new Date().toISOString().split('T')[0]}
                placeholder='Select check-out'
                required
                disabled={isFormDisabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guests */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Users className='w-5 h-5 text-purple-600' />
            Guests
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>Adults</p>
              <p className='text-sm text-gray-500'>Ages 13+</p>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => setAdults(Math.max(1, adults - 1))}
                disabled={isFormDisabled || adults <= 1}
                className='h-8 w-8'
              >
                <Minus className='w-4 h-4' />
              </Button>
              <span className='w-8 text-center font-semibold'>{adults}</span>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => setAdults(Math.min(20, adults + 1))}
                disabled={isFormDisabled || adults >= 20}
                className='h-8 w-8'
              >
                <Plus className='w-4 h-4' />
              </Button>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>Children</p>
              <p className='text-sm text-gray-500'>Ages 0-12</p>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => setChildren(Math.max(0, children - 1))}
                disabled={isFormDisabled || children <= 0}
                className='h-8 w-8'
              >
                <Minus className='w-4 h-4' />
              </Button>
              <span className='w-8 text-center font-semibold'>{children}</span>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => setChildren(Math.min(10, children + 1))}
                disabled={isFormDisabled || children >= 10}
                className='h-8 w-8'
              >
                <Plus className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Package className='w-5 h-5 text-purple-600' />
            Services (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {SAWA_SERVICES.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServices.includes(service.id)}
                onToggle={() => {
                  if (!isFormDisabled) {
                    handleServiceToggle(service.id);
                  }
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Special Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder='Any special requests or requirements? (Optional)'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className='h-24 resize-none'
            disabled={isFormDisabled}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type='submit'
        disabled={isFormDisabled || requiresLogin || !startDate || !endDate}
        className='w-full h-12 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white text-lg font-semibold'
      >
        {createBookingMutation.isPending ? (
          <>
            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
            Sending Request...
          </>
        ) : (
          <>
            <Send className='w-5 h-5 mr-2' />
            Send Booking Request
          </>
        )}
      </Button>
    </form>
  );
}
