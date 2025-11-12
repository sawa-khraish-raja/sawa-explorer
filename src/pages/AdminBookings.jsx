import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, MapPin, Loader2, Eye, Briefcase, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { getAllDocuments } from '@/utils/firestore';

import AdminLayout from '@/features/admin/components/AdminLayout';
import PermissionGuard from '@/features/admin/components/PermissionGuard';
import { BookingID } from '@/shared/components/BookingID';

export default function AdminBookings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('services');

  const { data: bookings = [], isLoading } = useQuery({
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
  });

  //  Separate service and adventure bookings
  const serviceBookings = bookings.filter((b) => !b.adventure_id);
  const adventureBookings = bookings.filter((b) => b.adventure_id);

  const filteredServiceBookings = serviceBookings.filter(
    (booking) =>
      booking.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.traveler_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdventureBookings = adventureBookings.filter(
    (booking) =>
      booking.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.traveler_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      accepted: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <PermissionGuard pageId='bookings'>
        <AdminLayout>
          <div className='flex justify-center items-center h-96'>
            <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
          </div>
        </AdminLayout>
      </PermissionGuard>
    );
  }

  const pendingServices = serviceBookings.filter((b) => b.status === 'pending').length;
  const confirmedServices = serviceBookings.filter((b) => b.status === 'confirmed').length;
  const totalRevenueServices = serviceBookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const confirmedAdventures = adventureBookings.filter((b) => b.status === 'confirmed').length;
  const totalRevenueAdventures = adventureBookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <PermissionGuard pageId='bookings'>
      <AdminLayout>
        <div className='space-y-4 sm:space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Bookings Management</h1>
            <p className='text-gray-500 mt-1'>{bookings.length} total bookings</p>
          </div>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
          <Input
            placeholder='Search bookings by city or traveler...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        {/*  Tabs for Services vs Adventures */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='bg-white shadow-md'>
            <TabsTrigger value='services' className='flex items-center gap-2'>
              <Briefcase className='w-4 h-4' />
              Service Bookings ({serviceBookings.length})
            </TabsTrigger>
            <TabsTrigger value='adventures' className='flex items-center gap-2'>
              <Sparkles className='w-4 h-4' />
              Adventure Bookings ({adventureBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Service Bookings Tab */}
          <TabsContent value='services' className='space-y-4'>
            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Total Services</p>
                  <p className='text-2xl font-bold text-gray-900'>{serviceBookings.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Pending</p>
                  <p className='text-2xl font-bold text-blue-600'>{pendingServices}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Confirmed</p>
                  <p className='text-2xl font-bold text-green-600'>{confirmedServices}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Revenue</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    ${totalRevenueServices.toFixed(0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Service Bookings Table */}
            <Card>
              <CardContent className='p-0'>
                {/* Desktop Table */}
                <div className='hidden md:block overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-gray-50 border-b'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Booking ID
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Details
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Dates
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Status
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Price
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {filteredServiceBookings.map((booking) => (
                        <tr key={booking.id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4'>
                            <BookingID booking={booking} size='small' />
                          </td>
                          <td className='px-6 py-4'>
                            <div>
                              <div className='flex items-center gap-2 mb-1'>
                                <MapPin className='w-4 h-4 text-gray-400' />
                                <p className='font-semibold text-gray-900'>{booking.city}</p>
                              </div>
                              <p className='text-sm text-gray-500'>{booking.traveler_email}</p>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-600'>
                            {format(new Date(booking.start_date), 'MMM d')} -{' '}
                            {format(new Date(booking.end_date), 'MMM d, yyyy')}
                          </td>
                          <td className='px-6 py-4'>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className='px-6 py-4 text-sm font-semibold text-gray-900'>
                            {booking.total_price ? `$${booking.total_price}` : '-'}
                          </td>
                          <td className='px-6 py-4'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className='w-4 h-4' />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className='md:hidden divide-y'>
                  {filteredServiceBookings.map((booking) => (
                    <div key={booking.id} className='p-4 space-y-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <BookingID booking={booking} size='small' />
                          <div className='flex items-center gap-2 mt-2'>
                            <MapPin className='w-4 h-4 text-gray-400 flex-shrink-0' />
                            <p className='font-semibold text-gray-900'>{booking.city}</p>
                          </div>
                          <p className='text-sm text-gray-500 mt-1 truncate'>
                            {booking.traveler_email}
                          </p>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        {booking.total_price && (
                          <Badge variant='outline' className='font-semibold text-green-600'>
                            ${booking.total_price}
                          </Badge>
                        )}
                      </div>

                      <div className='text-xs text-gray-500'>
                        {format(new Date(booking.start_date), 'MMM d')} -{' '}
                        {format(new Date(booking.end_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adventure Bookings Tab */}
          <TabsContent value='adventures' className='space-y-4'>
            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Total Adventures</p>
                  <p className='text-2xl font-bold text-gray-900'>{adventureBookings.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Confirmed</p>
                  <p className='text-2xl font-bold text-green-600'>{confirmedAdventures}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Revenue</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    ${totalRevenueAdventures.toFixed(0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Adventure Bookings Table */}
            <Card>
              <CardContent className='p-0'>
                <div className='hidden md:block overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-purple-50 border-b border-purple-200'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Booking ID
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Adventure
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Traveler
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Date
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Guests
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Price
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {filteredAdventureBookings.map((booking) => (
                        <tr key={booking.id} className='hover:bg-purple-50'>
                          <td className='px-6 py-4'>
                            <BookingID booking={booking} size='small' />
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-2'>
                              <Sparkles className='w-4 h-4 text-purple-600' />
                              <p className='font-semibold text-gray-900'>{booking.city}</p>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-600'>
                            {booking.traveler_email}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-600'>
                            {format(new Date(booking.start_date), 'MMM d, yyyy')}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-600'>
                            {booking.number_of_adults || 1}
                          </td>
                          <td className='px-6 py-4 text-sm font-semibold text-gray-900'>
                            {booking.total_price ? `$${booking.total_price}` : '-'}
                          </td>
                          <td className='px-6 py-4'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className='w-4 h-4' />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className='md:hidden divide-y'>
                  {filteredAdventureBookings.map((booking) => (
                    <div key={booking.id} className='p-4 space-y-3 bg-purple-50/30'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <BookingID booking={booking} size='small' />
                          <div className='flex items-center gap-2 mt-2'>
                            <Sparkles className='w-4 h-4 text-purple-600 flex-shrink-0' />
                            <p className='font-semibold text-gray-900'>{booking.city}</p>
                          </div>
                          <p className='text-sm text-gray-500 mt-1'>{booking.traveler_email}</p>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>

                      {booking.total_price && (
                        <Badge variant='outline' className='font-semibold text-green-600'>
                          ${booking.total_price}
                        </Badge>
                      )}

                      <div className='text-xs text-gray-500'>
                        {format(new Date(booking.start_date), 'MMM d, yyyy')} •{' '}
                        {booking.number_of_adults || 1} guest(s)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Booking Details Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-3'>
                {selectedBooking?.adventure_id ? (
                  <>
                    <Sparkles className='w-5 h-5 text-purple-600' />
                    Adventure Booking Details
                  </>
                ) : (
                  <>
                    <Briefcase className='w-5 h-5 text-blue-600' />
                    Service Booking Details
                  </>
                )}
                {selectedBooking && <BookingID booking={selectedBooking} showCopy />}
              </DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>City</p>
                    <p className='font-semibold'>{selectedBooking.city}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Status</p>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Traveler</p>
                    <p className='font-semibold'>{selectedBooking.traveler_email}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Host</p>
                    <p className='font-semibold'>{selectedBooking.host_email || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>
                      {selectedBooking.adventure_id ? 'Adventure Date' : 'Check-in'}
                    </p>
                    <p className='font-semibold'>
                      {format(new Date(selectedBooking.start_date), 'PPP')}
                    </p>
                  </div>
                  {!selectedBooking.adventure_id && (
                    <div>
                      <p className='text-sm text-gray-600'>Check-out</p>
                      <p className='font-semibold'>
                        {format(new Date(selectedBooking.end_date), 'PPP')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className='text-sm text-gray-600'>Guests</p>
                    <p className='font-semibold'>
                      {selectedBooking.number_of_adults} adults
                      {selectedBooking.number_of_children
                        ? `, ${selectedBooking.number_of_children} children`
                        : ''}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Total Price</p>
                    <p className='font-semibold text-lg text-green-600'>
                      ${selectedBooking.total_price || 0}
                    </p>
                  </div>
                </div>
                {selectedBooking.selected_services &&
                  selectedBooking.selected_services.length > 0 && (
                    <div>
                      <p className='text-sm text-gray-600 mb-2'>Selected Services</p>
                      <div className='flex flex-wrap gap-2'>
                        {selectedBooking.selected_services.map((service, idx) => (
                          <Badge key={idx} variant='outline'>
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedBooking.notes && (
                  <div>
                    <p className='text-sm text-gray-600 mb-2'>Notes</p>
                    <p className='text-sm bg-gray-50 p-3 rounded-lg'>{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
    </PermissionGuard>
  );
}
