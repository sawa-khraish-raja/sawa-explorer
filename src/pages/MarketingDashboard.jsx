import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  DollarSign,
  Target,
  Activity,
  Zap,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  TrendingDown,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

import MarketingLayout from '@/shared/components/marketing/MarketingLayout';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { getAllDocuments, queryDocuments } from '@/utils/firestore';
import { invokeFunction } from '@/utils/functions';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function MarketingDashboard() {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  //  Fetch real-time analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: async () => {
      const data = await getAllDocuments('analytics_data', '-sync_timestamp', 1);
      return data[0] || null;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  //  Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['smartCampaigns'],
    queryFn: () => getAllDocuments('smart_campaigns', '-created_date', 20),
  });

  //  Fetch campaign performance
  const { data: performance = [] } = useQuery({
    queryKey: ['campaignPerformance'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return queryDocuments('campaign_performance', {
        date: { $gte: weekAgo },
      });
    },
  });

  //  Fetch conversions
  const { data: conversions = [] } = useQuery({
    queryKey: ['conversions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return queryDocuments('conversion_events', {
        created_date: { $gte: today },
      });
    },
  });

  //  Fetch city data
  const { data: cityData = [] } = useQuery({
    queryKey: ['cityMarketingData'],
    queryFn: () => getAllDocuments('citymarketingdatas'),
  });

  //  Sync GA4 data
  const handleSyncGA4 = async () => {
    setSyncing(true);
    try {
      toast.info('Syncing with Google Analytics...');
      const response = await invokeFunction('GA4_Real_Sync', {});

      if (response.data?.ok) {
        toast.success(' Analytics synced successfully!');
        queryClient.invalidateQueries({ queryKey: ['analyticsData'] });
      } else {
        toast.error(response.data?.error || 'Sync failed');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  //  Calculate summary stats
  const stats = useMemo(() => {
    if (!analytics) {
      return {
        activeUsers: 0,
        totalUsers: 0,
        newUsers: 0,
        conversionRate: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
      };
    }

    return {
      activeUsers: analytics.active_users || 0,
      totalUsers: analytics.total_users || 0,
      newUsers: analytics.new_users || 0,
      conversionRate: analytics.conversion_rate || 0,
      avgSessionDuration: analytics.session_duration_avg || 0,
      bounceRate: analytics.bounce_rate || 0,
    };
  }, [analytics]);

  //  Calculate campaign metrics
  const campaignMetrics = useMemo(() => {
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_suggestion || 0), 0);
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
    const avgPerformance =
      campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + (c.performance_score || 0), 0) / campaigns.length
        : 0;

    const totalRevenue = performance.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalCost = performance.reduce((sum, p) => sum + (p.cost || 0), 0);
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    return {
      totalBudget,
      activeCampaigns,
      avgPerformance,
      totalRevenue,
      roi,
    };
  }, [campaigns, performance]);

  //  Conversion funnel
  const conversionFunnel = useMemo(() => {
    const pageViews = conversions.filter((c) => c.event_type === 'page_view').length;
    const bookingStarted = conversions.filter((c) => c.event_type === 'booking_started').length;
    const bookingCompleted = conversions.filter((c) => c.event_type === 'booking_completed').length;

    return [
      { stage: 'Page Views', count: pageViews, percentage: 100 },
      {
        stage: 'Booking Started',
        count: bookingStarted,
        percentage: pageViews > 0 ? (bookingStarted / pageViews) * 100 : 0,
      },
      {
        stage: 'Completed',
        count: bookingCompleted,
        percentage: pageViews > 0 ? (bookingCompleted / pageViews) * 100 : 0,
      },
    ];
  }, [conversions]);

  //  Traffic sources chart data
  const trafficData = useMemo(() => {
    if (!analytics?.traffic_sources) return [];

    return Object.entries(analytics.traffic_sources).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value,
    }));
  }, [analytics]);

  //  Country distribution
  const countryData = useMemo(() => {
    if (!analytics?.country_distribution) return [];

    return Object.entries(analytics.country_distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [analytics]);

  //  Device breakdown from conversions
  const deviceData = useMemo(() => {
    const devices = { mobile: 0, tablet: 0, desktop: 0 };
    conversions.forEach((c) => {
      if (c.device_type) devices[c.device_type]++;
    });

    return [
      { name: 'Mobile', value: devices.mobile, icon: Smartphone },
      { name: 'Desktop', value: devices.desktop, icon: Monitor },
      { name: 'Tablet', value: devices.tablet, icon: Tablet },
    ];
  }, [conversions]);

  //  Last sync time
  const lastSync = analytics?.sync_timestamp
    ? new Date(analytics.sync_timestamp).toLocaleString()
    : 'Never';

  if (analyticsLoading) {
    return (
      <MarketingLayout>
        <div className='flex items-center justify-center h-96'>
          <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className='p-4 sm:p-6 space-y-6'>
        {/* Hero Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2'>
              Marketing Intelligence
            </h1>
            <p className='text-sm text-gray-600'>Last synced: {lastSync}</p>
          </div>
          <Button
            onClick={handleSyncGA4}
            disabled={syncing}
            className='bg-purple-600 hover:bg-purple-700'
          >
            {syncing ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className='w-4 h-4 mr-2' />
                Sync Analytics
              </>
            )}
          </Button>
        </div>

        {/* Key Metrics - Top Row */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          <MetricCard
            title='Active Users'
            value={stats.activeUsers}
            change='+12%'
            icon={<Activity className='w-5 h-5 text-green-600' />}
            trend='up'
          />
          <MetricCard
            title='Total Users'
            value={stats.totalUsers.toLocaleString()}
            change='+8%'
            icon={<Users className='w-5 h-5 text-blue-600' />}
            trend='up'
          />
          <MetricCard
            title='Conversion Rate'
            value={`${stats.conversionRate.toFixed(2)}%`}
            change='+0.3%'
            icon={<Target className='w-5 h-5 text-purple-600' />}
            trend='up'
          />
          <MetricCard
            title='ROI'
            value={`${campaignMetrics.roi.toFixed(1)}%`}
            change='+15%'
            icon={<DollarSign className='w-5 h-5 text-orange-600' />}
            trend='up'
          />
        </div>

        {/* Secondary Metrics */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          <MetricCard
            title='New Users'
            value={stats.newUsers}
            subtitle='Today'
            icon={<Users className='w-4 h-4 text-indigo-600' />}
            small
          />
          <MetricCard
            title='Avg. Session'
            value={`${Math.floor(stats.avgSessionDuration / 60)}m ${
              stats.avgSessionDuration % 60
            }s`}
            icon={<Clock className='w-4 h-4 text-pink-600' />}
            small
          />
          <MetricCard
            title='Bounce Rate'
            value={`${stats.bounceRate.toFixed(1)}%`}
            icon={<TrendingDown className='w-4 h-4 text-red-600' />}
            small
          />
          <MetricCard
            title='Active Campaigns'
            value={campaignMetrics.activeCampaigns}
            subtitle={`$${campaignMetrics.totalBudget} budget`}
            icon={<Zap className='w-4 h-4 text-yellow-600' />}
            small
          />
        </div>

        {/* Charts Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base sm:text-lg'>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={250}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base sm:text-lg'>Top Countries</CardTitle>
              <CardDescription>User distribution by country</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={countryData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='value' fill='#8b5cf6' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>Conversion Funnel (Today)</CardTitle>
            <CardDescription>User journey from view to booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {conversionFunnel.map((stage, idx) => (
                <div key={idx} className='relative'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium'>{stage.stage}</span>
                    <span className='text-sm text-gray-600'>
                      {stage.count} ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-3'>
                    <div
                      className='bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all'
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>Device Distribution</CardTitle>
            <CardDescription>Conversions by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-3 gap-4'>
              {deviceData.map((device) => {
                const Icon = device.icon;
                const total = deviceData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? (device.value / total) * 100 : 0;

                return (
                  <div key={device.name} className='text-center p-4 bg-gray-50 rounded-lg'>
                    <Icon className='w-8 h-8 mx-auto mb-2 text-purple-600' />
                    <div className='text-xl font-bold'>{device.value}</div>
                    <div className='text-xs text-gray-600'>{device.name}</div>
                    <div className='text-xs text-purple-600 font-semibold mt-1'>
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Cities Performance */}
        {cityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base sm:text-lg'>City Performance</CardTitle>
              <CardDescription>Marketing performance by destination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {cityData.slice(0, 5).map((city) => (
                  <div
                    key={city.id}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <MapPin className='w-5 h-5 text-purple-600' />
                      <div>
                        <div className='font-medium'>{city.city_name}</div>
                        <div className='text-xs text-gray-600'>
                          {city.active_hosts} hosts • {city.total_adventures} adventures
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        city.market_potential === 'high'
                          ? 'bg-green-100 text-green-800'
                          : city.market_potential === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }
                    >
                      {city.market_potential}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>Campaign Performance</CardTitle>
            <CardDescription>Overview of active marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600'>{campaigns.length}</div>
                <div className='text-xs text-gray-600'>Total Campaigns</div>
              </div>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  {campaignMetrics.activeCampaigns}
                </div>
                <div className='text-xs text-gray-600'>Active Now</div>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>
                  {campaignMetrics.avgPerformance.toFixed(0)}%
                </div>
                <div className='text-xs text-gray-600'>Avg Performance</div>
              </div>
              <div className='text-center p-4 bg-orange-50 rounded-lg'>
                <div className='text-2xl font-bold text-orange-600'>
                  ${campaignMetrics.totalRevenue.toFixed(0)}
                </div>
                <div className='text-xs text-gray-600'>Revenue (7d)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MarketingLayout>
  );
}

function MetricCard({ title, value, change, subtitle, icon, trend, small = false }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : '';

  return (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardContent className={small ? 'p-4' : 'p-4 sm:p-6'}>
        <div className='flex items-start justify-between mb-2'>
          <div className={`text-xs sm:text-sm font-medium text-gray-600 ${small ? '' : 'mb-1'}`}>
            {title}
          </div>
          {icon}
        </div>
        <div
          className={
            small ? 'text-xl sm:text-2xl font-bold' : 'text-2xl sm:text-3xl font-bold mb-1'
          }
        >
          {value}
        </div>
        {change && TrendIcon && (
          <div className={`flex items-center text-xs sm:text-sm ${trendColor}`}>
            <TrendIcon className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
            {change}
          </div>
        )}
        {subtitle && <div className='text-xs text-gray-500 mt-1'>{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
