import { bookingService } from '../services/bookingService';

export const createBookingUseCase = async (bookingData) => {
  const booking = await bookingService.createBooking({
    traveler_email: bookingData.travelerEmail,
    traveler_name: bookingData.travelerName,
    host_id: bookingData.hostId,
    host_email: bookingData.hostEmail,
    city_id: bookingData.cityId,
    city_name: bookingData.cityName,
    adventure_id: bookingData.adventureId,
    booking_date: bookingData.bookingDate,
    check_in: bookingData.checkIn,
    check_out: bookingData.checkOut,
    guests: bookingData.guests || 1,
    total_price: bookingData.totalPrice || 0,
    commission: bookingData.commission || 0,
    services: bookingData.services || [],
    notes: bookingData.notes || '',
  });

  return booking;
};
