import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Users,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllDocuments, updateDocument, addDocument } from '@/utils/firestore';

import AdminLayout from '../components/admin/AdminLayout';
import HostApprovalCard from '../components/admin/HostApprovalCard';
import { UseAppContext } from '../components/context/AppContext';

export default function AdminHostRequests() {
  const queryClient = useQueryClient();
  const { user: currentUser } = UseAppContext();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Load host requests
  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['hostRequests'],
    queryFn: async () => {
      const requests = await getAllDocuments('host_requests');
      return requests.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter requests
  const filteredRequests = allRequests.filter((request) => {
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      request.host_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.host_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === 'all' || request.host_city === cityFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;

    return matchesTab && matchesSearch && matchesCity && matchesPriority;
  });

  // Stats
  const stats = {
    pending: allRequests.filter((r) => r.status === 'pending').length,
    under_review: allRequests.filter((r) => r.status === 'under_review').length,
    approved: allRequests.filter((r) => r.status === 'approved').length,
    rejected: allRequests.filter((r) => r.status === 'rejected').length,
    needs_info: allRequests.filter((r) => r.status === 'needs_info').length,
  };

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ request, approvalData }) => {
      // 1. Find the user by email to get their ID for update
      const allUsers = await getAllDocuments('users');
      const user = allUsers.find((u) => u.email.toLowerCase() === request.host_email.toLowerCase());

      if (!user) {
        throw new Error(
          ` User with email ${request.host_email} is not registered in the system. They must register first in the app before being approved as a host.`
        );
      }

      // 2. Update HostRequest status
      await updateDocument('host_requests', request.id, {
        status: 'approved',
        reviewed_by: currentUser.email,
        reviewed_at: new Date().toISOString(),
        admin_notes: approvalData.admin_notes,
        updated_date: new Date().toISOString(),
      });

      // 3. Update User entity - approve as host using user.id
      await updateDocument('users', user.id, {
        host_approved: true,
        host_type: approvalData.host_type,
        office_id: approvalData.office_id || null,
        city: request.host_city,
        assigned_cities: approvalData.assigned_cities || [request.host_city],
        visible_in_city: true,
        bio: request.host_bio || '',
        phone: request.host_phone,
        languages: request.languages || ['en'],
        updated_date: new Date().toISOString(),
      });

      // 4. Create audit log
      await addDocument('audit_logs', {
        admin_email: currentUser.email,
        action: 'approve_host',
        affected_user_email: request.host_email,
        details: JSON.stringify({
          host_type: approvalData.host_type,
          office_id: approvalData.office_id,
          request_id: request.id,
          admin_notes: approvalData.admin_notes,
        }),
        notes: approvalData.admin_notes,
        created_date: new Date().toISOString(),
      });

      // 5. Send notification to host
      await addDocument('notifications', {
        recipient_email: request.host_email,
        recipient_type: 'host',
        type: 'host_approved',
        title: "🎉 Congratulations! You're now a SAWA Host",
        message:
          approvalData.host_type === 'office' && approvalData.office_id
            ? `Your host application has been approved, and you've been assigned to an office. Welcome to the SAWA community!`
            : `Your host application has been approved. Welcome to the SAWA community!`,
        link: '/host-dashboard',
        created_date: new Date().toISOString(),
        read: false,
      });

      return { request, user };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hostRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] }); // Invalidate all users if a user was updated
      queryClient.invalidateQueries({ queryKey: ['hosts'] }); // If there's a dedicated hosts list
      toast.success(' Host approved successfully!', {
        description: `${data.user.full_name || data.user.email} is now a host.`,
      });
    },
    onError: (error) => {
      console.error('Approval error:', error);
      toast.error(' Failed to approve host', {
        description: error.message,
        duration: 8000,
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ request, rejectionData }) => {
      // 1. Update HostRequest
      await updateDocument('host_requests', request.id, {
        status: 'rejected',
        rejection_reason: rejectionData.rejection_reason,
        rejection_details: rejectionData.rejection_details,
        reviewed_by: currentUser.email,
        reviewed_at: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      // 2. Create audit log
      await addDocument('audit_logs', {
        admin_email: currentUser.email,
        action: 'reject_host',
        affected_user_email: request.host_email,
        details: JSON.stringify({
          rejection_reason: rejectionData.rejection_reason,
          request_id: request.id,
        }),
        notes: rejectionData.rejection_details,
        created_date: new Date().toISOString(),
      });

      // 3. Send notification
      await addDocument('notifications', {
        recipient_email: request.host_email,
        recipient_type: 'host',
        type: 'host_rejection',
        title: ' Host Application Update',
        message: `Unfortunately, your host application was not approved. Reason: ${
          rejectionData.rejection_details || rejectionData.rejection_reason
        }. You can reapply after reviewing your profile.`,
        link: '/BecomeAHost',
        created_date: new Date().toISOString(),
        read: false,
      });

      return { request, rejectionData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostRequests'] });
      toast.success('Request rejected');
    },
    onError: (error) => {
      console.error('Rejection error:', error);
      toast.error('Failed to reject request', {
        description: error.message,
        duration: 8000,
      });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Host Requests</h1>
            <p className='text-gray-600 mt-1'>Review and approve host applications</p>
          </div>
          <Badge className='bg-purple-100 text-purple-800 text-lg px-4 py-2'>
            {stats.pending + stats.under_review + stats.needs_info} Pending Review
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-500'>Pending</p>
                  <p className='text-2xl font-bold'>{stats.pending}</p>
                </div>
                <Clock className='w-8 h-8 text-yellow-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-500'>Under Review</p>
                  <p className='text-2xl font-bold'>{stats.under_review}</p>
                </div>
                <Eye className='w-8 h-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-500'>Approved</p>
                  <p className='text-2xl font-bold'>{stats.approved}</p>
                </div>
                <CheckCircle className='w-8 h-8 text-green-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-500'>Rejected</p>
                  <p className='text-2xl font-bold'>{stats.rejected}</p>
                </div>
                <XCircle className='w-8 h-8 text-red-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-500'>Needs Info</p>
                  <p className='text-2xl font-bold'>{stats.needs_info}</p>
                </div>
                <AlertCircle className='w-8 h-8 text-orange-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex flex-col sm:flex-row gap-3'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    placeholder='Search by name or email...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className='w-full sm:w-40'>
                  <SelectValue placeholder='City' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Cities</SelectItem>
                  {/* Assuming cities need to be dynamically populated, this is a placeholder */}
                  <SelectItem value='Damascus'>Damascus</SelectItem>
                  <SelectItem value='Amman'>Amman</SelectItem>
                  <SelectItem value='Istanbul'>Istanbul</SelectItem>
                  <SelectItem value='Cairo'>Cairo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className='w-full sm:w-40'>
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priorities</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid grid-cols-6 w-full'>
            <TabsTrigger value='all'>All ({allRequests.length})</TabsTrigger>
            <TabsTrigger value='pending'>Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value='under_review'>Review ({stats.under_review})</TabsTrigger>
            <TabsTrigger value='needs_info'>Needs Info ({stats.needs_info})</TabsTrigger>
            <TabsTrigger value='approved'>Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value='rejected'>Rejected ({stats.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className='mt-6'>
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className='py-12 text-center'>
                  <Users className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-500'>
                    No requests found for this category and filter combination.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                {filteredRequests.map((request) => (
                  <HostApprovalCard
                    key={request.id}
                    request={request}
                    onApprove={(req, data) =>
                      approveMutation.mutate({
                        request: req,
                        approvalData: data,
                      })
                    }
                    onReject={(req, data) =>
                      rejectMutation.mutate({
                        request: req,
                        rejectionData: data,
                      })
                    }
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
