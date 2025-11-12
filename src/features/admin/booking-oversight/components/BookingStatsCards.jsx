import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export const BookingStatsCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Bookings',
      value: stats?.total || 0,
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      title: 'Confirmed',
      value: stats?.confirmed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Cancelled',
      value: stats?.cancelled || 0,
      icon: XCircle,
      color: 'text-red-600',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {stats?.averageBookingValue && card.title === 'Total Revenue' && (
              <p className="text-xs text-gray-500 mt-1">
                Avg: ${stats.averageBookingValue.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
