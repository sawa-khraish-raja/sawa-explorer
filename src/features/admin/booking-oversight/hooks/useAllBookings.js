import { useQuery } from '@tanstack/react-query';
import { bookingRepository } from '@/domains/booking';

export const useAllBookings = (filters = {}) => {
  return useQuery({
    queryKey: ['bookings', 'admin', 'all', filters],
    queryFn: () => bookingRepository.filter(filters, 'created_at', 'desc'),
    staleTime: 30000,
  });
};
