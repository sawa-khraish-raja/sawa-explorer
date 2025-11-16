import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBookingUseCase } from '@/domains/booking';
import { toast } from 'sonner';

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookingUseCase,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully');
      return data;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create booking');
      throw error;
    },
  });
};
