import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useBookings, useCancelBooking } from '../hooks';
import { BookingList } from '../components';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { BookingStatus } from '@/domains/booking';

export const MyBookings = () => {
  const { currentUser } = useAuth();
  const { data: bookings, isLoading } = useBookings(currentUser?.uid);
  const cancelBooking = useCancelBooking();
  const [activeTab, setActiveTab] = useState('all');

  const handleCancel = async (bookingId) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking.mutateAsync({ bookingId, reason: 'Cancelled by user' });
    }
  };

  const handleViewDetails = (booking) => {
    console.log('View details:', booking);
  };

  const filterBookings = (status) => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    return bookings.filter((b) => b.status === status);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={BookingStatus.PENDING}>Pending</TabsTrigger>
          <TabsTrigger value={BookingStatus.CONFIRMED}>Confirmed</TabsTrigger>
          <TabsTrigger value={BookingStatus.COMPLETED}>Completed</TabsTrigger>
          <TabsTrigger value={BookingStatus.CANCELLED}>Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <BookingList
            bookings={bookings}
            onCancel={handleCancel}
            onViewDetails={handleViewDetails}
            isLoading={isLoading}
          />
        </TabsContent>

        {Object.values(BookingStatus).map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            <BookingList
              bookings={filterBookings(status)}
              onCancel={handleCancel}
              onViewDetails={handleViewDetails}
              isLoading={isLoading}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
