import { bookingService } from '../services/bookingService';

export const getBookingStatsUseCase = async (filters = {}) => {
  const stats = await bookingService.getBookingStats(filters);

  return {
    ...stats,
    averageBookingValue: stats.total > 0 ? stats.totalRevenue / stats.total : 0,
    cancellationRate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0,
    completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
  };
};
