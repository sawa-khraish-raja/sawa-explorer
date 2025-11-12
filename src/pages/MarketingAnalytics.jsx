import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  Users,
  TrendingUp,
  Activity,
  BarChart3,
  Loader2,
  MapPin,
  DollarSign,
  Calendar,
  MessageSquare,
  Sparkles,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getAllDocuments } from '@/utils/firestore';

import MarketingGuard from '@/shared/components/marketing/MarketingGuard';
import MarketingLayout from '@/shared/components/marketing/MarketingLayout';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'];

export default function MarketingAnalytics() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('7days');

  //  Fetch admin analytics data (same as AdminAnalytics)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => getAllDocuments('users'),
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => getAllDocuments('bookings'),
    refetchInterval: 30000,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['allConversations'],
    queryFn: () => getAllDocuments('conversations'),
    refetchInterval: 30000,
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['allOffers'],
    queryFn: () => getAllDocuments('offers'),
    refetchInterval: 30000,
  });

  //  Fetch Google Analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['google_analytics_data'],
    queryFn: async () => {
      const data = await getAllDocuments('analytics_data', '-created_date', 1);
      return data.length > 0 ? data[0] : null;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const analytics = useMemo(() => {
    if (!users.length || !bookings.length) {
      return {
        totalUsers: 0,
        newUsersLast7Days: 0,
        bookingsLast7Days: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        revenueThisMonth: 0,
        activeConversations: 0,
        conversionRate: 0,
        avgBookingValue: 0,
        hostApprovalRate: 0,
        sawaRevenue: { total: 0, officeHost: 0, independent: 0 },
        usersByCountry: [],
        usersByLanguage: [],
        topCities: [],
        growthData: [],
      };
    }

    const last7Days = subDays(new Date(), 7);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // User metrics
    const newUsersLast7Days = users.filter((u) => new Date(u.created_date) > last7Days).length;
    const approvedHosts = users.filter((u) => u.host_approved);
    const hostApprovalRate = users.length > 0 ? (approvedHosts.length / users.length) * 100 : 0;

    // Booking metrics
    const bookingsLast7Days = bookings.filter((b) => new Date(b.created_date) > last7Days).length;
    const confirmedBookingsArray = bookings.filter(
      (b) => b.status === 'confirmed' || b.state === 'confirmed'
    );
    const confirmedBookingsCount = confirmedBookingsArray.length;
    const conversionRate =
      bookings.length > 0 ? (confirmedBookingsCount / bookings.length) * 100 : 0;

    // Revenue metrics
    const revenueThisMonth = bookings
      .filter(
        (b) =>
          (b.status === 'confirmed' || b.state === 'confirmed') &&
          new Date(b.created_date) >= startOfMonth
      )
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const avgBookingValue =
      confirmedBookingsCount > 0
        ? confirmedBookingsArray.reduce((sum, b) => sum + (b.total_price || 0), 0) /
          confirmedBookingsCount
        : 0;

    // Conversation metrics
    const activeConversations = conversations.filter(
      (c) => c.last_message_timestamp && new Date(c.last_message_timestamp) > last7Days
    ).length;

    // SAWA Revenue Breakdown
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
        total: officeHostRevenue + independentHostRevenue,
        officeHost: officeHostRevenue,
        independent: independentHostRevenue,
      };
    };

    const sawaRevenue = calculateSawaRevenue();

    // Users by country
    const countryData = {};
    users.forEach((u) => {
      if (u.country) {
        countryData[u.country] = (countryData[u.country] || 0) + 1;
      }
    });
    const usersByCountry = Object.entries(countryData)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Users by language
    const langData = {};
    users.forEach((u) => {
      const lang = u.languages?.[0] || 'en';
      langData[lang] = (langData[lang] || 0) + 1;
    });
    const usersByLanguage = Object.entries(langData)
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count);

    // City breakdown
    const citiesStats = {};
    bookings.forEach((booking) => {
      if (booking.city) {
        if (!citiesStats[booking.city]) {
          citiesStats[booking.city] = { total: 0, confirmed: 0, revenue: 0 };
        }
        citiesStats[booking.city].total++;
        if (booking.status === 'confirmed' || booking.state === 'confirmed') {
          citiesStats[booking.city].confirmed++;
          citiesStats[booking.city].revenue += booking.total_price || 0;
        }
      }
    });

    const topCities = Object.entries(citiesStats)
      .map(([city, stats]) => ({ city, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalUsers: users.length,
      newUsersLast7Days,
      bookingsLast7Days,
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookingsCount,
      revenueThisMonth,
      activeConversations,
      conversionRate,
      avgBookingValue,
      hostApprovalRate,
      sawaRevenue,
      usersByCountry,
      usersByLanguage,
      topCities,
    };
  }, [users, bookings, conversations, offers]);

  const isLoading = usersLoading || bookingsLoading || conversationsLoading || offersLoading;

  if (isLoading) {
    return (
      <MarketingGuard>
        <MarketingLayout>
          <div className='flex flex-col justify-center items-center h-96'>
            <Loader2 className='w-8 h-8 animate-spin text-purple-600 mb-4' />
            <p className='text-gray-600'>Loading analytics...</p>
          </div>
        </MarketingLayout>
      </MarketingGuard>
    );
  }

  return (
    <MarketingGuard>
      <MarketingLayout>
        <div className='space-y-6'>
          {/* Header */}
          <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white shadow-xl'>
            <div className='flex items-start justify-between'>
              <div>
                <h1 className='text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3'>
                  <BarChart3 className='w-8 h-8 md:w-10 md:h-10' />
                  Platform Analytics
                </h1>
                <p className='text-blue-100 text-base md:text-lg'>
                  Real-time marketing and audience insights
                </p>
                <p className='text-sm text-blue-200 mt-2'>
                  Auto-refreshes every 30 seconds • Last updated: {format(new Date(), 'HH:mm:ss')}
                </p>
              </div>
            </div>

            {/* Google Analytics Badge */}
            {analyticsData && (
              <div className='mt-4'>
                <Badge className='bg-white/20 text-white border-0'>
                  <Activity className='w-3 h-3 mr-1' />
                  Google Analytics:{' '}
                  {analyticsData.data_source === 'combined' ? 'Connected' : 'Internal Data Only'}
                </Badge>
              </div>
            )}
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
                    <div className='text-3xl font-bold'>
                      ${analytics.sawaRevenue.total.toFixed(0)}
                    </div>
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
                      ${analytics.sawaRevenue.officeHost.toFixed(0)}
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
                      ${analytics.sawaRevenue.independent.toFixed(0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics - 4 Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card className='border-l-4 border-l-blue-500'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <Users className='w-8 h-8 text-blue-600' />
                  <span className='text-sm font-medium text-gray-600'>Users Growth</span>
                </div>
                <p className='text-3xl font-bold text-gray-900 mb-2'>{analytics.totalUsers}</p>
                <div className='flex items-center gap-2 text-sm'>
                  <TrendingUp className='w-4 h-4 text-green-600' />
                  <span className='text-green-600 font-semibold'>
                    +{analytics.newUsersLast7Days}
                  </span>
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
                <p className='text-3xl font-bold text-gray-900 mb-2'>{analytics.totalBookings}</p>
                <div className='flex items-center gap-2 text-sm'>
                  <TrendingUp className='w-4 h-4 text-green-600' />
                  <span className='text-green-600 font-semibold'>
                    +{analytics.bookingsLast7Days}
                  </span>
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
                  ${analytics.revenueThisMonth.toFixed(0)}
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
                <p className='text-3xl font-bold text-gray-900 mb-2'>
                  {analytics.activeConversations}
                </p>
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
                    {analytics.conversionRate.toFixed(1)}%
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
                    ${analytics.avgBookingValue.toFixed(0)}
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
                    {analytics.hostApprovalRate.toFixed(0)}%
                  </p>
                  <p className='text-sm text-gray-600'>Approved hosts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Analytics Insights */}
          {analyticsData && (
            <Card className='border-2 border-green-200'>
              <CardHeader className='bg-gradient-to-r from-green-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='w-5 h-5 text-green-600' />
                  Google Analytics Insights
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='text-center p-4 bg-green-50 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Bounce Rate</p>
                    <p className='text-2xl font-bold text-green-600'>
                      {analyticsData.bounce_rate || 0}%
                    </p>
                  </div>
                  <div className='text-center p-4 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Avg Session</p>
                    <p className='text-2xl font-bold text-blue-600'>
                      {Math.round((analyticsData.session_duration_avg || 0) / 60)}m
                    </p>
                  </div>
                  <div className='text-center p-4 bg-purple-50 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Engagement</p>
                    <p className='text-2xl font-bold text-purple-600'>
                      {Math.round((analyticsData.avg_engagement_time || 0) / 60)}m
                    </p>
                  </div>
                  <div className='text-center p-4 bg-orange-50 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Conversion</p>
                    <p className='text-2xl font-bold text-orange-600'>
                      {analyticsData.conversion_rate || 0}%
                    </p>
                  </div>
                </div>

                {/* Traffic Sources */}
                {analyticsData.traffic_sources && (
                  <div className='mt-6'>
                    <h4 className='font-semibold text-gray-900 mb-3'>Traffic Sources</h4>
                    <div className='space-y-2'>
                      {Object.entries(analyticsData.traffic_sources).map(([source, percentage]) => (
                        <div key={source} className='flex items-center gap-3'>
                          <div className='w-24 text-sm text-gray-700 capitalize'>{source}</div>
                          <div className='flex-1'>
                            <div className='w-full bg-gray-200 rounded-full h-2'>
                              <div
                                className='bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full'
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className='w-12 text-right'>
                            <Badge className='bg-green-100 text-green-800 text-xs'>
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts Row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Users by Country */}
            {analytics.usersByCountry.length > 0 && (
              <Card className='border-2 border-indigo-200'>
                <CardHeader className='bg-gradient-to-r from-indigo-50 to-white'>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5 text-indigo-600' />
                    Users by Country
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-6'>
                  <div className='h-64'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={analytics.usersByCountry}
                          dataKey='count'
                          nameKey='country'
                          cx='50%'
                          cy='50%'
                          outerRadius={80}
                          label
                        >
                          {analytics.usersByCountry.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users by Language */}
            {analytics.usersByLanguage.length > 0 && (
              <Card className='border-2 border-pink-200'>
                <CardHeader className='bg-gradient-to-r from-pink-50 to-white'>
                  <CardTitle className='flex items-center gap-2'>
                    <MessageSquare className='w-5 h-5 text-pink-600' />
                    Users by Language
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-6'>
                  <div className='space-y-3'>
                    {analytics.usersByLanguage.map((item, idx) => (
                      <div key={idx} className='flex items-center gap-3'>
                        <div className='w-12 text-sm font-semibold text-gray-700'>
                          {item.lang.toUpperCase()}
                        </div>
                        <div className='flex-1'>
                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full'
                              style={{
                                width: `${(item.count / analytics.totalUsers) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className='w-12 text-right'>
                          <Badge className='bg-pink-100 text-pink-800'>{item.count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* City Performance */}
          {analytics.topCities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by City</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.topCities.map((city) => (
                    <div
                      key={city.city}
                      className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                    >
                      <div className='flex-1'>
                        <p className='font-semibold text-gray-900'>{city.city}</p>
                        <p className='text-sm text-gray-600'>
                          {city.confirmed} confirmed of {city.total} bookings
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-bold text-green-600'>
                          ${city.revenue.toFixed(0)}
                        </p>
                        <p className='text-sm text-gray-500'>Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MarketingLayout>
    </MarketingGuard>
  );
}
