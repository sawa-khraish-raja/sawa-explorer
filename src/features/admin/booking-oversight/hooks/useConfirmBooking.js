import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/domains/booking';
import { toast } from 'sonner';

export const useConfirmBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId) => bookingService.confirmBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking confirmed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to confirm booking');
    },
  });
};
