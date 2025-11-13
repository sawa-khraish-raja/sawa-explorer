import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Loader2,
  Building2,
  Sparkles,
  Zap,
  Briefcase,
  MapPin,
  TrendingUp,
  Package,
} from 'lucide-react';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils';
import { createPageUrl } from '@/utils';
import { getAllDocuments, queryDocuments } from '@/utils/firestore';

import AdminLayout from '@/features/admin/components/AdminLayout';
import PermissionGuard from '@/features/admin/components/PermissionGuard';
import { UseAppContext } from '@/shared/context/AppContext';
import { showNotification } from '@/features/shared/notifications/NotificationManager';

const RevenueBreakdownDialog = lazy(
  () => import('@/features/admin/components/RevenueBreakdownDialog')
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);

  // Use AppContext for current user
  const { user, userLoading: isUserLoading } = UseAppContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const allUsers = await getAllDocuments('users');
      // Sort by created_date/created_at descending (newest first)
      return allUsers.sort((a, b) => {
        const dateA = new Date(a.created_date || a.created_at || 0);
        const dateB = new Date(b.created_date || b.created_at || 0);
        return dateB - dateA;
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      const allBookings = await getAllDocuments('bookings');
      // Sort by created_date descending (newest first)
      return allBookings.sort((a, b) => {
        const dateA = new Date(a.created_date || a.created_at || 0);
        const dateB = new Date(b.created_date || b.created_at || 0);
        return dateB - dateA;
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['allConversations'],
    queryFn: async () => {
      const allConversations = await getAllDocuments('conversations');
      // Sort by last_message_timestamp descending (newest first)
      return allConversations.sort((a, b) => {
        const dateA = new Date(a.last_message_timestamp || 0);
        const dateB = new Date(b.last_message_timestamp || 0);
        return dateB - dateA;
      });
    },
    staleTime: 3 * 60 * 1000,
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['allOffers'],
    queryFn: async () => {
      const allOffers = await getAllDocuments('offers');
      // Sort by created_date descending (newest first)
      return allOffers.sort((a, b) => {
        const dateA = new Date(a.created_date || a.created_at || 0);
        const dateB = new Date(b.created_date || b.created_at || 0);
        return dateB - dateA;
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: hosts = [] } = useQuery({
    queryKey: ['allHosts'],
    queryFn: async () => {
      // Get all users where host_approved is true
      return queryDocuments('users', [['host_approved', '==', true]]);
    },
    staleTime: 5 * 60 * 1000,
  });

  //  FIXED: useMemo BEFORE early return
  const stats = React.useMemo(() => {
    const totalUsers = users.length;
    const activeHosts = hosts.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
    const totalBookings = bookings.length;
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

    const serviceBookings = bookings.filter((b) => !b.adventure_id);
    const adventureBookings = bookings.filter((b) => b.adventure_id);

    const calculateDetailedSawaRevenue = () => {
      let officeHostRevenue = 0;
      let independentHostRevenue = 0;
      let officeBookingsCount = 0;
      let independentBookingsCount = 0;
      const breakdown = [];

      confirmedBookings.forEach((booking) => {
        const bookingOffer = offers.find(
          (o) => o.booking_id === booking.id && o.status === 'accepted'
        );
        const hostUser = users.find((u) => u.email === booking.host_email);
        const isOfficeHost = hostUser?.host_type === 'office';
        let commission = 0;

        if (bookingOffer && typeof bookingOffer.sawa_commission === 'number') {
          commission = bookingOffer.sawa_commission;
        } else if (bookingOffer && typeof bookingOffer.host_price === 'number') {
          const rate = isOfficeHost ? 0.28 : 0.35;
          commission = bookingOffer.host_price * rate;
        } else if (typeof booking.total_price === 'number') {
          commission = booking.total_price * 0.259;
        }

        if (isOfficeHost) {
          officeHostRevenue += commission;
          officeBookingsCount++;
        } else {
          independentHostRevenue += commission;
          independentBookingsCount++;
        }

        breakdown.push({
          booking_id: booking.id,
          city: booking.city,
          host_type: isOfficeHost ? 'Office' : 'Independent',
          commission: commission,
          rate: isOfficeHost ? '28%' : '35%',
        });
      });

      return {
        total: officeHostRevenue + independentHostRevenue,
        officeHost: officeHostRevenue,
        independent: independentHostRevenue,
        officeBookingsCount,
        independentBookingsCount,
        confirmedBookingsCount: confirmedBookings.length,
        breakdown,
      };
    };

    const sawaRevenue = calculateDetailedSawaRevenue();

    return {
      totalUsers,
      activeHosts,
      totalBookings,
      serviceBookings: serviceBookings.length,
      adventureBookings: adventureBookings.length,
      totalRevenue: totalRevenue.toFixed(0),
      sawaRevenue: sawaRevenue.total.toFixed(0),
      sawaRevenueDetails: sawaRevenue,
    };
  }, [users, bookings, hosts, offers]);

  const recentActivity = React.useMemo(() => {
    const activities = [
      ...bookings.slice(0, 5).map((b) => ({
        action: `New booking request by ${b.traveler_email || 'a user'} for ${
          b.offer_title || 'an adventure'
        }`,
        timestamp: b.created_date,
      })),
      ...offers.slice(0, 5).map((o) => ({
        action: `${
          o.offer_type === 'rental' ? 'Rental' : 'Service'
        } offer created by ${o.host_email || 'a host'}`,
        timestamp: o.created_date,
      })),
      ...conversations.slice(0, 5).map((c) => ({
        action: `New conversation started with ${c.traveler_email || 'a user'}`,
        timestamp: c.last_message_timestamp || c.created_date,
      })),
    ];

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
  }, [bookings, offers, conversations]);

  //  Admin check effect
  useEffect(() => {
    if (user && user.role_type !== 'admin') {
      console.log(' Admin access removed, redirecting to Home...');
      showNotification({
        title: '🏠 Redirecting...',
        message: 'Redirecting to Home page...',
        type: 'info',
        duration: 2000,
      });
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [user, navigate]);

  //  NOW the early return (after all hooks)
  if (usersLoading || bookingsLoading || isUserLoading) {
    return (
      <PermissionGuard pageId='dashboard'>
        <AdminLayout>
          <div className='flex justify-center items-center h-96'>
            <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
          </div>
        </AdminLayout>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard pageId='dashboard'>
      <AdminLayout currentPage='dashboard'>
        <div className='space-y-4 sm:space-y-6'>
          <div className='bg-gradient-to-r from-[#330066] via-[#9933CC] to-[#330066] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl'>
            <h1 className='text-slate-50 mb-1 text-xl font-bold sm:text-2xl lg:text-3xl xl:text-4xl sm:mb-2'>
              Admin Dashboard
            </h1>
            <p className='text-xs sm:text-sm text-purple-100'>
              Welcome back, {user?.full_name || user?.email || 'Admin'}
            </p>
          </div>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
            <StatCard
              icon={Users}
              title='Total Users'
              value={stats.totalUsers}
              gradient='from-[#330066] to-[#9933CC]'
            />
            <StatCard
              icon={UserCheck}
              title='Active Hosts'
              value={stats.activeHosts}
              gradient='from-[#9933CC] to-[#AD5CD6]'
            />
            <StatCard
              icon={Calendar}
              title='Total Bookings'
              value={stats.totalBookings}
              gradient='from-[#AD5CD6] to-[#CE9DE7]'
            />
            <StatCard
              icon={DollarSign}
              title='Total Revenue'
              value={`$${stats.totalRevenue}`}
              gradient='from-[#CE9DE7] to-[#E6E6FF]'
              textColor='text-[#330066]'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card className='border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg flex items-center gap-2 text-blue-900'>
                  <Briefcase className='w-5 h-5' />
                  Service Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-4xl font-bold text-blue-600 mb-2'>{stats.serviceBookings}</p>
                <p className='text-sm text-gray-600'>
                  {bookings.filter((b) => !b.adventure_id && b.status === 'confirmed').length}{' '}
                  confirmed
                </p>
              </CardContent>
            </Card>

            <Card className='border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg flex items-center gap-2 text-purple-900'>
                  <Sparkles className='w-5 h-5' />
                  Adventure Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-4xl font-bold text-purple-600 mb-2'>{stats.adventureBookings}</p>
                <p className='text-sm text-gray-600'>
                  {bookings.filter((b) => b.adventure_id && b.status === 'confirmed').length}{' '}
                  confirmed
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className='border-2 border-[#E6E6FF]'>
            <CardHeader className='p-3 sm:p-4 lg:p-6'>
              <CardTitle className='text-base sm:text-lg lg:text-xl text-[#330066]'>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className='p-3 sm:p-4 lg:p-6 pt-0'>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3'>
                <QuickActionButton
                  icon={Users}
                  label='Manage Users'
                  onClick={() => navigate('/AdminUsers')}
                />
                <QuickActionButton
                  icon={UserCheck}
                  label='Manage Hosts'
                  onClick={() => navigate('/AdminHosts')}
                  gradient='from-[#9933CC] to-[#AD5CD6]'
                />
                <QuickActionButton
                  icon={Calendar}
                  label='View Bookings'
                  onClick={() => navigate('/AdminBookings')}
                  gradient='from-[#AD5CD6] to-[#CE9DE7]'
                />
                <QuickActionButton
                  icon={Zap}
                  label='Manage Adventures'
                  onClick={() => navigate('/AdminAdventures')}
                  variant='outline'
                />
                <QuickActionButton
                  icon={MapPin}
                  label='Manage Cities'
                  onClick={() => navigate('/AdminCities')}
                  variant='outline'
                />
                <QuickActionButton
                  icon={Building2}
                  label='Manage Offices'
                  onClick={() => navigate('/AdminOffices')}
                  variant='outline'
                />
              </div>
            </CardContent>
          </Card>

          <Card className='border-2 border-[#E6E6FF]'>
            <CardHeader className='p-3 sm:p-4 lg:p-6'>
              <CardTitle className='text-base sm:text-lg lg:text-xl text-[#330066]'>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className='p-3 sm:p-4 lg:p-6 pt-0'>
              <div className='space-y-2 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto'>
                {recentActivity.map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card
            className='bg-gradient-to-br from-[#330066] via-[#9933CC] to-[#AD5CD6] border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer group'
            onClick={() => setShowRevenueBreakdown(true)}
          >
            <CardContent className='p-4 sm:p-6 lg:p-8'>
              <div className='flex flex-col gap-4 sm:gap-6'>
                <div className='flex items-start gap-3 sm:gap-4'>
                  <div className='w-12 h-12 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform flex-shrink-0'>
                    <Sparkles className='w-6 h-6 sm:w-7 sm:h-7 lg:w-10 lg:h-10 text-white' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 flex-wrap'>
                      <span className='text-xs sm:text-sm lg:text-base text-white/90 font-medium'>
                        💰 SAWA Commission Revenue
                      </span>
                      <Badge className='bg-white/20 text-white text-[10px] sm:text-xs backdrop-blur-sm'>
                        Total Earnings
                      </Badge>
                    </div>
                    <div className='text-3xl sm:text-4xl lg:text-6xl font-bold mb-2 sm:mb-3 text-white drop-shadow-lg'>
                      ${stats.sawaRevenue}
                    </div>
                    <div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/90'>
                      <p className='flex items-center gap-1.5 sm:gap-2'>
                        <Package className='w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0' />
                        <span className='break-words'>
                          {stats.sawaRevenueDetails.confirmedBookingsCount} confirmed booking
                          {stats.sawaRevenueDetails.confirmedBookingsCount !== 1 ? 's' : ''}
                        </span>
                      </p>
                      <div className='flex flex-col gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-white/20'>
                        <div className='flex items-center gap-1.5 sm:gap-2 flex-wrap'>
                          <Building2 className='w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0' />
                          <span className='font-semibold'>
                            ${stats.sawaRevenueDetails.officeHost.toFixed(0)}
                          </span>
                          <span className='text-white/70 text-[10px] sm:text-xs'>
                            from Office ({stats.sawaRevenueDetails.officeBookingsCount})
                          </span>
                        </div>
                        <div className='flex items-center gap-1.5 sm:gap-2 flex-wrap'>
                          <UserCheck className='w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0' />
                          <span className='font-semibold'>
                            ${stats.sawaRevenueDetails.independent.toFixed(0)}
                          </span>
                          <span className='text-white/70 text-[10px] sm:text-xs'>
                            from Independent ({stats.sawaRevenueDetails.independentBookingsCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showRevenueBreakdown && (
            <Suspense
              fallback={
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                  <Loader2 className='w-8 h-8 animate-spin text-white' />
                </div>
              }
            >
              <RevenueBreakdownDialog
                open={showRevenueBreakdown}
                onOpenChange={setShowRevenueBreakdown}
                revenueData={stats.sawaRevenueDetails}
                totalRevenue={stats.totalRevenue}
              />
            </Suspense>
          )}
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
}

const StatCard = React.memo(({ icon: Icon, title, value, gradient, textColor = 'text-white' }) => (
  <Card
    className={`bg-gradient-to-br ${gradient} ${
      textColor === 'text-white' ? 'text-white' : ''
    } border-0 shadow-xl hover:shadow-2xl transition-all`}
  >
    <CardContent className='p-3 sm:p-4 lg:p-6'>
      <div className='flex items-center justify-between mb-2 sm:mb-4'>
        <div className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm'>
          <Icon className='w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white' />
        </div>
        <TrendingUp className='w-3 h-3 sm:w-4 sm:h-4 lg:w-5 sm:h-5 text-white/60' />
      </div>
      <div className='text-[10px] sm:text-xs text-white/80 mb-0.5 sm:mb-1'>{title}</div>
      <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${textColor}`}>{value}</div>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

const QuickActionButton = React.memo(
  ({
    icon: Icon,
    label,
    onClick,
    gradient = 'from-[#330066] to-[#9933CC]',
    variant = 'default',
  }) => (
    <Button
      onClick={onClick}
      variant={variant}
      className={cn(
        'flex-col h-auto py-3 sm:py-4 px-2 sm:px-4',
        variant === 'default'
          ? `bg-gradient-to-r ${gradient} hover:opacity-90 text-white`
          : 'border-2 border-[#9933CC] text-[#330066] hover:bg-[#E6E6FF]'
      )}
    >
      <Icon className='w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mb-1 sm:mb-2' />
      <span className='text-[10px] sm:text-xs'>{label}</span>
    </Button>
  )
);

QuickActionButton.displayName = 'QuickActionButton';

const ActivityItem = React.memo(({ activity }) => {
  const isValidDate = activity.timestamp && !isNaN(new Date(activity.timestamp).getTime());
  const formattedDate = isValidDate
    ? format(new Date(activity.timestamp), 'PPp')
    : 'Date not available';

  return (
    <div className='flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-[#E6E6FF]/30 rounded-lg hover:bg-[#E6E6FF]/50 transition-colors'>
      <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#9933CC] mt-1.5 sm:mt-2 flex-shrink-0' />
      <div className='flex-1 min-w-0'>
        <p className='text-xs sm:text-sm font-medium text-gray-900 break-words'>
          {activity.action}
        </p>
        <p className='text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1'>{formattedDate}</p>
      </div>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';
