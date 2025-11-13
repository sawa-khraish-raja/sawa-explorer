import { useState } from 'react';
import { useAllBookings, useBookingStats } from '../hooks';
import { BookingStatsCards } from '../components';
import { BookingList } from '@/features/traveler/bookings';
import { useCancelBooking } from '@/features/traveler/bookings/hooks';

export const AdminBookingsPage = () => {
  const [filters] = useState({});
  const { data: bookings, isLoading: bookingsLoading } = useAllBookings(filters);
  const { data: stats, isLoading: statsLoading } = useBookingStats(filters);
  const cancelBooking = useCancelBooking();

  const handleCancel = async (bookingId) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking.mutateAsync({ bookingId, reason: 'Cancelled by admin' });
    }
  };

  const handleViewDetails = (booking) => {
    console.log('View details:', booking);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Booking Oversight</h1>

      <BookingStatsCards stats={stats} isLoading={statsLoading} />

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">All Bookings</h2>
        <BookingList
          bookings={bookings}
          onCancel={handleCancel}
          onViewDetails={handleViewDetails}
          isLoading={bookingsLoading}
        />
      </div>
    </div>
  );
};
