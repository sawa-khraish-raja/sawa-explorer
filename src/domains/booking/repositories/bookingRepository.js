import { FirebaseRepository } from '@/infrastructure/firebase';
import { Booking } from '../entities/Booking';

class BookingRepository extends FirebaseRepository {
  constructor() {
    super('bookings');
  }

  normalizeDocument(docSnap) {
    const data = super.normalizeDocument(docSnap);
    return data ? Booking.fromFirestore(data) : null;
  }

  async findByUserId(userId) {
    return this.filter(
      { user_id: userId },
      'booking_date',
      'desc'
    );
  }

  async findByHostId(hostId, status = null) {
    const criteria = { host_id: hostId };
    if (status) {
      criteria.status = status;
    }
    return this.filter(criteria, 'booking_date', 'asc');
  }

  async findByAdventureId(adventureId) {
    return this.filter(
      { adventure_id: adventureId },
      'booking_date',
      'asc'
    );
  }

  async findByCityId(cityId, status = null) {
    const criteria = { city_id: cityId };
    if (status) {
      criteria.status = status;
    }
    return this.filter(criteria, 'booking_date', 'desc');
  }

  async findByStatus(status) {
    return this.filter(
      { status },
      'created_at',
      'desc'
    );
  }

  async findByTravelerEmail(email) {
    return this.filter(
      { traveler_email: email },
      'booking_date',
      'desc'
    );
  }

  async getStats(filters = {}) {
    const bookings = await this.filter(filters);

    return {
      total: bookings.length,
      pending: bookings.filter(b => b.isPending()).length,
      confirmed: bookings.filter(b => b.isConfirmed()).length,
      cancelled: bookings.filter(b => b.isCancelled()).length,
      completed: bookings.filter(b => b.status === 'completed').length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      totalCommission: bookings.reduce((sum, b) => sum + (b.commission || 0), 0),
    };
  }

  async create(bookingData) {
    const booking = new Booking(bookingData);
    const data = booking.toFirestore();
    return super.create(data);
  }

  async update(id, updates) {
    const booking = new Booking(updates);
    const data = booking.toFirestore();
    return super.update(id, data);
  }
}

export const bookingRepository = new BookingRepository();
