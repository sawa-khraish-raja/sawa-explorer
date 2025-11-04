import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DollarSign, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '@/components/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { getAllDocuments, queryDocuments } from '@/utils/firestore';

export default function OfficeOffers() {
  const navigate = useNavigate();
  const { user } = useAppContext();

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

  const { data: officeBookings = [] } = useQuery({
    queryKey: ['officeBookings', hosts.map((h) => h.email).join(',')],
    queryFn: async () => {
      if (!hosts.length) return [];
      const officeHostEmails = hosts.map((h) => h.email);
      const allBookings = await queryDocuments('bookings', [], {
        orderBy: { field: 'created_date', direction: 'desc' },
      });
      return allBookings.filter((booking) => officeHostEmails.includes(booking.host_email));
    },
    enabled: hosts.length > 0,
  });

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['officeOffers', hosts.map((h) => h.email).join(',')],
    queryFn: async () => {
      if (!hosts.length) return [];
      const hostEmails = hosts.map((h) => h.email);
      const allOffers = await queryDocuments('offers', [], {
        orderBy: { field: 'created_date', direction: 'desc' },
      });
      return allOffers.filter((o) => hostEmails.includes(o.host_email));
    },
    enabled: hosts.length > 0,
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
          <h1 className='text-3xl font-bold text-gray-900'>All Offers ({offers.length})</h1>
        </div>

        {offers.length === 0 ? (
          <Card className='text-center py-16'>
            <CardContent>
              <DollarSign className='w-16 h-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>No Offers Yet</h3>
              <p className='text-gray-600'>Offers will appear here once hosts start sending them</p>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {offers.map((offer) => {
              const host = hosts.find((h) => h.email === offer.host_email);
              const booking = officeBookings.find((b) => b.id === offer.booking_id);

              return (
                <Card
                  key={offer.id}
                  className='border-l-4 border-l-green-500 hover:shadow-lg transition-shadow'
                >
                  <CardContent className='p-6'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-3'>
                          <DollarSign className='w-6 h-6 text-green-600' />
                          <h3 className='font-bold text-gray-900 text-2xl'>
                            ${offer.price?.toFixed(2) || offer.total_price?.toFixed(2) || '0.00'}
                          </h3>
                          <Badge
                            className={
                              offer.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : offer.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : offer.status === 'declined'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {offer.status}
                          </Badge>
                        </div>
                        <div className='space-y-2 text-sm text-gray-600'>
                          {host && (
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>Host:</span>
                              <span>{host.full_name}</span>
                            </div>
                          )}
                          {booking && (
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>City:</span>
                              <span>{booking.city}</span>
                            </div>
                          )}
                          {offer.inclusions && (
                            <div className='flex items-start gap-2'>
                              <span className='font-medium'>Includes:</span>
                              <span className='flex-1'>{offer.inclusions}</span>
                            </div>
                          )}
                          <div className='flex items-center gap-2'>
                            <Calendar className='w-4 h-4' />
                            <span className='text-xs text-gray-500'>
                              Created: {format(new Date(offer.created_date), 'MMM d, yyyy')}
                            </span>
                          </div>
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
