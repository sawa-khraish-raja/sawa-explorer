import { useQuery } from '@tanstack/react-query';
import { getBookingStatsUseCase } from '@/domains/booking';

export const useBookingStats = (filters = {}) => {
  return useQuery({
    queryKey: ['bookings', 'admin', 'stats', filters],
    queryFn: () => getBookingStatsUseCase(filters),
    staleTime: 60000,
  });
};
