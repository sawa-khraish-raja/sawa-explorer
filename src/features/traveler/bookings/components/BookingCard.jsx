import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import { BookingStatus } from '@/domains/booking';
import { format } from 'date-fns';

const statusColors = {
  [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [BookingStatus.COMPLETED]: 'bg-blue-100 text-blue-800',
};

export const BookingCard = ({ booking, onCancel, onViewDetails }) => {
  const canCancel = booking.canBeCancelled();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{booking.cityName}</CardTitle>
          <Badge className={statusColors[booking.status]}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {booking.bookingDate && format(new Date(booking.bookingDate), 'PPP')}
          </div>
          {booking.guests && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
            </div>
          )}
          {booking.totalPrice > 0 && (
            <div className="text-lg font-semibold">
              ${booking.totalPrice.toFixed(2)}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(booking)}
            className="flex-1"
          >
            View Details
          </Button>
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel(booking.id)}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
