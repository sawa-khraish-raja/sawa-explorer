import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Users,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  UserPlus,
  MessageSquare,
  Zap,
  Eye, // Added Eye icon
  Mail, // Added Mail icon
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { UseAppContext } from '@/shared/context/AppContext';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils';
// Added Dialog components
import { createPageUrl } from '@/utils';
import { queryDocuments, getDocument } from '@/utils/firestore';

export default function OfficeDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  // NEW: State for selected host to monitor messages
  const [selectedHostMessages, setSelectedHostMessages] = useState(null);

  //  1. Load current user
  const { user, userLoading } = UseAppContext();

  // Redirect if not office user
  React.useEffect(() => {
    if (!userLoading && (!user || user.role_type !== 'office')) {
      navigate(createPageUrl('Home'));
    }
  }, [user, userLoading, navigate]);

  //  2. Load office data
  const { data: office } = useQuery({
    queryKey: ['userOffice', user?.office_id],
    queryFn: async () => {
      if (!user?.office_id) return null;
      return getDocument('agencies', user.office_id);
    },
    enabled: !!user?.office_id,
  });

  //  3. Load CURRENT hosts (only those currently assigned to this office)
  // Renamed from 'hosts' to 'currentHosts'
  const { data: currentHosts = [] } = useQuery({
    queryKey: ['officeCurrentHosts', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];

      //  Only hosts that are CURRENTLY assigned to this office
      return queryDocuments('users', [
        ['office_id', '==', office.id],
        ['host_approved', '==', true],
      ]);
    },
    enabled: !!office?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  //  4. Load ALL bookings (historical data)
  // Renamed from 'bookings' to 'allBookings'
  const { data: allBookings = [] } = useQuery({
    queryKey: ['officeAllBookings', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];

      const bookingsFromDb = await queryDocuments('bookings', [], {
        orderBy: { field: 'created_at', direction: 'desc' },
      });
      //  All bookings that were ever handled by this office (even if host left)
      return bookingsFromDb.filter((b) => {
        // Filtering based on office_id on booking or current host email.
        return (
          b.office_id === office.id ||
          (b.host_email && currentHosts.some((h) => h.email === b.host_email))
        );
      });
    },
    enabled: !!office?.id,
  });

  //  5. Load conversations for CURRENT hosts only
  const { data: hostConversations = [] } = useQuery({
    queryKey: ['officeHostConversations', currentHosts.map((h) => h.email).join(',')],
    queryFn: async () => {
      if (currentHosts.length === 0) return [];

      const allConvos = await queryDocuments('conversations', [], {
        orderBy: { field: 'last_message_timestamp', direction: 'desc' },
      });
      const currentHostEmails = currentHosts.map((h) => h.email);

      //  Only conversations with CURRENT hosts
      return allConvos.filter(
        (convo) =>
          Array.isArray(convo.host_emails) &&
          convo.host_emails.some((email) => currentHostEmails.includes(email))
      );
    },
    enabled: currentHosts.length > 0,
  });

  //  6. Load messages for host monitoring
  const { data: hostMessages = [] } = useQuery({
    queryKey: ['officeHostMessages', selectedHostMessages?.email],
    queryFn: async () => {
      if (!selectedHostMessages?.email) return [];

      const allMessages = await queryDocuments('messages', [], {
        orderBy: { field: 'created_date', direction: 'desc' },
        limit: 200,
      });
      const hostConvoIds = hostConversations
        .filter((c) => c.host_emails?.includes(selectedHostMessages.email))
        .map((c) => c.id);

      return allMessages.filter((m) => hostConvoIds.includes(m.conversation_id));
    },
    enabled: !!selectedHostMessages?.email,
  });

  if (userLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white'>
        <Loader2 className='w-12 h-12 animate-spin text-blue-600' />
      </div>
    );
  }

  if (!user) return null;

  //  Calculate stats from ALL historical bookings (using allBookings)
  const totalRevenue = allBookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);
  const officeCommission = totalRevenue * 0.07;

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-white'>
      <div className='max-w-7xl mx-auto p-6'>
        {/*  Header */}
        <Card className='mb-8 overflow-hidden shadow-xl border-0'>
          <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold mb-2'>Office Dashboard</h1>
                <p className='text-blue-100'>{office?.name || user.company_name || 'Office'}</p>
                {/* NEW: Display active host count */}
                <p className='text-sm text-blue-200 mt-1'>
                  {currentHosts.length} active host
                  {currentHosts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Building2 className='w-16 h-16 opacity-20' />
            </div>
          </div>
        </Card>

        {/*  Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-600 flex items-center gap-2'>
                <Users className='w-4 h-4 text-blue-600' />
                Active Hosts {/* Changed from Total Hosts */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-gray-900'>{currentHosts.length}</p>{' '}
              {/* Changed from hosts.length */}
              <p className='text-xs text-gray-500 mt-1'>Currently assigned</p>{' '}
              {/* Added description */}
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-600 flex items-center gap-2'>
                <Calendar className='w-4 h-4 text-green-600' />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-gray-900'>{allBookings.length}</p>{' '}
              {/* Changed from bookings.length */}
              <p className='text-xs text-gray-500 mt-1'>All time</p> {/* Added description */}
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-600 flex items-center gap-2'>
                <DollarSign className='w-4 h-4 text-purple-600' />
                Commission (7%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-gray-900'>${officeCommission.toFixed(2)}</p>
              <p className='text-xs text-gray-500 mt-1'>Total earned</p> {/* Added description */}
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-600 flex items-center gap-2'>
                <TrendingUp className='w-4 h-4 text-orange-600' />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-gray-900'>${totalRevenue.toFixed(2)}</p>
              <p className='text-xs text-gray-500 mt-1'>All bookings</p> {/* Added description */}
            </CardContent>
          </Card>
        </div>

        {/*  Tabs - Added Adventures and Messages */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='bg-white shadow-md p-1 mb-6'>
            <TabsTrigger
              value='overview'
              className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
            >
              Overview
            </TabsTrigger>
            {/* Changed from Hosts to Active Hosts */}
            <TabsTrigger
              value='hosts'
              className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
            >
              Active Hosts ({currentHosts.length})
            </TabsTrigger>
            {/* Changed from Bookings to Bookings (all time) */}
            <TabsTrigger
              value='bookings'
              className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
            >
              Bookings ({allBookings.length})
            </TabsTrigger>
            {/* NEW: Messages Tab Trigger */}
            <TabsTrigger
              value='messages'
              className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
            >
              Messages
            </TabsTrigger>
            <TabsTrigger
              value='adventures'
              className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'
            >
              <Zap className='w-4 h-4 mr-2' />
              Adventures
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value='overview' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Office Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm text-gray-500'>Office Name</p>
                  <p className='font-semibold text-lg'>{office?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>City</p>
                  <p className='font-semibold'>{office?.city || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Email</p>
                  <p className='font-semibold'>{office?.email || user.email}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Phone</p>
                  <p className='font-semibold'>{office?.phone || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Link to={createPageUrl('OfficeAddHost')}>
                    <Button className='w-full bg-blue-600 hover:bg-blue-700'>
                      <UserPlus className='w-4 h-4 mr-2' />
                      Add New Host
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/*  Active Hosts Tab - Only CURRENT hosts */}
          {/* Changed from 'hosts' to 'currentHosts' */}
          <TabsContent value='hosts' className='space-y-4'>
            {currentHosts.length === 0 ? (
              <Card>
                <CardContent className='text-center py-12'>
                  <Users className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <p className='text-lg font-semibold text-gray-700'>No active hosts</p>{' '}
                  {/* Updated text */}
                  <p className='text-gray-500 mt-2 mb-4'>
                    Add hosts to your office to start managing bookings
                  </p>
                  <Link to={createPageUrl('OfficeAddHost')}>
                    <Button className='bg-blue-600 hover:bg-blue-700'>
                      <UserPlus className='w-4 h-4 mr-2' />
                      Add First Host
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              currentHosts.map((host) => (
                <Card key={host.id} className='hover:shadow-lg transition-shadow'>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4 flex-1'>
                        <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center'>
                          {host.profile_photo ? (
                            <img
                              src={host.profile_photo}
                              alt=''
                              className='w-full h-full rounded-full object-cover'
                            />
                          ) : (
                            <Users className='w-6 h-6 text-blue-600' />
                          )}
                        </div>
                        <div className='flex-1'>
                          <p className='font-bold text-lg'>{host.full_name || host.email}</p>
                          <p className='text-sm text-gray-500'>{host.email}</p>{' '}
                          {/* Added host email */}
                          <p className='text-sm text-gray-500'>{host.city}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge className='bg-green-100 text-green-800'>Active</Badge>
                        {/* NEW: Monitor Messages Button */}
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setSelectedHostMessages(host)}
                          className='flex items-center gap-2'
                        >
                          <Eye className='w-4 h-4' />
                          Monitor Messages
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/*  Bookings Tab - Historical data */}
          {/* Changed from 'bookings' to 'allBookings' */}
          <TabsContent value='bookings' className='space-y-4'>
            {allBookings.length === 0 ? (
              <Card>
                <CardContent className='text-center py-12'>
                  <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <p className='text-lg font-semibold text-gray-700'>No bookings yet</p>
                  <p className='text-gray-500 mt-2'>Bookings from your hosts will appear here</p>
                </CardContent>
              </Card>
            ) : (
              allBookings.map((booking) => {
                // Determine if the host of this booking is still active in the office
                const hostStillInOffice = currentHosts.some((h) => h.email === booking.host_email);

                return (
                  <Card key={booking.id} className='hover:shadow-lg transition-shadow'>
                    <CardContent className='p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='flex items-center gap-2 mb-2'>
                            <p className='font-bold text-lg'>{booking.city}</p>
                            {/* NEW: Badge for former hosts */}
                            {!hostStillInOffice && (
                              <Badge variant='outline' className='text-xs text-gray-500'>
                                Former Host
                              </Badge>
                            )}
                          </div>
                          <p className='text-sm text-gray-500'>Host: {booking.host_email}</p>
                          <p className='text-sm text-gray-500'>
                            {new Date(booking.start_date).toLocaleDateString()} -{' '}
                            {new Date(booking.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <Badge
                            className={cn(
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {booking.status}
                          </Badge>
                          {booking.total_price && (
                            <p className='font-bold text-green-600 mt-2'>
                              ${booking.total_price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/*  NEW: Messages Tab - Current hosts only */}
          <TabsContent value='messages' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Host Messages Monitoring</CardTitle>
                <p className='text-sm text-gray-500 mt-1'>
                  View conversations of your current hosts
                </p>
              </CardHeader>
              <CardContent>
                {hostConversations.length === 0 ? (
                  <div className='text-center py-8'>
                    <MessageSquare className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                    <p className='text-gray-600'>No conversations yet</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {hostConversations.map((convo) => {
                      // Find the host details based on the email in the conversation
                      const hostEmail = convo.host_emails?.[0]; // Assuming one host per convo for display
                      const host = currentHosts.find((h) => h.email === hostEmail);

                      return (
                        <div
                          key={convo.id}
                          className='p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <div>
                              <p className='font-semibold text-sm'>
                                Host: {host?.full_name || hostEmail}
                              </p>
                              <p className='text-xs text-gray-500'>
                                Traveler: {convo.traveler_email}
                              </p>
                            </div>
                            <Badge variant='outline' className='text-xs'>
                              {convo.conversation_type || 'service'}
                            </Badge>
                          </div>
                          {convo.last_message_preview && (
                            <p className='text-sm text-gray-600 line-clamp-1'>
                              {convo.last_message_preview}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adventures Tab */}
          <TabsContent value='adventures' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='w-5 h-5 text-blue-600' />
                  Office Adventures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600 mb-4'>
                  Create and manage group adventures offered by your office
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('OfficeAdventures'))}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  <Zap className='w-4 h-4 mr-2' />
                  Manage Adventures
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/*  NEW: Host Messages Dialog */}
      <Dialog open={!!selectedHostMessages} onOpenChange={() => setSelectedHostMessages(null)}>
        <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Mail className='w-5 h-5 text-blue-600' />
              Messages: {selectedHostMessages?.full_name || selectedHostMessages?.email}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 p-2'>
            {' '}
            {/* Added some padding */}
            {hostMessages.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>No messages yet</div>
            ) : (
              hostMessages.map((msg) => (
                <div key={msg.id} className='p-4 bg-gray-50 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-semibold text-gray-700'>
                      {/* Check if sender email matches the selected host's email */}
                      {msg.sender_email === selectedHostMessages.email ? 'Host' : 'Traveler'}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {new Date(msg.created_date).toLocaleString()}
                    </p>
                  </div>
                  <p className='text-sm text-gray-900'>{msg.original_text}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
