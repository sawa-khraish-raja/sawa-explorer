import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  User,
  ArrowRight,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Eye,
  Edit,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function AdminPartnerRequests() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Fetch all partner requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['partnerRequests'],
    queryFn: async () => {
      const allRequests = await getAllDocuments('partnerrequests');
      return allRequests;
    },
    refetchInterval: 10000,
  });

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }) => {
      return await updateDocument('partnerrequests', requestId, { ...{
        status,
        admin_notes: notes,
      }, updated_date: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerRequests'] });
      toast.success(' Request status updated!');
      setShowDetailsDialog(false);
      setSelectedRequest(null);
      setAdminNotes('');
      setNewStatus('');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.organization_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Analytics
  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    contacted: requests.filter((r) => r.status === 'contacted').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setNewStatus(request.status);
    setShowDetailsDialog(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedRequest) return;

    updateStatusMutation.mutate({
      requestId: selectedRequest.id,
      status: newStatus,
      notes: adminNotes,
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'new':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <Clock className='w-3 h-3' />,
          label: 'New Request',
        };
      case 'contacted':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <Mail className='w-3 h-3' />,
          label: 'Contacted',
        };
      case 'in_progress':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <MessageSquare className='w-3 h-3' />,
          label: 'In Progress',
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: <CheckCircle2 className='w-3 h-3' />,
          label: 'Completed',
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: <XCircle className='w-3 h-3' />,
          label: 'Rejected',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: <AlertCircle className='w-3 h-3' />,
          label: status,
        };
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className='flex justify-center items-center min-h-screen'>
          <Loader2 className='w-12 h-12 animate-spin text-[var(--brand-primary)]' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <div className='w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-xl flex items-center justify-center shadow-lg'>
                <Briefcase className='w-6 h-6 text-white' />
              </div>
              Partner Requests
            </h1>
            <p className='text-gray-600 mt-2'>Manage partnership applications and opportunities</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          <Card className='border-l-4 border-l-blue-500'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Total</p>
                  <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
                </div>
                <Users className='w-8 h-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-blue-400'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>New</p>
                  <p className='text-2xl font-bold text-blue-600'>{stats.new}</p>
                </div>
                <Clock className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-purple-500'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Contacted</p>
                  <p className='text-2xl font-bold text-purple-600'>{stats.contacted}</p>
                </div>
                <Mail className='w-8 h-8 text-purple-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-yellow-500'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>In Progress</p>
                  <p className='text-2xl font-bold text-yellow-600'>{stats.inProgress}</p>
                </div>
                <MessageSquare className='w-8 h-8 text-yellow-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-green-500'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Completed</p>
                  <p className='text-2xl font-bold text-green-600'>{stats.completed}</p>
                </div>
                <CheckCircle2 className='w-8 h-8 text-green-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-red-500'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Rejected</p>
                  <p className='text-2xl font-bold text-red-600'>{stats.rejected}</p>
                </div>
                <XCircle className='w-8 h-8 text-red-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  placeholder='Search by name, email, or organization...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10 h-12'
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full md:w-48 h-12'>
                  <Filter className='w-4 h-4 mr-2' />
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Requests</SelectItem>
                  <SelectItem value='new'>New</SelectItem>
                  <SelectItem value='contacted'>Contacted</SelectItem>
                  <SelectItem value='in_progress'>In Progress</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className='p-12 text-center'>
              <Briefcase className='w-16 h-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>No Partner Requests</h3>
              <p className='text-gray-600'>
                {searchQuery || statusFilter !== 'all'
                  ? 'No requests match your filters'
                  : 'Partner requests will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-4'>
            {filteredRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);

              return (
                <Card
                  key={request.id}
                  className='hover:shadow-lg transition-all cursor-pointer border-2'
                  onClick={() => handleViewDetails(request)}
                >
                  <CardContent className='p-6'>
                    <div className='flex items-start justify-between gap-4'>
                      {/* Left: Main Info */}
                      <div className='flex-1 space-y-3'>
                        <div className='flex items-start gap-4'>
                          <div className='w-12 h-12 bg-gradient-to-br from-[var(--brand-bg-accent)] to-[var(--brand-bg-accent-light)] rounded-xl flex items-center justify-center flex-shrink-0'>
                            <Building2 className='w-6 h-6 text-[var(--brand-primary)]' />
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center gap-3 mb-2'>
                              <h3 className='text-lg font-bold text-gray-900'>
                                {request.organization_name}
                              </h3>
                              <Badge className={cn('border', statusConfig.color)}>
                                {statusConfig.icon}
                                <span className='ml-1'>{statusConfig.label}</span>
                              </Badge>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm'>
                              <div className='flex items-center gap-2 text-gray-600'>
                                <User className='w-4 h-4' />
                                <span>{request.first_name}</span>
                              </div>
                              <div className='flex items-center gap-2 text-gray-600'>
                                <Mail className='w-4 h-4' />
                                <a
                                  href={`mailto:${request.email}`}
                                  className='hover:text-[var(--brand-primary)] transition-colors'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {request.email}
                                </a>
                              </div>
                              <div className='flex items-center gap-2 text-gray-600'>
                                <Phone className='w-4 h-4' />
                                <a
                                  href={`tel:${request.phone}`}
                                  className='hover:text-[var(--brand-primary)] transition-colors'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {request.phone}
                                </a>
                              </div>
                              <div className='flex items-center gap-2 text-gray-600'>
                                <Calendar className='w-4 h-4' />
                                <span>
                                  {format(new Date(request.created_date), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            </div>

                            {/* Message Preview */}
                            <div className='mt-3 p-3 bg-gray-50 rounded-lg'>
                              <p className='text-sm text-gray-700 line-clamp-2'>
                                {request.message}
                              </p>
                            </div>

                            {/* Admin Notes Preview */}
                            {request.admin_notes && (
                              <div className='mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500'>
                                <p className='text-xs font-semibold text-blue-900 mb-1'>
                                  Admin Notes:
                                </p>
                                <p className='text-sm text-blue-800 line-clamp-1'>
                                  {request.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(request);
                        }}
                        className='flex-shrink-0'
                      >
                        <Eye className='w-4 h-4 mr-2' />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-3 text-2xl'>
              <div className='w-10 h-10 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-lg flex items-center justify-center'>
                <Briefcase className='w-5 h-5 text-white' />
              </div>
              Partner Request Details
            </DialogTitle>
            <DialogDescription>Review and manage partnership application</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className='space-y-6 py-4'>
              {/* Status Badge */}
              <div className='flex items-center justify-between'>
                <Badge
                  className={cn(
                    'text-base px-4 py-2 border',
                    getStatusConfig(selectedRequest.status).color
                  )}
                >
                  {getStatusConfig(selectedRequest.status).icon}
                  <span className='ml-2'>{getStatusConfig(selectedRequest.status).label}</span>
                </Badge>
                <div className='text-sm text-gray-500'>
                  Submitted: {format(new Date(selectedRequest.created_date), 'PPpp')}
                </div>
              </div>

              {/* Organization Info */}
              <Card className='bg-gradient-to-br from-[var(--brand-bg-secondary)] to-white'>
                <CardContent className='p-6'>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>Organization Information</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Organization Name</p>
                      <p className='font-semibold text-gray-900'>
                        {selectedRequest.organization_name}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Contact Person</p>
                      <p className='font-semibold text-gray-900'>{selectedRequest.first_name}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Email</p>
                      <a
                        href={`mailto:${selectedRequest.email}`}
                        className='font-semibold text-[var(--brand-primary)] hover:underline'
                      >
                        {selectedRequest.email}
                      </a>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Phone</p>
                      <a
                        href={`tel:${selectedRequest.phone}`}
                        className='font-semibold text-[var(--brand-primary)] hover:underline'
                      >
                        {selectedRequest.phone}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message */}
              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-lg font-bold text-gray-900 mb-3 flex items-center gap-2'>
                    <FileText className='w-5 h-5' />
                    Partner's Message
                  </h3>
                  <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                    <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
                      {selectedRequest.message}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Update Status Section */}
              <Card className='border-2 border-[var(--brand-primary)]'>
                <CardContent className='p-6'>
                  <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                    <Edit className='w-5 h-5' />
                    Update Status
                  </h3>

                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        Status
                      </label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className='h-12'>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='new'>New Request</SelectItem>
                          <SelectItem value='contacted'>Contacted</SelectItem>
                          <SelectItem value='in_progress'>In Progress</SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
                          <SelectItem value='rejected'>Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        Admin Notes
                      </label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder='Add internal notes about this request...'
                        rows={4}
                        className='resize-none'
                      />
                    </div>

                    <div className='flex justify-end gap-3 pt-4 border-t'>
                      <Button variant='outline' onClick={() => setShowDetailsDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateStatus}
                        disabled={updateStatusMutation.isPending}
                        className='bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:from-[var(--brand-primary-hover)] hover:to-[var(--brand-secondary-hover)]'
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className='w-4 h-4 mr-2' />
                            Update Status
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Admin Notes (if any) */}
              {selectedRequest.admin_notes && (
                <Card className='bg-blue-50 border-blue-200'>
                  <CardContent className='p-6'>
                    <h3 className='text-lg font-bold text-blue-900 mb-3 flex items-center gap-2'>
                      <MessageSquare className='w-5 h-5' />
                      Current Admin Notes
                    </h3>
                    <p className='text-blue-800 whitespace-pre-wrap leading-relaxed'>
                      {selectedRequest.admin_notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
