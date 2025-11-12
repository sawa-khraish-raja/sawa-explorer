import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBookingUseCase } from '@/domains/booking';
import { toast } from 'sonner';

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }) => cancelBookingUseCase(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });
};
