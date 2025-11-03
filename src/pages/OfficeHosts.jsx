import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments } from '@/utils/firestore';
import { useAppContext } from '@/components/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Search, Plus, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function OfficeHosts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAppContext();

  const { data: office } = useQuery({
    queryKey: ['userOffice', user?.email],
    queryFn: async () => {
      const allOffices = await getAllDocuments('agencies');
      return allOffices.find(
        (o) => o.email?.toLowerCase().trim() === user.email.toLowerCase().trim()
      );
    },
    enabled: !!user?.email,
  });

  const { data: officeHosts = [], isLoading } = useQuery({
    queryKey: ['officeHosts', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];
      return await queryDocuments('users', [
        ['office_id', '==', office.id],
        ['host_approved', '==', true],
      ]);
    },
    enabled: !!office?.id,
  });

  const filteredHosts = officeHosts.filter(
    (host) =>
      host.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      host.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              onClick={() => navigate(createPageUrl('OfficeDashboard'))}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Back
            </Button>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Manage Hosts</h1>
              <p className='text-gray-500'>View and manage hosts associated with {office?.name}</p>
            </div>
          </div>
          <Button onClick={() => navigate(createPageUrl('OfficeAddHost'))}>
            <UserPlus className='w-4 h-4 mr-2' />
            Add New Host
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Hosts ({filteredHosts.length})</CardTitle>
            <div className='mt-4 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Search by name or email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed Bookings</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center h-24'>
                      No hosts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHosts.map((host) => (
                    <TableRow key={host.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600'>
                            {host.profile_photo ? (
                              <img
                                src={host.profile_photo}
                                alt={host.full_name}
                                className='w-full h-full object-cover rounded-full'
                              />
                            ) : (
                              host.full_name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className='font-medium'>{host.full_name}</div>
                            <div className='text-sm text-gray-500'>{host.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{host.city}</TableCell>
                      <TableCell>
                        <Badge variant={host.host_approved ? 'default' : 'destructive'}>
                          {host.host_approved ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{host.completed_bookings || 0}</TableCell>
                      <TableCell>{host.rating?.toFixed(1) || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
