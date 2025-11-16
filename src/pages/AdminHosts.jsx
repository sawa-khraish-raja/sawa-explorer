import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Search,
  UserCheck,
  UserX,
  Building2,
  Briefcase,
  DollarSign,
  Star,
  Settings,
  Eye,
  Loader2,
  MapPin,
  Users, // Added Users
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { getAllDocuments, updateDocument } from '@/utils/firestore';

import AdminLayout from '@/features/admin/components/AdminLayout';
import AssignAgencyDialog from '@/features/admin/components/AssignAgencyDialog';
import EditHostDialog from '@/features/admin/components/EditHostDialog';
import HostCommissionDialog from '@/features/admin/components/HostCommissionDialog';
import ManageCityAccessDialog from '@/features/admin/components/ManageCityAccessDialog';
import { showNotification } from '@/features/shared/notifications/NotificationManager';

export default function AdminHosts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHost, setSelectedHost] = useState(null);
  const [, setIsEditDialogOpen] = useState(false);
  const [isAgencyDialogOpen, setIsAgencyDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [isCityAccessDialogOpen, setIsCityAccessDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ['allHosts'],
    queryFn: async () => {
      const allUsers = await getAllDocuments('users');
      return allUsers.filter((u) => u.host_approved);
    },
    refetchInterval: 5000,
  });

  // TODO: Agencies not yet migrated to Firestore
  const { data: agencies = [] } = useQuery({
    queryKey: ['allAgencies'],
    queryFn: async () => {
      // Return empty array until agencies are migrated
      console.log(' Agencies query skipped - not yet migrated to Firestore');
      return [];
    },
  });

  const toggleHostMutation = useMutation({
    mutationFn: async ({ hostId, newStatus }) => {
      await updateDocument('users', hostId, {
        host_approved: newStatus,
        updated_date: new Date().toISOString(),
      });

      // TODO: Audit log removed - not yet migrated to Firestore
      // await base44.entities.AuditLog.create({
      //   admin_email: currentUser.email,
      //   action: newStatus ? 'approve_host' : 'revoke_host',
      //   affected_user_email: hosts.find((h) => h.id === hostId)?.email,
      //   details: JSON.stringify({ newStatus, reason: 'Admin action' }),
      // });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHosts'] });
      showNotification({
        title: ' Host Status Updated',
        message: 'Host status has been updated successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error updating host status:', error);
      showNotification({
        title: ' Error',
        message: 'Failed to update host status',
        type: 'error',
      });
    },
  });

  // دالة مساعدة لإصلاح المضيفين القدامى
  const fixLegacyHost = useMutation({
    mutationFn: async (host) => {
      console.log(`Fixing legacy host: ${host.email}`);

      // إذا عنده city بس ما عنده assigned_cities
      if (host.city && (!host.assigned_cities || host.assigned_cities.length === 0)) {
        await updateDocument('users', host.id, {
          assigned_cities: [host.city],
          visible_in_city: true,
          updated_date: new Date().toISOString(),
        });

        console.log(` Fixed ${host.email}: assigned to ${host.city}`);
        return { email: host.email, city: host.city };
      }

      throw new Error(`Host ${host.email} does not require fixing or has no city information`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allHosts'] });
      showNotification({
        title: ' Host Fixed',
        message: `Host ${data.email} assigned to ${data.city}`,
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error fixing legacy host:', error);
      showNotification({
        title: ' Fix Failed',
        message: error.message || 'Failed to fix legacy host',
        type: 'error',
      });
    },
  });

  const updateHostMutation = useMutation({
    mutationFn: async ({ hostId, updates }) => {
      await updateDocument('users', hostId, {
        ...updates,
        updated_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHosts'] });
      setIsEditDialogOpen(false);
      setSelectedHost(null);
      showNotification({
        title: 'Host Updated',
        message: 'Host information has been updated successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error updating host:', error);
      showNotification({
        title: 'Update Failed',
        message: error.message || 'Failed to update host',
        type: 'error',
      });
    },
  });

  const filteredHosts = hosts.filter((host) => {
    const matchesSearch =
      host.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      host.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      host.city?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'agency') return matchesSearch && host.host_type === 'agency';
    if (filterType === 'freelancer') return matchesSearch && host.host_type === 'freelancer';
    return matchesSearch;
  });

  const stats = {
    total: hosts.length,
    agency: hosts.filter((h) => h.host_type === 'agency').length,
    freelancer: hosts.filter((h) => h.host_type === 'freelancer').length,
    active: hosts.filter((h) => h.host_approved).length,
  };

  const getAgencyName = (agencyId) => {
    if (!agencyId) return null;
    const agency = agencies.find((a) => a.id === agencyId);
    return agency?.name;
  };

  const getCommissionDisplay = (host) => {
    if (host.commission_overrides) {
      return {
        sawa: host.commission_overrides.sawa,
        office: host.commission_overrides.office || 0,
        isCustom: true,
      };
    }

    if (host.host_type === 'agency') {
      const agency = agencies.find((a) => a.id === host.agency_id);
      return {
        sawa: agency?.commission_sawa_default || 28,
        office: agency?.commission_office_default || 7,
        isCustom: false,
      };
    }

    return {
      sawa: 35,
      office: 0,
      isCustom: false,
    };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className='flex justify-center items-center h-96'>
          <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <Card className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl'>
          <CardHeader>
            <CardTitle className='text-3xl flex items-center gap-3'>
              <Building2 className='w-8 h-8' />
              Manage Hosts ({stats.total})
            </CardTitle>
            <p className='text-white/90 mt-2'>
              Control host types, agency assignments, and commission overrides
            </p>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card
            className={`cursor-pointer transition-all ${
              filterType === 'all' ? 'ring-2 ring-purple-500' : ''
            }`}
            onClick={() => setFilterType('all')}
          >
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Total Hosts</p>
                  <p className='text-3xl font-bold text-gray-900'>{stats.total}</p>
                </div>
                <UserCheck className='w-10 h-10 text-purple-600' />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              filterType === 'agency' ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setFilterType('agency')}
          >
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Agency Hosts</p>
                  <p className='text-3xl font-bold text-indigo-600'>{stats.agency}</p>
                </div>
                <Building2 className='w-10 h-10 text-indigo-600' />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              filterType === 'freelancer' ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setFilterType('freelancer')}
          >
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Freelancers</p>
                  <p className='text-3xl font-bold text-green-600'>{stats.freelancer}</p>
                </div>
                <Briefcase className='w-10 h-10 text-green-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Active</p>
                  <p className='text-3xl font-bold text-emerald-600'>{stats.active}</p>
                </div>
                <UserCheck className='w-10 h-10 text-emerald-600' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className='p-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                placeholder='Search by name, email, or city...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </CardContent>
        </Card>

        {/* All Hosts Header with Fix Legacy button */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Users className='w-5 h-5' />
                All Hosts ({filteredHosts.length})
              </CardTitle>
              <Button
                onClick={() => {
                  // إصلاح جميع المضيفين القدامى
                  hosts.forEach((host) => {
                    if (host.city && (!host.assigned_cities || host.assigned_cities.length === 0)) {
                      fixLegacyHost.mutate(host);
                    }
                  });
                }}
                variant='outline'
                size='sm'
                className='flex items-center gap-1'
                disabled={fixLegacyHost.isLoading} // Disable button while mutation is in progress
              >
                {fixLegacyHost.isLoading && <Loader2 className='mr-1 h-4 w-4 animate-spin' />}
                🔧 Fix Legacy Hosts
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Hosts List */}
        <div className='grid grid-cols-1 gap-4'>
          {filteredHosts.map((host) => {
            const commission = getCommissionDisplay(host);
            const agencyName = getAgencyName(host.agency_id);
            const assignedCities = host.assigned_cities || []; // Get assigned cities

            return (
              <Card key={host.id} className='hover:shadow-lg transition-shadow'>
                <CardContent className='p-6'>
                  <div className='flex flex-col lg:flex-row gap-4 justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-start gap-3 mb-3'>
                        <div className='w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0'>
                          {host.profile_photo ? (
                            <img
                              src={host.profile_photo}
                              alt={host.full_name}
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <span className='text-white font-bold text-lg'>
                              {(host.full_name || host.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap mb-2'>
                            <h3 className='text-lg font-bold text-gray-900'>
                              {host.full_name || host.email}
                            </h3>
                            <Badge
                              className={
                                host.host_type === 'agency'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-green-100 text-green-800'
                              }
                            >
                              {host.host_type === 'agency' ? '🏢 Agency' : 'Freelancer'}
                            </Badge>
                            {commission.isCustom && (
                              <Badge className='bg-amber-100 text-amber-800'>Custom Rates</Badge>
                            )}
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600'>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>Email:</span>
                              <span className='truncate'>{host.email}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>City:</span>
                              <span>{host.city || 'Not set'}</span>
                            </div>
                            {agencyName && (
                              <div className='flex items-center gap-2'>
                                <Building2 className='w-4 h-4' />
                                <span className='font-medium'>Agency:</span>
                                <span>{agencyName}</span>
                              </div>
                            )}
                            <div className='flex items-center gap-2'>
                              <Star className='w-4 h-4 text-amber-500' />
                              <span>
                                {host.rating?.toFixed(1) || '5.0'} ({host.completed_bookings || 0}{' '}
                                bookings)
                              </span>
                            </div>
                          </div>

                          {/* Commission Info */}
                          <div className='mt-3 flex flex-wrap gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              <DollarSign className='w-3 h-3 mr-1' />
                              SAWA: {commission.sawa}%
                            </Badge>
                            {commission.office > 0 && (
                              <Badge variant='outline' className='text-xs'>
                                <DollarSign className='w-3 h-3 mr-1' />
                                Office: {commission.office}%
                              </Badge>
                            )}
                          </div>

                          {/* Display Assigned Cities */}
                          {assignedCities.length > 0 && (
                            <div className='mt-3'>
                              <p className='text-xs text-gray-500 mb-1'>Assigned Cities:</p>
                              <div className='flex flex-wrap gap-2'>
                                {assignedCities.map((city) => (
                                  <Badge key={city} variant='outline' className='text-xs'>
                                    <MapPin className='w-3 h-3 mr-1' />
                                    {city}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {host.created_date && (
                            <p className='text-xs text-gray-400 mt-2'>
                              Joined: {format(new Date(host.created_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-col gap-2 lg:w-48'>
                      {/* Manage Cities button */}
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedHost(host);
                          setIsCityAccessDialogOpen(true);
                        }}
                        className='w-full'
                      >
                        <MapPin className='w-4 h-4 mr-2' />
                        Manage Cities
                      </Button>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedHost(host);
                          setIsAgencyDialogOpen(true);
                        }}
                        className='w-full'
                      >
                        <Building2 className='w-4 h-4 mr-2' />
                        {host.host_type === 'agency' ? 'Change Agency' : 'Assign Agency'}
                      </Button>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedHost(host);
                          setIsCommissionDialogOpen(true);
                        }}
                        className='w-full'
                      >
                        <Settings className='w-4 h-4 mr-2' />
                        Commission
                      </Button>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedHost(host);
                          setIsEditDialogOpen(true);
                        }}
                        className='w-full'
                      >
                        <Eye className='w-4 h-4 mr-2' />
                        Edit Details
                      </Button>

                      <Button
                        variant={host.host_approved ? 'destructive' : 'default'}
                        size='sm'
                        onClick={() =>
                          toggleHostMutation.mutate({
                            hostId: host.id,
                            newStatus: !host.host_approved,
                          })
                        }
                        className='w-full'
                      >
                        {host.host_approved ? (
                          <>
                            <UserX className='w-4 h-4 mr-2' />
                            Revoke
                          </>
                        ) : (
                          <>
                            <UserCheck className='w-4 h-4 mr-2' />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredHosts.length === 0 && (
            <Card>
              <CardContent className='py-12 text-center'>
                <UserCheck className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>No hosts found</h3>
                <p className='text-gray-600'>
                  {searchTerm || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No hosts available yet'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedHost && (
        <>
          <EditHostDialog
            host={selectedHost}
            onOpenChange={(open) => {
              if (!open) {
                setIsEditDialogOpen(false);
                setSelectedHost(null);
              }
            }}
            onSave={(formData) => {
              updateHostMutation.mutate({
                hostId: selectedHost.id,
                updates: formData,
              });
            }}
            isSaving={updateHostMutation.isPending}
          />

          <AssignAgencyDialog
            host={selectedHost}
            isOpen={isAgencyDialogOpen}
            onClose={() => {
              setIsAgencyDialogOpen(false);
              setSelectedHost(null);
            }}
          />

          <HostCommissionDialog
            host={selectedHost}
            isOpen={isCommissionDialogOpen}
            onClose={() => {
              setIsCommissionDialogOpen(false);
              setSelectedHost(null);
            }}
          />

          {/* New ManageCityAccessDialog */}
          <ManageCityAccessDialog
            host={selectedHost}
            isOpen={isCityAccessDialogOpen}
            onClose={() => {
              setIsCityAccessDialogOpen(false);
              setSelectedHost(null);
            }}
          />
        </>
      )}
    </AdminLayout>
  );
}
