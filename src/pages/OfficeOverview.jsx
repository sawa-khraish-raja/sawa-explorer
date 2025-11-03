import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, DollarSign, Star, TrendingUp, Loader2 } from 'lucide-react';

export default function OfficeOverview({ office }) {
  const { data: officeHosts = [], isLoading: hostsLoading } = useQuery({
    queryKey: ['officeHosts', office.id],
    queryFn: async () => {
      if (!office.id) return [];
      return await queryDocuments('users', ['office_id', '==', office.id],
            ['host_approved', '==', true ]);
    },
    enabled: !!office?.id,
  });

  const { data: officeStats, isLoading: statsLoading } = useQuery({
    queryKey: ['officeOverview', office.id],
    queryFn: async () => {
      if (!office.id) return { totalBookings: 0, totalRevenue: 0, avgRating: 0 };
      const hosts = await queryDocuments('users', ['office_id', '==', office.id],
            ['host_approved', '==', true]);

      if (!hosts || hosts.length === 0) {
        return { totalBookings: 0, totalRevenue: 0, avgRating: 0 };
      }

      const totalBookings = hosts.reduce((acc, host) => acc + (host.completed_bookings || 0), 0);

      // Let's assume office.total_revenue is kept up to date by the booking confirmation logic
      const totalRevenue = office.total_revenue || 0;

      const ratings = hosts.map((h) => h.rating).filter((r) => r > 0);
      const avgRating =
        ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return { totalBookings, totalRevenue, avgRating };
    },
    enabled: !!office?.id,
  });

  if (hostsLoading || statsLoading) {
    return (
      <div className='flex justify-center items-center p-12'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Hosts</CardTitle>
          <Users className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{officeHosts.length}</div>
          <p className='text-xs text-muted-foreground'>hosts managed by your office</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Bookings</CardTitle>
          <TrendingUp className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{officeStats?.totalBookings || 0}</div>
          <p className='text-xs text-muted-foreground'>confirmed bookings via your hosts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Office Revenue</CardTitle>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>${(officeStats?.totalRevenue || 0).toFixed(2)}</div>
          <p className='text-xs text-muted-foreground'>from commission on bookings</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Average Host Rating</CardTitle>
          <Star className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{(officeStats?.avgRating || 0).toFixed(1)}</div>
          <p className='text-xs text-muted-foreground'>across all your hosts</p>
        </CardContent>
      </Card>
    </div>
  );
}
