import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/domains/booking';

export const useBookings = (userId) => {
  return useQuery({
    queryKey: ['bookings', 'user', userId],
    queryFn: () => bookingService.getUserBookings(userId),
    enabled: !!userId,
    staleTime: 30000,
  });
};
