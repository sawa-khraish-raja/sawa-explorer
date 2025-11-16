import { bookingRepository } from '../repositories/bookingRepository';
import { BookingStatus } from '../entities/Booking';

export const bookingService = {
  async getBookingById(id) {
    return bookingRepository.getById(id);
  },

  async getUserBookings(userId) {
    return bookingRepository.findByUserId(userId);
  },

  async getHostBookings(hostId, status = null) {
    return bookingRepository.findByHostId(hostId, status);
  },

  async getAdventureBookings(adventureId) {
    return bookingRepository.findByAdventureId(adventureId);
  },

  async getCityBookings(cityId, status = null) {
    return bookingRepository.findByCityId(cityId, status);
  },

  async getPendingBookings() {
    return bookingRepository.findByStatus(BookingStatus.PENDING);
  },

  async getBookingStats(filters = {}) {
    return bookingRepository.getStats(filters);
  },

  async createBooking(bookingData) {
    if (!bookingData.traveler_email) {
      throw new Error('Traveler email is required');
    }
    if (!bookingData.city_id) {
      throw new Error('City is required');
    }
    if (!bookingData.booking_date) {
      throw new Error('Booking date is required');
    }

    return bookingRepository.create(bookingData);
  },

  async updateBooking(id, updates) {
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    return bookingRepository.update(id, updates);
  },

  async confirmBooking(id) {
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.confirm();
    return bookingRepository.update(id, { status: booking.status });
  },

  async cancelBooking(id, reason = '') {
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.canBeCancelled()) {
      throw new Error('This booking cannot be cancelled');
    }

    booking.cancel();
    return bookingRepository.update(id, {
      status: booking.status,
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    });
  },

  async completeBooking(id) {
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.complete();
    return bookingRepository.update(id, {
      status: booking.status,
      completed_at: new Date().toISOString(),
    });
  },

  async deleteBooking(id) {
    return bookingRepository.delete(id);
  },
};
