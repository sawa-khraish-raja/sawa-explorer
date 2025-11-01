import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keeping this as per outline, though not used in the final JSX
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showError } from '../utils/notifications';
import { useTranslation } from '../i18n/LanguageContext';
import { trackBookingStart, trackBookingComplete } from '../analytics/GoogleAnalytics'; // New import

export default function BookingForm({
  city,
  startDate,
  endDate,
  adults,
  children,
  selectedServices,
  onSuccess,
}) {
  const { t, language } = useTranslation();
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState(''); // Keeping this as per outline, though not used in the final JSX
  const queryClient = useQueryClient();

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      //  Track booking start
      trackBookingStart(
        city,
        { start: startDate, end: endDate },
        { adults, children },
        selectedServices
      );

      const booking = await base44.entities.Booking.create(bookingData);

      //  Track booking completion
      if (booking) {
        trackBookingComplete({
          id: booking.id,
          city: city,
          start_date: startDate,
          end_date: endDate,
          number_of_adults: adults,
          number_of_children: children,
          selected_services: selectedServices,
          total_price: 0, // Will be updated when offer accepted
        });
      }

      return booking;
    },
    onSuccess: (booking) => {
      showSuccess(
        language === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Booking request sent!',
        language === 'ar' ? 'سيتواصل معك المضيفون قريباً' : 'Hosts will contact you soon'
      );
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (onSuccess) onSuccess(booking);
    },
    onError: (error) => {
      showError(language === 'ar' ? 'فشل إرسال الطلب' : 'Failed to send request', error.message);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const bookingData = {
      traveler_email: user.email,
      city,
      start_date: startDate,
      end_date: endDate,
      number_of_adults: adults,
      number_of_children: children,
      selected_services: selectedServices,
      notes: notes.trim() || undefined,
      state: 'open',
      status: 'pending',
    };

    createBookingMutation.mutate(bookingData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <Textarea
        placeholder={t('city.notes_placeholder')}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className='resize-none'
      />

      <Button
        type='submit'
        disabled={createBookingMutation.isLoading}
        className='w-full h-12 text-base font-semibold bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6]'
      >
        {createBookingMutation.isLoading ? (
          <>{language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</>
        ) : (
          <>{t('city.submit_booking')}</>
        )}
      </Button>
    </form>
  );
}
