import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  XCircle,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  User,
  Calendar,
  List,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminCancellations() {
  const { data: cancellationRequests = [], isLoading } = useQuery({
    queryKey: ['cancellationRequests'],
    queryFn: async () => {
      const requests = await getAllDocuments('cancellationrequests');
      return requests;
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => getAllDocuments('bookings'),
  });

  const getBooking = (bookingId) => bookings.find((b) => b.id === bookingId);

  const statusConfig = {
    auto_approved: {
      label: 'Auto-Approved',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
    },
  };

  const RequestCard = ({ request }) => {
    const booking = getBooking(request.booking_id);
    if (!booking) return null;

    const config = statusConfig.auto_approved;
    const StatusIcon = config.icon;

    return (
      <Card className='hover:shadow-md transition-shadow'>
        <CardContent className='p-4'>
          <div className='flex items-start justify-between gap-4 mb-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <h3 className='font-semibold text-gray-900'>
                  {booking.city} - {booking.id.slice(0, 8)}
                </h3>
                <Badge className={cn('text-xs', config.color)}>
                  <StatusIcon className='w-3 h-3 mr-1' />
                  {config.label}
                </Badge>
              </div>

              <div className='space-y-1 text-sm text-gray-600'>
                <div className='flex items-center gap-2'>
                  <User className='w-4 h-4' />
                  {request.requester_type === 'traveler' ? 'Traveler' : 'Host'}:{' '}
                  {request.requester_email}
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Check-in: {format(new Date(booking.start_date), 'MMM d, yyyy')}
                </div>
                <div className='flex items-center gap-2'>
                  <Clock className='w-4 h-4' />
                  {request.days_until_checkin} days until check-in
                </div>
                <div className='flex items-center gap-2'>
                  <DollarSign className='w-4 h-4' />
                  Refund: ${request.calculated_refund?.toFixed(2)} | Fee: $
                  {request.cancellation_fee?.toFixed(2)}
                </div>
              </div>

              <div className='mt-3 p-3 bg-gray-50 rounded-lg'>
                <p className='text-xs text-gray-600 mb-1 font-semibold'>
                  Reason ({request.reason_category}):
                </p>
                <p className='text-sm text-gray-900'>{request.reason}</p>
              </div>
            </div>
          </div>

          <p className='text-xs text-gray-500 mt-2'>
            Auto-approved on {format(new Date(request.approved_at), 'MMM d, yyyy HH:mm')}
          </p>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg'>
          <h1 className='text-3xl font-bold mb-2'>Cancellation History</h1>
          <p className='text-green-100'>View all booking cancellations (auto-approved)</p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card className='border-2 border-green-200'>
            <CardContent className='p-4 flex items-center gap-4'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>{cancellationRequests.length}</p>
                <p className='text-sm text-gray-600'>Total Cancellations</p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-2 border-blue-200'>
            <CardContent className='p-4 flex items-center gap-4'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <DollarSign className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>
                  $
                  {cancellationRequests
                    .reduce((sum, r) => sum + (r.calculated_refund || 0), 0)
                    .toFixed(2)}
                </p>
                <p className='text-sm text-gray-600'>Total Refunded</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Cancellations */}
        <div>
          <h2 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
            <List className='w-5 h-5' />
            All Cancellations
          </h2>
          {cancellationRequests.length > 0 ? (
            <div className='grid gap-4'>
              {cancellationRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className='p-8 text-center'>
                <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600'>No cancellations yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
