import { bookingService } from '../services/bookingService';

export const cancelBookingUseCase = async (bookingId, reason = '') => {
  const booking = await bookingService.cancelBooking(bookingId, reason);

  return booking;
};
