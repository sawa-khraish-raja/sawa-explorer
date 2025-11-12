import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { UseAppContext } from '@/shared/context/AppContext';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { createPageUrl } from '@/utils';
import { getAllDocuments, queryDocuments } from '@/utils/firestore';

export default function OfficeBookings() {
  const navigate = useNavigate();
  const { user } = UseAppContext();

  const { data: office } = useQuery({
    queryKey: ['office', user?.email],
    queryFn: async () => {
      const allOffices = await getAllDocuments('agencies');
      return allOffices.find(
        (o) => o.email?.toLowerCase().trim() === user.email.toLowerCase().trim()
      );
    },
    enabled: !!user?.email,
  });

  const { data: hosts = [] } = useQuery({
    queryKey: ['officeHosts', office?.name],
    queryFn: async () => {
      const allRequests = await queryDocuments('host_requests', [], {
        orderBy: { field: 'created_date', direction: 'desc' },
      });
      const approvedRequests = allRequests.filter(
        (r) => r.office_name === office.name && r.status === 'approved'
      );
      return approvedRequests.map((req) => ({
        id: req.id,
        email: req.host_email,
        full_name: req.host_full_name,
      }));
    },
    enabled: !!office?.name,
  });

  const { data: officeBookings = [], isLoading } = useQuery({
    queryKey: ['officeBookings', office?.name, hosts.map((h) => h.email).join(',')],
    queryFn: async () => {
      if (!office?.name || !hosts.length) return [];
      const officeHostEmails = hosts.map((h) => h.email);
      const allBookings = await queryDocuments('bookings', [], {
        orderBy: { field: 'created_date', direction: 'desc' },
      });
      return allBookings.filter(
        (booking) =>
          officeHostEmails.includes(booking.host_email) ||
          (booking.city === office.city && booking.status === 'pending')
      );
    },
    enabled: !!office?.name && hosts.length > 0,
  });

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-6 flex items-center gap-4'>
          <Button
            variant='outline'
            onClick={() => navigate(createPageUrl('OfficeDashboard'))}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            Back
          </Button>
          <h1 className='text-3xl font-bold text-gray-900'>
            All Bookings ({officeBookings.length})
          </h1>
        </div>

        {officeBookings.length === 0 ? (
          <Card className='text-center py-16'>
            <CardContent>
              <Calendar className='w-16 h-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>No Bookings Yet</h3>
              <p className='text-gray-600'>
                Bookings will appear here once travelers make requests
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {officeBookings.map((booking) => {
              const host = hosts.find((h) => h.email === booking.host_email);
              return (
                <Card
                  key={booking.id}
                  className='border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow'
                >
                  <CardContent className='p-6'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-3'>
                          <MapPin className='w-5 h-5 text-gray-500' />
                          <h3 className='font-bold text-gray-900 text-xl'>{booking.city}</h3>
                          <Badge
                            className={
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                  ? 'bg-blue-100 text-blue-800'
                                  : booking.status === 'accepted'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <div className='space-y-2 text-sm text-gray-600'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>Traveler:</span>
                            <span>{booking.traveler_email}</span>
                          </div>
                          {host && (
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>Host:</span>
                              <span>{host.full_name}</span>
                            </div>
                          )}
                          <div className='flex items-center gap-2'>
                            <Calendar className='w-4 h-4' />
                            <span>
                              {format(new Date(booking.start_date), 'MMM d')} -{' '}
                              {format(new Date(booking.end_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {booking.total_price && (
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>Total:</span>
                              <span className='font-bold text-green-600'>
                                ${booking.total_price}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
