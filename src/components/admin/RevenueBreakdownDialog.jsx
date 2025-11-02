import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  DollarSign,
  Building2,
  UserCheck,
  TrendingUp,
  Calendar,
  Activity,
  MapPin,
} from 'lucide-react';

export default function RevenueBreakdownDialog({ open, onOpenChange, revenueData, totalRevenue }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#E6E6FF] to-white'>
        <DialogHeader>
          <DialogTitle className='text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#330066] to-[#9933CC] bg-clip-text text-transparent flex items-center gap-3'>
            <Sparkles className='w-6 h-6 sm:w-8 sm:h-8 text-[#9933CC]' />
            SAWA Revenue Breakdown & Analytics
          </DialogTitle>
          <p className='text-gray-600'>Complete financial analysis from all confirmed bookings</p>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card className='bg-gradient-to-br from-[#330066] to-[#9933CC] text-white border-0'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex items-center gap-3 mb-2'>
                  <DollarSign className='w-6 h-6' />
                  <span className='text-sm font-medium'>Total SAWA Revenue</span>
                </div>
                <p className='text-2xl sm:text-3xl font-bold'>${revenueData.total.toFixed(2)}</p>
                <p className='text-xs text-white/70 mt-2'>
                  {revenueData.confirmedBookingsCount} confirmed booking
                  {revenueData.confirmedBookingsCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-[#9933CC] to-[#AD5CD6] text-white border-0'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex items-center gap-3 mb-2'>
                  <Building2 className='w-6 h-6' />
                  <span className='text-sm font-medium'>Office Hosts (28%)</span>
                </div>
                <p className='text-2xl sm:text-3xl font-bold'>
                  ${revenueData.officeHost.toFixed(2)}
                </p>
                <p className='text-xs text-white/70 mt-2'>
                  {revenueData.officeBookingsCount} booking
                  {revenueData.officeBookingsCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-[#AD5CD6] to-[#CE9DE7] text-white border-0'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex items-center gap-3 mb-2'>
                  <UserCheck className='w-6 h-6' />
                  <span className='text-sm font-medium'>Independent (35%)</span>
                </div>
                <p className='text-2xl sm:text-3xl font-bold'>
                  ${revenueData.independent.toFixed(2)}
                </p>
                <p className='text-xs text-white/70 mt-2'>
                  {revenueData.independentBookingsCount} booking
                  {revenueData.independentBookingsCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Statistics */}
          <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'>
            <CardHeader className='bg-white/50 border-b'>
              <CardTitle className='text-base sm:text-lg text-[#330066] flex items-center gap-2'>
                <TrendingUp className='w-4 h-4 sm:w-5 sm:h-5' />
                Key Insights & Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <InsightCard
                  icon={DollarSign}
                  title='Avg Commission'
                  value={`$${
                    revenueData.confirmedBookingsCount > 0
                      ? (revenueData.total / revenueData.confirmedBookingsCount).toFixed(2)
                      : '0.00'
                  }`}
                  subtitle='per booking'
                  color='bg-blue-100 text-blue-600'
                />
                <InsightCard
                  icon={TrendingUp}
                  title='Highest'
                  value={`$${
                    revenueData.breakdown.length > 0
                      ? Math.max(...revenueData.breakdown.map((b) => b.commission)).toFixed(2)
                      : '0.00'
                  }`}
                  subtitle='single commission'
                  color='bg-green-100 text-green-600'
                />
                <InsightCard
                  icon={Building2}
                  title='Office Share'
                  value={`${
                    revenueData.total > 0
                      ? ((revenueData.officeHost / revenueData.total) * 100).toFixed(1)
                      : '0.0'
                  }%`}
                  subtitle='of total revenue'
                  color='bg-purple-100 text-purple-600'
                />
                <InsightCard
                  icon={Calendar}
                  title='Total Bookings Value'
                  value={`$${totalRevenue}`}
                  subtitle='from confirmed bookings'
                  color='bg-amber-100 text-amber-600'
                />
              </div>
            </CardContent>
          </Card>

          {/* Revenue by City */}
          <Card className='bg-white border-2 border-[#CCCCFF]'>
            <CardHeader className='bg-gradient-to-r from-[#E6E6FF] to-white border-b'>
              <CardTitle className='text-base sm:text-lg text-[#330066] flex items-center gap-2'>
                <MapPin className='w-4 h-4 sm:w-5 sm:h-5' />
                Revenue by City
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='space-y-3'>
                {(() => {
                  const cityRevenue = {};
                  revenueData.breakdown.forEach((item) => {
                    if (item.city) {
                      if (!cityRevenue[item.city]) {
                        cityRevenue[item.city] = { total: 0, count: 0 };
                      }
                      cityRevenue[item.city].total += item.commission;
                      cityRevenue[item.city].count += 1;
                    }
                  });

                  const sortedCityRevenue = Object.entries(cityRevenue).sort(
                    ([, a], [, b]) => b.total - a.total
                  );

                  return sortedCityRevenue.length > 0 ? (
                    sortedCityRevenue.map(([city, data]) => (
                      <CityRevenueRow
                        key={city}
                        city={city}
                        data={data}
                        totalRevenue={revenueData.total}
                      />
                    ))
                  ) : (
                    <p className='text-gray-500 text-center'>No city revenue data available.</p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <Card className='bg-white border-2 border-[#CCCCFF]'>
            <CardHeader className='bg-gradient-to-r from-[#E6E6FF] to-white border-b'>
              <CardTitle className='text-base sm:text-lg text-[#330066] flex items-center gap-2'>
                <Activity className='w-4 h-4 sm:w-5 sm:h-5' />
                Office vs Independent Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='space-y-6'>
                <div className='space-y-3'>
                  <ComparisonBar
                    icon={Building2}
                    label='Office Hosts (28% rate)'
                    value={revenueData.officeHost}
                    total={revenueData.total}
                    count={revenueData.officeBookingsCount}
                    color='from-[#330066] to-[#9933CC]'
                  />
                  <ComparisonBar
                    icon={UserCheck}
                    label='Independent Hosts (35% rate)'
                    value={revenueData.independent}
                    total={revenueData.total}
                    count={revenueData.independentBookingsCount}
                    color='from-[#AD5CD6] to-[#CE9DE7]'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t'>
                  <AverageCard
                    title='Avg per Office Booking'
                    value={`$${
                      revenueData.officeBookingsCount > 0
                        ? (revenueData.officeHost / revenueData.officeBookingsCount).toFixed(2)
                        : '0.00'
                    }`}
                    color='bg-purple-50 text-[#9933CC]'
                  />
                  <AverageCard
                    title='Avg per Independent Booking'
                    value={`$${
                      revenueData.independentBookingsCount > 0
                        ? (revenueData.independent / revenueData.independentBookingsCount).toFixed(
                            2
                          )
                        : '0.00'
                    }`}
                    color='bg-blue-50 text-blue-600'
                  />
                  <AverageCard
                    title='Overall Average'
                    value={`$${
                      revenueData.confirmedBookingsCount > 0
                        ? (revenueData.total / revenueData.confirmedBookingsCount).toFixed(2)
                        : '0.00'
                    }`}
                    color='bg-green-50 text-green-600'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown Table */}
          <Card className='bg-white border-2 border-[#CCCCFF]'>
            <CardHeader className='bg-gradient-to-r from-[#E6E6FF] to-white border-b'>
              <CardTitle className='text-base sm:text-lg text-[#330066]'>
                📊 Booking-by-Booking Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-50 border-b'>
                      <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600'>
                        Booking ID
                      </th>
                      <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600'>
                        City
                      </th>
                      <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600'>
                        Host Type
                      </th>
                      <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600'>
                        Rate
                      </th>
                      <th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-gray-600'>
                        Commission
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.breakdown.map((item, idx) => (
                      <tr key={idx} className='border-b hover:bg-purple-50 transition-colors'>
                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-mono text-gray-600'>
                          {item.booking_id.slice(0, 8)}
                        </td>
                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900'>
                          {item.city || 'N/A'}
                        </td>
                        <td className='px-3 py-2 sm:px-4 sm:py-3'>
                          <Badge
                            className={
                              item.host_type === 'Office'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {item.host_type}
                          </Badge>
                        </td>
                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-[#9933CC]'>
                          {item.rate}
                        </td>
                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-bold text-green-600'>
                          ${item.commission.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='bg-gradient-to-r from-[#E6E6FF] to-white font-bold'>
                      <td
                        colSpan='4'
                        className='px-3 py-3 sm:px-4 sm:py-4 text-right text-[#330066]'
                      >
                        Total SAWA Revenue:
                      </td>
                      <td className='px-3 py-3 sm:px-4 sm:py-4 text-right text-lg sm:text-xl text-[#330066]'>
                        ${revenueData.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

//  Memoized Sub-components
const InsightCard = React.memo(({ icon: Icon, title, value, subtitle, color }) => (
  <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
    <div
      className={`w-7 h-7 sm:w-8 sm:h-8 ${color} rounded-lg flex items-center justify-center mx-auto mb-2`}
    >
      <Icon className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
    </div>
    <p className='text-xs text-gray-600 mb-1 font-medium'>{title}</p>
    <p className='text-xl sm:text-2xl font-bold text-gray-900'>{value}</p>
    <p className='text-xs text-gray-500 mt-1'>{subtitle}</p>
  </div>
));

InsightCard.displayName = 'InsightCard';

const CityRevenueRow = React.memo(({ city, data, totalRevenue }) => (
  <div className='flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors'>
    <div className='flex items-center gap-3'>
      <div className='w-9 h-9 sm:w-10 sm:h-10 bg-[#9933CC] rounded-lg flex items-center justify-center'>
        <MapPin className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
      </div>
      <div>
        <p className='font-semibold text-gray-900'>{city}</p>
        <p className='text-xs text-gray-600'>
          {data.count} booking{data.count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
    <div className='text-right'>
      <p className='text-base sm:text-lg font-bold text-[#330066]'>${data.total.toFixed(2)}</p>
      <p className='text-xs text-gray-500'>
        {totalRevenue > 0 ? ((data.total / totalRevenue) * 100).toFixed(1) : '0.0'}% of total
      </p>
    </div>
  </div>
));

CityRevenueRow.displayName = 'CityRevenueRow';

const ComparisonBar = React.memo(({ icon: Icon, label, value, total, count, color }) => (
  <div>
    <div className='flex items-center justify-between mb-2'>
      <span className='text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2'>
        <Icon className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
        {label}
      </span>
      <span className='text-xs sm:text-sm font-bold text-purple-600'>${value.toFixed(2)}</span>
    </div>
    <div className='w-full h-8 bg-gray-100 rounded-lg overflow-hidden'>
      <div
        className={`h-full bg-gradient-to-r ${color} flex items-center justify-end pr-2 transition-all duration-500`}
        style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
      >
        <span className='text-white text-xs font-bold'>
          {total > 0 ? ((value / total) * 100).toFixed(1) : 0}%
        </span>
      </div>
    </div>
    <p className='text-xs text-gray-500 mt-1'>{count} bookings</p>
  </div>
));

ComparisonBar.displayName = 'ComparisonBar';

const AverageCard = React.memo(({ title, value, color }) => (
  <div className={`text-center p-3 ${color} rounded-lg`}>
    <p className='text-xs text-gray-600 mb-1'>{title}</p>
    <p className='text-lg sm:text-xl font-bold'>{value}</p>
  </div>
));

AverageCard.displayName = 'AverageCard';
