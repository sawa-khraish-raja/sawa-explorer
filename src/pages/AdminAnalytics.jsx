import { useQuery } from '@tanstack/react-query';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Sparkles,
  Building2,
  UserCheck,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllDocuments } from '@/utils/firestore';

import AdminLayout from '../components/admin/AdminLayout';


export default function AdminAnalytics() {
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => getAllDocuments('users'),
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => getAllDocuments('bookings'),
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['allConversations'],
    queryFn: () => getAllDocuments('conversations'),
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['allOffers'],
    queryFn: () => getAllDocuments('offers'),
  });

  if (usersLoading || bookingsLoading || conversationsLoading || offersLoading) {
    return (
      <AdminLayout>
        <div className='flex justify-center items-center h-96'>
          <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
        </div>
      </AdminLayout>
    );
  }

  // Calculate analytics
  const last7Days = subDays(new Date(), 7);
  const last30Days = subDays(new Date(), 30);

  // New users
  const newUsersLast7Days = users.filter((u) => new Date(u.created_date) > last7Days).length;
  const newUsersLast30Days = users.filter((u) => new Date(u.created_date) > last30Days).length;

  // Bookings
  const bookingsLast7Days = bookings.filter((b) => new Date(b.created_date) > last7Days).length;
  const bookingsLast30Days = bookings.filter((b) => new Date(b.created_date) > last30Days).length;
  const confirmedBookingsArray = bookings.filter((b) => b.status === 'confirmed');
  const confirmedBookingsCount = confirmedBookingsArray.length; // Use this for places where count was needed
  const conversionRate =
    bookings.length > 0 ? ((confirmedBookingsCount / bookings.length) * 100).toFixed(1) : 0;

  // Revenue
  const revenueLast30Days = bookings
    .filter((b) => b.status === 'confirmed' && new Date(b.created_date) > last30Days)
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const revenueThisMonth = bookings
    .filter(
      (b) =>
        b.status === 'confirmed' &&
        new Date(b.created_date) >= startOfMonth(new Date()) &&
        new Date(b.created_date) <= endOfMonth(new Date())
    )
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Messages
  const activeConversations = conversations.filter(
    (c) => c.last_message_timestamp && new Date(c.last_message_timestamp) > last7Days
  ).length;

  // City breakdown
  const citiesStats = {};
  bookings.forEach((booking) => {
    if (booking.city) {
      // Ensure city exists
      if (!citiesStats[booking.city]) {
        citiesStats[booking.city] = { total: 0, confirmed: 0, revenue: 0 };
      }
      citiesStats[booking.city].total++;
      if (booking.status === 'confirmed') {
        citiesStats[booking.city].confirmed++;
        citiesStats[booking.city].revenue += booking.total_price || 0;
      }
    }
  });

  //  Calculate SAWA Revenue Breakdown
  const calculateSawaRevenue = () => {
    let officeHostRevenue = 0;
    let independentHostRevenue = 0;

    confirmedBookingsArray.forEach((booking) => {
      const bookingOffer = offers.find(
        (o) => o.booking_id === booking.id && o.status === 'accepted'
      );
      const hostUser = users.find((u) => u.email === booking.host_email);

      if (
        bookingOffer &&
        bookingOffer.sawa_commission !== undefined &&
        bookingOffer.sawa_commission !== null
      ) {
        if (hostUser?.host_type === 'office') {
          officeHostRevenue += bookingOffer.sawa_commission;
        } else {
          independentHostRevenue += bookingOffer.sawa_commission;
        }
      } else if (
        bookingOffer &&
        bookingOffer.host_price !== undefined &&
        bookingOffer.host_price !== null
      ) {
        const isOfficeHost = hostUser?.host_type === 'office';
        const commissionRate = isOfficeHost ? 0.28 : 0.35;
        const commission = bookingOffer.host_price * commissionRate;

        if (isOfficeHost) {
          officeHostRevenue += commission;
        } else {
          independentHostRevenue += commission;
        }
      }
    });

    return {
      total: officeHostRevenue, // The commission rates provided are for Sawa's cut, so this is total SAWA revenue.
      officeHost: officeHostRevenue,
      independent: independentHostRevenue,
    };
  };

  const sawaRevenueBreakdown = calculateSawaRevenue();

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold text-[var(--brand-primary)]'>Analytics Dashboard</h1>
        </div>

        {/* SAWA Revenue Section */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <Card className='bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl lg:col-span-1'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center'>
                  <Sparkles className='w-6 h-6' />
                </div>
                <div>
                  <div className='text-sm text-white/80'>Total SAWA Revenue</div>
                  <div className='text-3xl font-bold'>${sawaRevenueBreakdown.total.toFixed(0)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-2 border-purple-200'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center'>
                  <Building2 className='w-6 h-6 text-purple-600' />
                </div>
                <div>
                  <div className='text-sm text-gray-600'>Office Hosts (28%)</div>
                  <div className='text-3xl font-bold text-purple-600'>
                    ${sawaRevenueBreakdown.officeHost.toFixed(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-2 border-blue-200'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
                  <UserCheck className='w-6 h-6 text-blue-600' />
                </div>
                <div>
                  <div className='text-sm text-gray-600'>Independent (35%)</div>
                  <div className='text-3xl font-bold text-blue-600'>
                    ${sawaRevenueBreakdown.independent.toFixed(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='border-l-4 border-l-blue-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <Users className='w-8 h-8 text-blue-600' />
                <span className='text-sm font-medium text-gray-600'>Users Growth</span>
              </div>
              <p className='text-3xl font-bold text-gray-900 mb-2'>{users.length}</p>
              <div className='flex items-center gap-2 text-sm'>
                <TrendingUp className='w-4 h-4 text-green-600' />
                <span className='text-green-600 font-semibold'>+{newUsersLast7Days}</span>
                <span className='text-gray-500'>last 7 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-green-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <Calendar className='w-8 h-8 text-green-600' />
                <span className='text-sm font-medium text-gray-600'>Bookings</span>
              </div>
              <p className='text-3xl font-bold text-gray-900 mb-2'>{bookings.length}</p>
              <div className='flex items-center gap-2 text-sm'>
                <TrendingUp className='w-4 h-4 text-green-600' />
                <span className='text-green-600 font-semibold'>+{bookingsLast7Days}</span>
                <span className='text-gray-500'>last 7 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-purple-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <DollarSign className='w-8 h-8 text-purple-600' />
                <span className='text-sm font-medium text-gray-600'>Revenue</span>
              </div>
              <p className='text-3xl font-bold text-gray-900 mb-2'>
                ${revenueThisMonth.toFixed(0)}
              </p>
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-gray-500'>This month</span>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-orange-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <MessageSquare className='w-8 h-8 text-orange-600' />
                <span className='text-sm font-medium text-gray-600'>Engagement</span>
              </div>
              <p className='text-3xl font-bold text-gray-900 mb-2'>{activeConversations}</p>
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-gray-500'>Active chats (7d)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center'>
                <p className='text-5xl font-bold text-[var(--brand-primary)] mb-2'>
                  {conversionRate}%
                </p>
                <p className='text-sm text-gray-600'>Bookings confirmed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Avg. Booking Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center'>
                <p className='text-5xl font-bold text-green-600 mb-2'>
                  $
                  {confirmedBookingsCount > 0
                    ? (
                        confirmedBookingsArray.reduce((sum, b) => sum + (b.total_price || 0), 0) /
                        confirmedBookingsCount
                      ).toFixed(0)
                    : 0}
                </p>
                <p className='text-sm text-gray-600'>Per confirmed booking</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Host Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center'>
                <p className='text-5xl font-bold text-purple-600 mb-2'>
                  {users.length > 0
                    ? ((users.filter((u) => u.host_approved).length / users.length) * 100).toFixed(
                        0
                      )
                    : 0}
                  %
                </p>
                <p className='text-sm text-gray-600'>Approved hosts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* City Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by City</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {Object.entries(citiesStats).length > 0 ? (
                Object.entries(citiesStats).map(([city, stats]) => (
                  <div
                    key={city}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div className='flex-1'>
                      <p className='font-semibold text-gray-900'>{city}</p>
                      <p className='text-sm text-gray-600'>
                        {stats.confirmed} confirmed of {stats.total} bookings
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-bold text-green-600'>
                        ${stats.revenue.toFixed(0)}
                      </p>
                      <p className='text-sm text-gray-500'>Revenue</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-center text-gray-500'>No city data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                <span className='text-sm font-medium text-gray-700'>New Users</span>
                <span className='text-lg font-bold text-blue-600'>{newUsersLast30Days}</span>
              </div>
              <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                <span className='text-sm font-medium text-gray-700'>New Bookings</span>
                <span className='text-lg font-bold text-green-600'>{bookingsLast30Days}</span>
              </div>
              <div className='flex items-center justify-between p-3 bg-purple-50 rounded-lg'>
                <span className='text-sm font-medium text-gray-700'>Total Revenue</span>
                <span className='text-lg font-bold text-purple-600'>
                  ${revenueLast30Days.toFixed(0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
