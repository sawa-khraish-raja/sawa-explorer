import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Loader2,
  Plus,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { queryDocuments, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';

import AdminLayout from '../components/admin/AdminLayout';
import PermissionGuard from '../components/admin/PermissionGuard';
import AdventureForm from '../components/adventures/AdventureForm';
import { UseAppContext } from '../components/context/AppContext';

export default function AdminAdventures() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = UseAppContext();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAdventure, setEditingAdventure] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [reviewingAdventure, setReviewingAdventure] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  //  Load all adventures from Firestore
  const { data: adventures = [], isLoading: adventuresLoading } = useQuery({
    queryKey: ['allAdventures'],
    queryFn: async () => {
      // Get all adventures sorted by creation date (newest first)
      return queryDocuments('adventures', [], {
        orderBy: { field: 'created_at', direction: 'desc' },
      });
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Consider data stale immediately
  });

  //  Approve mutation using Firestore
  const approveMutation = useMutation({
    mutationFn: (adventureId) => {
      return updateDocument('adventures', adventureId, {
        approval_status: 'approved',
        status: 'upcoming',
        admin_notes: '',
        is_active: true, // Make it active when approved
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['allAdventures'] });
      await queryClient.refetchQueries({ queryKey: ['adventures'] }); // Refetch public adventures list
      await queryClient.refetchQueries({ queryKey: ['adminNotificationCounts'] }); // Update sidebar badge
      toast.success('Adventure approved!');
    },
    onError: (error) => {
      console.error('Approve error:', error);
      toast.error('Failed to approve adventure');
    },
  });

  //  Reject mutation using Firestore
  const rejectMutation = useMutation({
    mutationFn: ({ adventureId, reason }) => {
      return updateDocument('adventures', adventureId, {
        approval_status: 'rejected',
        status: 'rejected',
        admin_notes: reason,
        is_active: false, // Deactivate when rejected
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['allAdventures'] });
      await queryClient.refetchQueries({ queryKey: ['adventures'] }); // Refetch public adventures list
      await queryClient.refetchQueries({ queryKey: ['adminNotificationCounts'] }); // Update sidebar badge
      setReviewingAdventure(null);
      setRejectionReason('');
      toast.success('Adventure rejected');
    },
    onError: (error) => {
      console.error('Reject error:', error);
      toast.error('Failed to reject adventure');
    },
  });

  //  Delete mutation using Firestore
  const deleteAdventureMutation = useMutation({
    mutationFn: (id) => {
      return deleteDocument('adventures', id);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['allAdventures'] });
      await queryClient.refetchQueries({ queryKey: ['adventures'] }); // Refetch public adventures list
      await queryClient.refetchQueries({ queryKey: ['adminNotificationCounts'] }); // Update sidebar badge
      setDeleteConfirmId(null);
      toast.success('Adventure deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete adventure');
    },
  });

  //  Create admin adventure mutation using Firestore
  const createAdminAdventureMutation = useMutation({
    mutationFn: (adventureData) => {
      // Admin adventures are automatically approved
      const newAdventure = {
        ...adventureData,
        host_id: user?.id || 'admin',
        host_email: user?.email || 'admin@sawa.com',
        added_by_type: 'admin',
        approval_status: 'approved',
        status: 'upcoming',
        is_active: true, // Auto-activate admin adventures
      };
      return addDocument('adventures', newAdventure);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['allAdventures'] });
      await queryClient.refetchQueries({ queryKey: ['adventures'] }); // Refetch public adventures list
      await queryClient.refetchQueries({ queryKey: ['adminNotificationCounts'] }); // Update sidebar badge
      setShowCreateDialog(false);
      toast.success('Admin adventure created!');
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error('Failed to create adventure');
    },
  });

  if (adventuresLoading) {
    return (
      <PermissionGuard pageId='adventures'>
        <AdminLayout>
          <div className='flex justify-center items-center h-96'>
            <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
          </div>
        </AdminLayout>
      </PermissionGuard>
    );
  }

  // Filter adventures
  const pending = adventures.filter((a) => a.approval_status === 'pending');
  const approved = adventures.filter((a) => a.approval_status === 'approved');
  const rejected = adventures.filter((a) => a.approval_status === 'rejected');

  const filteredAdventures = (() => {
    let filtered =
      activeTab === 'all'
        ? adventures
        : activeTab === 'pending'
          ? pending
          : activeTab === 'approved'
            ? approved
            : rejected;

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter((a) => (a.city_name || a.city) === selectedCity);
    }

    return filtered;
  })();

  const cities = [...new Set(adventures.map((a) => a.city_name || a.city))].filter(Boolean);

  return (
    <PermissionGuard pageId='adventures'>
      <AdminLayout currentPage='adventures'>
        <div className='space-y-6'>
          {/* Header */}
          <Card className='border-2 border-[#E6E6FF]'>
            <CardHeader className='bg-gradient-to-r from-[#330066] to-[#9933CC] text-white p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-2xl flex items-center gap-3'>
                    <Zap className='w-8 h-8' />
                    Adventures Management
                  </CardTitle>
                  <p className='text-purple-100 mt-1'>Review and manage all adventures</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingAdventure(null);
                    setShowCreateDialog(true);
                  }}
                  className='bg-white text-[#330066] hover:bg-purple-50'
                >
                  <Plus className='w-5 h-5 mr-2' />
                  Create Admin Adventure
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <Card className='border-2 border-[#E6E6FF]'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
                    <Calendar className='w-6 h-6 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Total Adventures</p>
                    <p className='text-2xl font-bold'>{adventures.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-2 border-[#E6E6FF]'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center'>
                    <Clock className='w-6 h-6 text-yellow-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Pending Review</p>
                    <p className='text-2xl font-bold'>{pending.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-2 border-[#E6E6FF]'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
                    <CheckCircle className='w-6 h-6 text-green-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Approved</p>
                    <p className='text-2xl font-bold'>{approved.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-2 border-[#E6E6FF]'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center'>
                    <XCircle className='w-6 h-6 text-red-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Rejected</p>
                    <p className='text-2xl font-bold'>{rejected.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className='border-2 border-[#E6E6FF]'>
            <CardContent className='p-4'>
              <div className='flex flex-col md:flex-row gap-4'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    placeholder='Search adventures...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <Filter className='w-4 h-4 text-gray-500' />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9933CC]'
                  >
                    <option value='all'>All Cities</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='bg-white shadow-md p-1'>
              <TabsTrigger
                value='pending'
                className={cn('data-[state=active]:bg-[#9933CC] data-[state=active]:text-white')}
              >
                Pending ({pending.length})
              </TabsTrigger>
              <TabsTrigger
                value='approved'
                className={cn('data-[state=active]:bg-[#9933CC] data-[state=active]:text-white')}
              >
                Approved ({approved.length})
              </TabsTrigger>
              <TabsTrigger
                value='rejected'
                className={cn('data-[state=active]:bg-[#9933CC] data-[state=active]:text-white')}
              >
                Rejected ({rejected.length})
              </TabsTrigger>
              <TabsTrigger
                value='all'
                className={cn('data-[state=active]:bg-[#9933CC] data-[state=active]:text-white')}
              >
                All ({adventures.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className='mt-6'>
              {filteredAdventures.length === 0 ? (
                <Card className='border-2 border-[#E6E6FF]'>
                  <CardContent className='text-center py-12'>
                    <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                    <p className='text-lg font-semibold text-gray-700'>No adventures found</p>
                    <p className='text-gray-500 mt-2'>Try adjusting your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {filteredAdventures.map((adventure) => (
                    <Card
                      key={adventure.id}
                      className='hover:shadow-xl transition-shadow border-2 border-[#E6E6FF]'
                    >
                      <div className='relative aspect-[4/3] overflow-hidden'>
                        <img
                          src={
                            (adventure.images && adventure.images[0]) ||
                            adventure.image_url ||
                            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
                          }
                          alt={adventure.title}
                          className='w-full h-full object-cover'
                        />
                        <div className='absolute top-3 right-3 flex gap-2'>
                          <Badge
                            className={
                              adventure.approval_status === 'approved'
                                ? 'bg-green-500'
                                : adventure.approval_status === 'pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }
                          >
                            {adventure.approval_status === 'approved' ? (
                              <>
                                <CheckCircle className='w-3 h-3 mr-1' /> Approved
                              </>
                            ) : adventure.approval_status === 'pending' ? (
                              <>
                                <Clock className='w-3 h-3 mr-1' /> Pending
                              </>
                            ) : (
                              <>
                                <XCircle className='w-3 h-3 mr-1' /> Rejected
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className='absolute top-3 left-3'>
                          <Badge
                            className={
                              adventure.added_by_type === 'admin'
                                ? 'bg-purple-600'
                                : adventure.added_by_type === 'office'
                                  ? 'bg-blue-600'
                                  : 'bg-green-600'
                            }
                          >
                            {adventure.added_by_type === 'admin'
                              ? 'Admin'
                              : adventure.added_by_type === 'office'
                                ? 'Office'
                                : 'Host'}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className='p-5'>
                        <h3 className='font-bold text-lg mb-2 line-clamp-1'>{adventure.title}</h3>
                        <p className='text-sm text-gray-600 line-clamp-2 mb-4'>
                          {adventure.description}
                        </p>

                        <div className='space-y-2 mb-4'>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Calendar className='w-4 h-4 text-[#9933CC]' />
                            {format(new Date(adventure.date), 'MMM d, yyyy')}
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <MapPin className='w-4 h-4 text-[#9933CC]' />
                            {adventure.city_name || adventure.city}
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Users className='w-4 h-4 text-[#9933CC]' />
                            {adventure.current_participants || 0}/{adventure.max_guests || 0}{' '}
                            participants
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <DollarSign className='w-4 h-4 text-[#9933CC]' />${adventure.price || 0}
                          </div>
                        </div>

                        {adventure.approval_status === 'pending' && (
                          <div className='flex items-center gap-2 mb-4'>
                            <Button
                              onClick={() => approveMutation.mutate(adventure.id)}
                              disabled={approveMutation.isPending}
                              className='flex-1 bg-green-600 hover:bg-green-700'
                            >
                              {approveMutation.isPending ? (
                                <Loader2 className='w-4 h-4 animate-spin' />
                              ) : (
                                <>
                                  <CheckCircle className='w-4 h-4 mr-1' />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => setReviewingAdventure(adventure)}
                              variant='destructive'
                              className='flex-1'
                            >
                              <XCircle className='w-4 h-4 mr-1' />
                              Reject
                            </Button>
                          </div>
                        )}

                        {adventure.admin_notes && (
                          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                            <div className='flex items-start gap-2'>
                              <AlertCircle className='w-4 h-4 text-red-600 mt-0.5 flex-shrink-0' />
                              <div>
                                <p className='text-xs font-semibold text-red-800'>Admin Notes:</p>
                                <p className='text-xs text-red-700 mt-1'>{adventure.admin_notes}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              navigate(createPageUrl(`AdventureDetails?id=${adventure.id}`))
                            }
                            className='flex-1'
                          >
                            <Eye className='w-4 h-4 mr-1' />
                            View
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => setDeleteConfirmId(adventure.id)}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Create Admin Adventure Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Create Admin Adventure</DialogTitle>
                <DialogDescription>
                  Adventures created by admin are automatically approved (no commission).
                </DialogDescription>
              </DialogHeader>

              <AdventureForm
                adventure={null}
                hostType='admin'
                onSubmit={(data) => createAdminAdventureMutation.mutate(data)}
                onCancel={() => setShowCreateDialog(false)}
                isSubmitting={createAdminAdventureMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Rejection Dialog */}
          <Dialog
            open={!!reviewingAdventure}
            onOpenChange={() => {
              setReviewingAdventure(null);
              setRejectionReason('');
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Adventure</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this adventure
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder='Reason for rejection...'
                  rows={4}
                />
                <div className='flex justify-end gap-3'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setReviewingAdventure(null);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => {
                      if (rejectionReason.trim()) {
                        rejectMutation.mutate({
                          adventureId: reviewingAdventure.id,
                          reason: rejectionReason,
                        });
                      } else {
                        toast.error('Please provide a rejection reason');
                      }
                    }}
                    disabled={!rejectionReason.trim() || rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      'Reject Adventure'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Adventure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the adventure.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAdventureMutation.mutate(deleteConfirmId)}
                  className='bg-red-600 hover:bg-red-700'
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
}
