import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, Sparkles, Trash2, Clock, Calendar } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAllDocuments, queryDocuments } from '@/utils/firestore';
import { invokeFunction } from '@/utils/functions';

import AdminLayout from '../components/admin/AdminLayout';

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  //  Fetch events
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['all-events'],
    queryFn: async () => {
      const allEvents = await getAllDocuments('events', '-start_datetime');

      //  Filter: Only future events
      const now = new Date();
      const upcomingEvents = allEvents.filter((event) => {
        const eventDate = new Date(event.start_datetime);
        return eventDate >= now;
      });

      console.log(` Loaded ${upcomingEvents.length} upcoming events`);
      return upcomingEvents;
    },
  });

  //  Fetch last sync
  const { data: lastSync } = useQuery({
    queryKey: ['eventsLastSync'],
    queryFn: async () => {
      const meta = await queryDocuments('systemmetas', [['key', '==', 'events_last_sync',
      ]]);
      return meta[0]?.value || null;
    },
  });

  //  Sync events mutation with auto-refresh
  const handleSyncEvents = async (city = null) => {
    setSyncing(true);
    try {
      const response = await invokeFunction('syncCityEvents', {
        city,
        forceRefresh: true,
      });

      if (response.data.ok) {
        toast.success(
          ` Events synced! ${response.data.results
            .map((r) => `${r.city}: ${r.created}`)
            .join(', ')}`
        );

        //  Invalidate all event queries to refresh city pages
        queryClient.invalidateQueries({ queryKey: ['all-events'] });
        queryClient.invalidateQueries({ queryKey: ['cityEvents'] }); // Added this line
        queryClient.invalidateQueries({ queryKey: ['eventsLastSync'] });
      } else {
        throw new Error(response.data.error || 'Failed to sync');
      }
    } catch (error) {
      toast.error(` Sync failed: ${error.message}`);
    }
    setSyncing(false);
  };

  //  Cleanup mutation
  const handleCleanOldEvents = async () => {
    setCleaning(true);
    try {
      const response = await invokeFunction('cleanupExpiredEvents', {});

      if (response.data.ok) {
        toast.success(` Deleted ${response.data.deletedCount} expired events`);
        queryClient.invalidateQueries({ queryKey: ['all-events'] });
        queryClient.invalidateQueries({ queryKey: ['cityEvents'] }); // Also invalidate city events on cleanup
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      toast.error(` Cleanup failed: ${error.message}`);
    }
    setCleaning(false);
  };

  const safeFormatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return format(d, 'MMM d, yyyy');
  };

  return (
    <AdminLayout currentPage='events'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Events Management</h1>
            <p className='text-gray-600 mt-1'>AI-powered event discovery - auto-updates daily</p>
            {lastSync && (
              <div className='flex items-center gap-2 text-sm text-gray-500 mt-2'>
                <Clock className='w-4 h-4' />
                Last synced {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
              </div>
            )}
          </div>

          <div className='flex gap-3'>
            <Button
              onClick={handleCleanOldEvents}
              disabled={cleaning}
              variant='outline'
              className='border-2 border-red-500 text-red-600 hover:bg-red-50'
            >
              {cleaning ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Clean Expired
                </>
              )}
            </Button>

            <Button
              onClick={() => handleSyncEvents()}
              disabled={syncing}
              className='bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white'
            >
              {syncing ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Syncing...
                </>
              ) : (
                <>
                  <Sparkles className='w-4 h-4 mr-2' />
                  Sync with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events Only</CardTitle>
            <CardDescription>
              Past events are automatically filtered out. Use "Clean Expired" to remove them from
              database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className='flex justify-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin text-[#9933CC]' />
              </div>
            ) : events.length === 0 ? (
              <div className='text-center py-12'>
                <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Upcoming Events</h3>
                <p className='text-gray-500 mb-6'>Click "Sync with AI" to discover new events</p>
                <Button
                  onClick={() => handleSyncEvents()}
                  disabled={syncing}
                  className='bg-gradient-to-r from-[#330066] to-[#9933CC]'
                >
                  <Sparkles className='w-4 h-4 mr-2' />
                  Sync Now
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className='font-medium'>{event.title}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{event.city}</Badge>
                      </TableCell>
                      <TableCell>{safeFormatDate(event.start_datetime)}</TableCell>
                      <TableCell>{event.venue_name || 'N/A'}</TableCell>
                      <TableCell>
                        {event.is_featured && (
                          <Badge className='bg-purple-100 text-purple-800'>Featured</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className='bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] border-[#E6CCFF]'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 rounded-full bg-gradient-to-br from-[#9933CC] to-[#330066] flex items-center justify-center flex-shrink-0'>
                <Sparkles className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='font-bold text-gray-900 mb-2'>Automated Daily Sync</h3>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  Events are automatically synced every 24 hours using OpenAI. The system discovers
                  real upcoming events, creates them in the database, and removes expired ones to
                  keep your event listings fresh and relevant.
                </p>
                <div className='mt-3 p-3 bg-white/60 rounded-lg'>
                  <p className='text-xs text-gray-500'>
                    <strong>Pro tip:</strong> You can manually trigger sync anytime using the "Sync
                    with AI" button above.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
