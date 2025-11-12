import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Loader2,
  Plus,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
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
} from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { getAllDocuments, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';

import AdventureForm from '@/features/traveler/adventures/components/AdventureForm';
import { calculateAdventureCommissions } from '@/features/traveler/adventures/components/commissionCalculator';
import { UseAppContext } from '@/shared/context/AppContext';

export default function OfficeAdventures() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAdventure, setEditingAdventure] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Load current user (Office)
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const currentUser = await UseAppContext().user;
      if (!currentUser || currentUser.role_type !== 'office') {
        navigate(createPageUrl('Home'));
        return null;
      }
      return currentUser;
    },
  });

  // Load office data
  const { data: office } = useQuery({
    queryKey: ['userOffice', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const allOffices = await getAllDocuments('offices');
      return allOffices.find((o) => o.email?.toLowerCase() === user.email.toLowerCase());
    },
    enabled: !!user?.email,
  });

  // Load office's adventures
  const { data: adventures = [], isLoading: adventuresLoading } = useQuery({
    queryKey: ['officeAdventures', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allAdventures = await getAllDocuments('adventures');
      return allAdventures.filter(
        (a) => a.host_email === user.email && a.added_by_type === 'office'
      );
    },
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  // Create/Update mutation
  const saveAdventureMutation = useMutation({
    mutationFn: async (adventureData) => {
      //  Office entity creates adventure - 35% SAWA commission
      const commissions = calculateAdventureCommissions(
        parseFloat(adventureData.host_price),
        'office_entity'
      );

      const dataToSave = {
        ...adventureData,
        host_email: user.email,
        added_by_type: 'office',
        office_id: office?.id || null,
        approval_status: 'pending',
        status: 'pending',
        sawa_commission_amount: commissions.sawaAmount,
        office_commission_amount: 0, // No office commission when office creates
        traveler_total_price: commissions.travelerPays,
        commission_breakdown: {
          host_receives: commissions.hostReceives,
          sawa_percent: commissions.sawaPercent,
          sawa_amount: commissions.sawaAmount,
          office_percent: 0,
          office_amount: 0,
          traveler_pays: commissions.travelerPays,
        },
      };

      if (editingAdventure) {
        return updateDocument('adventures', editingAdventure.id, {
          ...dataToSave,
          updated_date: new Date().toISOString(),
        });
      }
      return addDocument('adventures', { ...dataToSave, created_date: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officeAdventures'] });
      setShowCreateDialog(false);
      setEditingAdventure(null);
      toast.success(
        editingAdventure ? 'Adventure updated!' : 'Adventure created! Pending admin approval.'
      );
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error('Failed to save adventure');
    },
  });

  // Delete mutation
  const deleteAdventureMutation = useMutation({
    mutationFn: async (id) => {
      return deleteDocument('adventures', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officeAdventures'] });
      setDeleteConfirmId(null);
      toast.success('Adventure deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete adventure');
    },
  });

  if (userLoading || adventuresLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white'>
        <Loader2 className='w-12 h-12 animate-spin text-[#7B2CBF]' />
      </div>
    );
  }

  const pending = adventures.filter((a) => a.approval_status === 'pending');
  const approved = adventures.filter((a) => a.approval_status === 'approved');
  const rejected = adventures.filter((a) => a.approval_status === 'rejected');

  const filteredAdventures =
    activeTab === 'all'
      ? adventures
      : activeTab === 'pending'
        ? pending
        : activeTab === 'approved'
          ? approved
          : rejected;

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-white'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Header */}
        <Card className='mb-8 overflow-hidden shadow-xl border-0'>
          <div className='bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] p-8 text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold mb-2 flex items-center gap-3'>
                  <Building2 className='w-8 h-8' />
                  Office Adventures
                </h1>
                <p className='text-purple-100'>
                  Create and manage group activities for your office
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingAdventure(null);
                  setShowCreateDialog(true);
                }}
                className='bg-white text-[#7B2CBF] hover:bg-purple-50'
              >
                <Plus className='w-5 h-5 mr-2' />
                Create Adventure
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
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

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center'>
                  <Clock className='w-6 h-6 text-yellow-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Pending Approval</p>
                  <p className='text-2xl font-bold'>{pending.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center'>
                  <DollarSign className='w-6 h-6 text-purple-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Total Bookings</p>
                  <p className='text-2xl font-bold'>
                    {adventures.reduce((sum, a) => sum + (a.total_bookings || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='bg-white shadow-md p-1 mb-6'>
            <TabsTrigger value='all'>All ({adventures.length})</TabsTrigger>
            <TabsTrigger value='pending'>Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value='approved'>Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value='rejected'>Rejected ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className='space-y-4'>
            {filteredAdventures.length === 0 ? (
              <Card>
                <CardContent className='text-center py-12'>
                  <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <p className='text-lg font-semibold text-gray-700'>No adventures yet</p>
                  <p className='text-gray-500 mt-2 mb-4'>Create your first group adventure</p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className='bg-[#7B2CBF] hover:bg-[#6A1FA0]'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    Create Adventure
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredAdventures.map((adventure) => (
                  <Card key={adventure.id} className='hover:shadow-lg transition-shadow'>
                    <div className='relative aspect-[4/3] overflow-hidden'>
                      <img
                        src={
                          adventure.image_url ||
                          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
                        }
                        alt={adventure.title}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute top-3 right-3'>
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
                        <Badge className='bg-[#7B2CBF]'>{adventure.category}</Badge>
                      </div>
                    </div>

                    <CardContent className='p-5'>
                      <h3 className='font-bold text-lg mb-2 line-clamp-1'>{adventure.title}</h3>
                      <p className='text-sm text-gray-600 line-clamp-2 mb-4'>
                        {adventure.description}
                      </p>

                      <div className='space-y-2 mb-4'>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Calendar className='w-4 h-4 text-[#7B2CBF]' />
                          {format(new Date(adventure.date), 'MMM d, yyyy')}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <MapPin className='w-4 h-4 text-[#7B2CBF]' />
                          {adventure.city}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Users className='w-4 h-4 text-[#7B2CBF]' />
                          {adventure.current_participants}/{adventure.max_participants} participants
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <DollarSign className='w-4 h-4 text-[#7B2CBF]' />${adventure.host_price}{' '}
                          (You receive)
                        </div>
                      </div>

                      {adventure.approval_status === 'rejected' && adventure.admin_notes && (
                        <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                          <div className='flex items-start gap-2'>
                            <AlertCircle className='w-4 h-4 text-red-600 mt-0.5 flex-shrink-0' />
                            <div>
                              <p className='text-xs font-semibold text-red-800'>
                                Rejection Reason:
                              </p>
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
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setEditingAdventure(adventure);
                            setShowCreateDialog(true);
                          }}
                          className='flex-1'
                        >
                          <Edit className='w-4 h-4 mr-1' />
                          Edit
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

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {editingAdventure ? 'Edit Adventure' : 'Create New Adventure'}
              </DialogTitle>
              <DialogDescription>
                {editingAdventure
                  ? 'Update your adventure details. Changes will need admin approval.'
                  : 'Create a group adventure for travelers. Your adventure will need admin approval before going live.'}
              </DialogDescription>
            </DialogHeader>

            <AdventureForm
              adventure={editingAdventure}
              hostType='office'
              onSubmit={(data) => saveAdventureMutation.mutate(data)}
              onCancel={() => {
                setShowCreateDialog(false);
                setEditingAdventure(null);
              }}
              isSubmitting={saveAdventureMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Adventure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the adventure and all
                related data.
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
    </div>
  );
}
