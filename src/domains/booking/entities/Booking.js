export const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

export class Booking {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.user_id || data.userId;
    this.travelerEmail = data.traveler_email || data.travelerEmail;
    this.travelerName = data.traveler_name || data.travelerName;
    this.hostId = data.host_id || data.hostId;
    this.hostEmail = data.host_email || data.hostEmail;
    this.cityId = data.city_id || data.cityId;
    this.cityName = data.city_name || data.cityName;
    this.adventureId = data.adventure_id || data.adventureId;
    this.bookingDate = data.booking_date || data.bookingDate;
    this.checkIn = data.check_in || data.checkIn;
    this.checkOut = data.check_out || data.checkOut;
    this.guests = data.guests || 1;
    this.status = data.status || BookingStatus.PENDING;
    this.totalPrice = data.total_price || data.totalPrice || 0;
    this.commission = data.commission || 0;
    this.services = data.services || [];
    this.notes = data.notes || '';
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  static fromFirestore(data) {
    return new Booking(data);
  }

  toFirestore() {
    return {
      user_id: this.userId,
      traveler_email: this.travelerEmail,
      traveler_name: this.travelerName,
      host_id: this.hostId,
      host_email: this.hostEmail,
      city_id: this.cityId,
      city_name: this.cityName,
      adventure_id: this.adventureId,
      booking_date: this.bookingDate,
      check_in: this.checkIn,
      check_out: this.checkOut,
      guests: this.guests,
      status: this.status,
      total_price: this.totalPrice,
      commission: this.commission,
      services: this.services,
      notes: this.notes,
    };
  }

  isPending() {
    return this.status === BookingStatus.PENDING;
  }

  isConfirmed() {
    return this.status === BookingStatus.CONFIRMED;
  }

  isCancelled() {
    return this.status === BookingStatus.CANCELLED;
  }

  canBeCancelled() {
    return this.status === BookingStatus.PENDING || this.status === BookingStatus.CONFIRMED;
  }

  confirm() {
    if (!this.isPending()) {
      throw new Error('Only pending bookings can be confirmed');
    }
    this.status = BookingStatus.CONFIRMED;
    return this;
  }

  cancel() {
    if (!this.canBeCancelled()) {
      throw new Error('This booking cannot be cancelled');
    }
    this.status = BookingStatus.CANCELLED;
    return this;
  }

  complete() {
    if (!this.isConfirmed()) {
      throw new Error('Only confirmed bookings can be completed');
    }
    this.status = BookingStatus.COMPLETED;
    return this;
  }
}
