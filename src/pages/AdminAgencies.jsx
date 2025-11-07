import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Building2,
  Plus,
  Edit,
  Users,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAllDocuments, addDocument, updateDocument } from '@/utils/firestore';

import AdminLayout from '../components/admin/AdminLayout';
import { UseAppContext } from '../components/context/AppContext';
import { showNotification } from '../components/notifications/NotificationManager';

export default function AdminAgencies() {
  const queryClient = useQueryClient();
  const { user: currentUser } = UseAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [newAgency, setNewAgency] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Damascus',
    address: '',
    contact_phone: '',
  });

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ['allAgencies'],
    queryFn: async () => {
      const allAgencies = await getAllDocuments('agencies');
      return allAgencies.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    refetchInterval: 5000,
  });

  const { data: allHosts = [] } = useQuery({
    queryKey: ['allHosts'],
    queryFn: async () => {
      const users = await getAllDocuments('users');
      return users.filter((u) => u.host_approved);
    },
  });

  const createAgencyMutation = useMutation({
    mutationFn: async (agencyData) => {
      const agencyId = await addDocument('agencies', {
        ...agencyData,
        commission_sawa_default: 28,
        commission_office_default: 7,
        total_hosts: 0,
        total_bookings: 0,
        total_revenue: 0,
        is_active: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      // Audit log
      await addDocument('audit_logs', {
        admin_email: currentUser.email,
        action: 'agency_created',
        affected_user_email: agencyData.email,
        details: JSON.stringify({ agencyId, name: agencyData.name }),
        created_date: new Date().toISOString(),
      });

      return { id: agencyId, ...agencyData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAgencies'] });
      setIsCreateDialogOpen(false);
      setNewAgency({
        name: '',
        email: '',
        phone: '',
        city: 'Damascus',
        address: '',
        contact_phone: '',
      });
      showNotification({
        title: ' Agency Created',
        message: 'Agency has been created successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Create agency error:', error);
      showNotification({
        title: ' Error',
        message: 'Failed to create agency',
        type: 'error',
      });
    },
  });

  const updateAgencyMutation = useMutation({
    mutationFn: async ({ agencyId, updates }) => {
      await updateDocument('agencies', agencyId, {
        ...updates,
        updated_date: new Date().toISOString(),
      });

      // Audit log
      await addDocument('audit_logs', {
        admin_email: currentUser.email,
        action: 'agency_updated',
        affected_user_email: updates.email,
        details: JSON.stringify({ agencyId, updates }),
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAgencies'] });
      setEditingAgency(null);
      showNotification({
        title: ' Agency Updated',
        message: 'Agency has been updated successfully',
        type: 'success',
      });
    },
    onError: () => {
      showNotification({
        title: ' Error',
        message: 'Failed to update agency',
        type: 'error',
      });
    },
  });

  const toggleAgencyStatusMutation = useMutation({
    mutationFn: async ({ agencyId, newStatus }) => {
      await updateDocument('agencies', agencyId, {
        is_active: newStatus,
        updated_date: new Date().toISOString(),
      });

      // Audit log
      await addDocument('audit_logs', {
        admin_email: currentUser.email,
        action: newStatus ? 'agency_activated' : 'agency_suspended',
        affected_user_email: agencies.find((a) => a.id === agencyId)?.email,
        details: JSON.stringify({ agencyId, newStatus }),
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAgencies'] });
      showNotification({
        title: ' Status Updated',
        message: 'Agency status has been updated',
        type: 'success',
      });
    },
    onError: () => {
      showNotification({
        title: ' Error',
        message: 'Failed to update status',
        type: 'error',
      });
    },
  });

  const handleCreateAgency = () => {
    if (!newAgency.name || !newAgency.email || !newAgency.city) {
      showNotification({
        title: ' Validation Error',
        message: 'Please fill in all required fields',
        type: 'warning',
      });
      return;
    }
    createAgencyMutation.mutate(newAgency);
  };

  const handleUpdateAgency = () => {
    if (!editingAgency) return;
    updateAgencyMutation.mutate({
      agencyId: editingAgency.id,
      updates: editingAgency,
    });
  };

  const getAgencyHostsCount = (agencyId) => {
    return allHosts.filter((h) => h.agency_id === agencyId).length;
  };

  const filteredAgencies = agencies.filter(
    (agency) =>
      agency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: agencies.length,
    active: agencies.filter((a) => a.is_active).length,
    suspended: agencies.filter((a) => !a.is_active).length,
    totalHosts: agencies.reduce((sum, a) => sum + getAgencyHostsCount(a.id), 0),
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
        <Card className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl'>
          <CardHeader>
            <CardTitle className='text-3xl flex items-center gap-3'>
              <Building2 className='w-8 h-8' />
              Manage Agencies ({stats.total})
            </CardTitle>
            <p className='text-white/90 mt-2'>
              Control agency offices, commissions, and host assignments
            </p>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Total Agencies</p>
                  <p className='text-3xl font-bold text-gray-900'>{stats.total}</p>
                </div>
                <Building2 className='w-10 h-10 text-indigo-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Active</p>
                  <p className='text-3xl font-bold text-green-600'>{stats.active}</p>
                </div>
                <Building2 className='w-10 h-10 text-green-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Suspended</p>
                  <p className='text-3xl font-bold text-red-600'>{stats.suspended}</p>
                </div>
                <AlertCircle className='w-10 h-10 text-red-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Total Hosts</p>
                  <p className='text-3xl font-bold text-purple-600'>{stats.totalHosts}</p>
                </div>
                <Users className='w-10 h-10 text-purple-600' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col md:flex-row gap-4 justify-between items-center'>
              <div className='relative flex-1 w-full md:max-w-md'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  placeholder='Search agencies...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className='bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full md:w-auto'
              >
                <Plus className='w-5 h-5 mr-2' />
                Create Agency
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agencies List */}
        <div className='grid grid-cols-1 gap-4'>
          {filteredAgencies.map((agency) => {
            const hostsCount = getAgencyHostsCount(agency.id);

            return (
              <Card
                key={agency.id}
                className={`${
                  !agency.is_active ? 'opacity-60' : ''
                } hover:shadow-lg transition-shadow`}
              >
                <CardContent className='p-6'>
                  <div className='flex flex-col lg:flex-row gap-4 justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-start gap-3 mb-3'>
                        <div className='w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0'>
                          <Building2 className='w-6 h-6 text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <h3 className='text-xl font-bold text-gray-900'>{agency.name}</h3>
                            <Badge
                              className={
                                agency.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {agency.is_active ? 'Active' : 'Suspended'}
                            </Badge>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-gray-600'>
                            <div className='flex items-center gap-2'>
                              <Mail className='w-4 h-4' />
                              <span className='truncate'>{agency.email}</span>
                            </div>
                            {agency.phone && (
                              <div className='flex items-center gap-2'>
                                <Phone className='w-4 h-4' />
                                <span>{agency.phone}</span>
                              </div>
                            )}
                            <div className='flex items-center gap-2'>
                              <MapPin className='w-4 h-4' />
                              <span>{agency.city}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Users className='w-4 h-4' />
                              <span>
                                {hostsCount} host{hostsCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {agency.address && (
                            <p className='text-sm text-gray-500 mt-2'>{agency.address}</p>
                          )}
                        </div>
                      </div>

                      {/* Commission Rates */}
                      <div className='flex flex-wrap gap-2 mt-3'>
                        <Badge variant='outline' className='text-xs'>
                          <DollarSign className='w-3 h-3 mr-1' />
                          SAWA: {agency.commission_sawa_default || 28}%
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          <DollarSign className='w-3 h-3 mr-1' />
                          Office: {agency.commission_office_default || 7}%
                        </Badge>
                      </div>

                      {agency.created_date && (
                        <p className='text-xs text-gray-400 mt-3'>
                          Created: {format(new Date(agency.created_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className='flex lg:flex-col gap-2 lg:w-auto w-full'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setEditingAgency(agency)}
                        className='flex-1 lg:flex-none'
                      >
                        <Edit className='w-4 h-4 mr-1' />
                        Edit
                      </Button>
                      <Button
                        variant={agency.is_active ? 'destructive' : 'default'}
                        size='sm'
                        onClick={() =>
                          toggleAgencyStatusMutation.mutate({
                            agencyId: agency.id,
                            newStatus: !agency.is_active,
                          })
                        }
                        className='flex-1 lg:flex-none'
                      >
                        {agency.is_active ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredAgencies.length === 0 && (
            <Card>
              <CardContent className='py-12 text-center'>
                <Building2 className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>No agencies found</h3>
                <p className='text-gray-600'>
                  {searchTerm
                    ? 'Try a different search term'
                    : 'Create your first agency to get started'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Agency Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-2xl'>
              <Building2 className='w-6 h-6 text-indigo-600' />
              Create New Agency
            </DialogTitle>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div>
              <Label htmlFor='name'>Agency Name *</Label>
              <Input
                id='name'
                value={newAgency.name}
                onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                placeholder='Travel Agency Name'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='email'>Email *</Label>
                <Input
                  id='email'
                  type='email'
                  value={newAgency.email}
                  onChange={(e) => setNewAgency({ ...newAgency, email: e.target.value })}
                  placeholder='agency@example.com'
                />
              </div>

              <div>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  value={newAgency.phone}
                  onChange={(e) => setNewAgency({ ...newAgency, phone: e.target.value })}
                  placeholder='+962 79 xxx xxxx'
                />
              </div>
            </div>

            <div>
              <Label htmlFor='city'>City *</Label>
              <select
                id='city'
                value={newAgency.city}
                onChange={(e) => setNewAgency({ ...newAgency, city: e.target.value })}
                className='w-full h-10 px-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none'
              >
                <option value='Damascus'>Damascus</option>
                <option value='Amman'>Amman</option>
                <option value='Istanbul'>Istanbul</option>
                <option value='Cairo'>Cairo</option>
              </select>
            </div>

            <div>
              <Label htmlFor='address'>Address</Label>
              <Input
                id='address'
                value={newAgency.address}
                onChange={(e) => setNewAgency({ ...newAgency, address: e.target.value })}
                placeholder='Street address, building number'
              />
            </div>

            <div className='bg-indigo-50 p-4 rounded-lg border border-indigo-200'>
              <h4 className='font-semibold text-sm text-indigo-900 mb-2'>
                Default Commission Rates:
              </h4>
              <div className='space-y-1 text-sm text-indigo-800'>
                <p>• SAWA Commission: 28%</p>
                <p>• Office Commission: 7%</p>
                <p className='text-xs text-indigo-600 mt-2'>
                  These rates will apply to all hosts assigned to this agency
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAgency}
              disabled={createAgencyMutation.isPending}
              className='bg-gradient-to-r from-indigo-600 to-purple-600'
            >
              {createAgencyMutation.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className='w-4 h-4 mr-2' />
                  Create Agency
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agency Dialog */}
      <Dialog open={!!editingAgency} onOpenChange={() => setEditingAgency(null)}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-2xl'>
              <Edit className='w-6 h-6 text-indigo-600' />
              Edit Agency
            </DialogTitle>
          </DialogHeader>

          {editingAgency && (
            <div className='grid gap-4 py-4'>
              <div>
                <Label htmlFor='edit-name'>Agency Name</Label>
                <Input
                  id='edit-name'
                  value={editingAgency.name}
                  onChange={(e) => setEditingAgency({ ...editingAgency, name: e.target.value })}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='edit-email'>Email</Label>
                  <Input
                    id='edit-email'
                    type='email'
                    value={editingAgency.email}
                    onChange={(e) =>
                      setEditingAgency({
                        ...editingAgency,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor='edit-phone'>Phone</Label>
                  <Input
                    id='edit-phone'
                    value={editingAgency.phone || ''}
                    onChange={(e) =>
                      setEditingAgency({
                        ...editingAgency,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='edit-city'>City</Label>
                <select
                  id='edit-city'
                  value={editingAgency.city}
                  onChange={(e) => setEditingAgency({ ...editingAgency, city: e.target.value })}
                  className='w-full h-10 px-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none'
                >
                  <option value='Damascus'>Damascus</option>
                  <option value='Amman'>Amman</option>
                  <option value='Istanbul'>Istanbul</option>
                  <option value='Cairo'>Cairo</option>
                </select>
              </div>

              <div>
                <Label htmlFor='edit-address'>Address</Label>
                <Input
                  id='edit-address'
                  value={editingAgency.address || ''}
                  onChange={(e) =>
                    setEditingAgency({
                      ...editingAgency,
                      address: e.target.value,
                    })
                  }
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='edit-sawa'>SAWA Commission (%)</Label>
                  <Input
                    id='edit-sawa'
                    type='number'
                    value={editingAgency.commission_sawa_default || 28}
                    onChange={(e) =>
                      setEditingAgency({
                        ...editingAgency,
                        commission_sawa_default: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor='edit-office'>Office Commission (%)</Label>
                  <Input
                    id='edit-office'
                    type='number'
                    value={editingAgency.commission_office_default || 7}
                    onChange={(e) =>
                      setEditingAgency({
                        ...editingAgency,
                        commission_office_default: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingAgency(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAgency}
              disabled={updateAgencyMutation.isPending}
              className='bg-gradient-to-r from-indigo-600 to-purple-600'
            >
              {updateAgencyMutation.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
