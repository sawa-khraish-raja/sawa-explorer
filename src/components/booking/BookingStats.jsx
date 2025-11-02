import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BookingStats({ bookings }) {
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    totalSpent: bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0),
    upcomingTrips: bookings.filter(
      (b) => b.status === 'confirmed' && new Date(b.start_date) > new Date()
    ).length,
    cities: [...new Set(bookings.map((b) => b.city))].length,
  };

  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      label: 'Total Spent',
      value: `$${stats.totalSpent.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
    {
      label: 'Upcoming Trips',
      value: stats.upcomingTrips,
      icon: Calendar,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      label: 'Cities Visited',
      value: stats.cities,
      icon: MapPin,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
    },
  ];

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4'>
      {statCards.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className={`${stat.bg} border-2 ${stat.border} hover:shadow-lg transition-all`}>
            <CardContent className='p-3 sm:p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className='text-2xl font-bold text-gray-900 mb-1'>{stat.value}</div>
              <div className='text-xs text-gray-600 font-medium'>{stat.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
