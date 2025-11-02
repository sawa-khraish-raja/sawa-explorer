import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getAllDocuments } from '@/utils/firestore';
import { useAppContext } from '../components/context/AppContext';
import PermissionGuard from '../components/admin/PermissionGuard';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Users,
  Search,
  UserCheck,
  Shield,
  Building2,
  Lock,
  UserPlus,
  UserX,
  MapPin,
  Filter,
  Trash2,
  Eye,
  BarChart3,
} from 'lucide-react'; // BarChart3 added
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AdminPermissionsDialog from '../components/admin/AdminPermissionsDialog';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ApproveHostDialog from '../components/admin/ApproveHostDialog';
import AssignOfficeDialog from '../components/admin/AssignOfficeDialog';
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

async function logAuditAction(adminEmail, action, affectedUserEmail, details = {}) {
  try {
    await base44.entities.AuditLog.create({
      admin_email: adminEmail,
      action: action,
      affected_user_email: affectedUserEmail,
      details: JSON.stringify(details),
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [userToApprove, setUserToApprove] = useState(null);
  const [userToAssignOffice, setUserToAssignOffice] = useState(null);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user: currentUser } = useAppContext();
  const hasFullAccess = currentUser?.admin_access_type === 'full' || currentUser?.role === 'admin';

  const { data: users, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const allUsers = await getAllDocuments('users');
      // Sort by created_date descending (most recent first)
      return allUsers.sort((a, b) => {
        const dateA = new Date(a.created_date || a.created_at || 0);
        const dateB = new Date(b.created_date || b.created_at || 0);
        return dateB - dateA;
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates, city, officeData, action, affectedUserEmail }) => {
      const finalUpdates = { ...updates };

      //  When removing office role
      if (updates.role_type === 'user' && updates.office_id === null) {
        const currentUserData = users.find((u) => u.id === userId);
        if (currentUserData?.office_id) {
          const office = await base44.entities.Office.get(currentUserData.office_id);
          if (office && office.assigned_hosts) {
            const updatedHosts = office.assigned_hosts.filter(
              (email) => email !== currentUserData.email
            );
            await base44.entities.Office.update(office.id, {
              assigned_hosts: updatedHosts,
              total_hosts: Math.max(0, (office.total_hosts || 0) - 1),
            });
          }
        }
      }

      //  قاعدة 1: Admin حصرياً
      if (updates.role === 'admin' || updates.role_type === 'admin') {
        finalUpdates.role_type = 'admin';
        finalUpdates.role = 'admin';
        finalUpdates.company_name = null;
        finalUpdates.office_id = null;
        finalUpdates.city = null;
        finalUpdates.assigned_cities = [];
        finalUpdates.host_approved = false;
        finalUpdates.visible_in_city = false;
        console.log('🔒 Making user admin - removing all other roles');
      }

      //  قاعدة 2: Office حصرياً (إلا إذا كان host)
      if (officeData) {
        finalUpdates.role_type = 'office';
        finalUpdates.company_name = officeData.name;
        finalUpdates.office_id = officeData.id;
        finalUpdates.admin_access_type = null;
        finalUpdates.role = 'user';
        // ما نشيل host_approved إذا موجود
        console.log('🏢 Making user office manager');
      }

      //  قاعدة 3: Host (ممكن يكون مع Office)
      if (updates.host_approved === true) {
        // إذا كان admin، ما نسمحله يصير host
        const user = users.find((u) => u.id === userId);
        if (user && (user.role === 'admin' || user.role_type === 'admin')) {
          toast.error('Admins cannot be hosts. Remove admin role first.');
          throw new Error('Admins cannot be hosts');
        }
        console.log(' Approving user as host');
      }

      //  إلغاء Host
      if (updates.host_approved === false) {
        finalUpdates.visible_in_city = false;
        finalUpdates.city = null;
        finalUpdates.assigned_cities = [];
        console.log(' Revoking host access');
      }

      //  قاعدة 4: Marketing حصرياً
      if (updates.role_type === 'marketing') {
        finalUpdates.role_type = 'marketing';
        finalUpdates.role = 'user';
        finalUpdates.admin_access_type = null;
        finalUpdates.company_name = null;
        finalUpdates.office_id = null;
        finalUpdates.host_approved = false;
        finalUpdates.visible_in_city = false;
        console.log('📊 Making user marketing');
      }

      const updatedUser = await base44.entities.User.update(userId, finalUpdates);

      if (action) {
        await logAuditAction(currentUser?.email, action, affectedUserEmail, {
          updates,
          city,
          office: officeData?.name,
        });
      }

      //  تحديث HostProfile
      if (updates.host_approved !== undefined) {
        const hostProfiles = await base44.entities.HostProfile.filter({
          user_email: updatedUser.email,
        });
        if (updates.host_approved) {
          const hostProfileData = {
            user_email: updatedUser.email,
            user_id: updatedUser.id,
            full_name: updatedUser.full_name,
            display_name: updatedUser.display_name || updatedUser.full_name,
            city: city || updatedUser.city,
            cities: updatedUser.assigned_cities || (city ? [city] : []),
            is_active: true,
            bio: updatedUser.bio || '',
            profile_photo: updatedUser.profile_photo || '',
            languages: updatedUser.languages || ['English', 'Arabic'],
            rating: updatedUser.rating || 5.0,
            host_type: updatedUser.host_type || 'freelancer',
            office_id: updatedUser.office_id,
            company_name: updatedUser.company_name,
            services_offered: updatedUser.services_offered || [],
            completed_bookings: updatedUser.completed_bookings || 0,
            response_time_hours: updatedUser.response_time_hours || 24,
            last_synced: new Date().toISOString(),
          };

          if (hostProfiles && hostProfiles.length > 0) {
            await base44.entities.HostProfile.update(hostProfiles[0].id, hostProfileData);
          } else {
            await base44.entities.HostProfile.create(hostProfileData);
          }
        } else {
          if (hostProfiles && hostProfiles.length > 0) {
            await base44.entities.HostProfile.update(hostProfiles[0].id, {
              is_active: false,
              city: null,
              cities: [],
              office_id: null,
              company_name: null,
            });
          }
        }
      }

      //  إرسال إشعارات عن جميع الحجوزات المفتوحة في المدينة
      if (updates.host_approved === true && city) {
        try {
          const openBookings = await base44.entities.Booking.filter({
            city: city,
            state: 'open',
          });

          console.log(`📢 Found ${openBookings.length} open bookings in ${city}`);

          for (const booking of openBookings) {
            await base44.entities.Notification.create({
              recipient_email: updatedUser.email,
              recipient_type: 'host',
              type: 'booking_request',
              title: `Booking Request in ${booking.city}`,
              message: `A traveler needs help in ${booking.city} from ${booking.start_date} to ${booking.end_date}`,
              link: `/HostDashboard`,
              related_booking_id: booking.id,
              read: false,
            });
          }

          console.log(` Notified new host about ${openBookings.length} open bookings`);
        } catch (error) {
          console.error('⚠️ Failed to notify about existing bookings:', error);
        }
      }

      return updatedUser;
    },
    onMutate: ({ userId }) => {
      setUpdatingUserId(userId);
    },
    onSuccess: (updatedUser, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allHosts'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['allOffices'] });

      //  Show toast only once based on action
      if (action === 'approve_host') {
        toast.success(` Host approved and linked to city.`);
      } else if (action === 'revoke_host') {
        toast.success(` Host access removed.`);
      } else if (action === 'make_admin') {
        toast.success(`🔒 User is now an Admin (all other roles removed).`);
      } else if (action === 'revoke_admin') {
        toast.success(`User is no longer an Admin.`);
      } else if (action === 'revoke_office') {
        toast.success(`User is no longer an office manager.`);
      } else if (action === 'make_office') {
        toast.success(`🏢 User assigned to office.`);
      } else if (action === 'make_marketing') {
        toast.success(`📊 User is now Marketing (all other roles removed).`);
      } else if (action === 'revoke_marketing') {
        toast.success(`User is no longer Marketing.`);
      } else {
        // Generic success for other actions
        toast.success(`Roles updated for ${updatedUser.full_name || updatedUser.email}`);
      }
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message || 'An unknown error occurred'}`);
    },
    onSettled: () => {
      setUpdatingUserId(null);
    },
  });

  const handleOpenPermissions = (user) => {
    setPermissionsUser(user);
  };

  //  إضافة دالة لفتح ملف المضيف
  const handlePreviewProfile = (user) => {
    if (!user?.host_approved) {
      toast.error('This user is not a host');
      return;
    }

    // Navigate to host profile page, assuming the route is '/host-profile' and takes email as a query parameter
    navigate(`/host-profile?email=${encodeURIComponent(user.email)}`);
  };

  const handleDeleteUser = async () => {
    if (!selectedUserToDelete) return;
    try {
      // Call server API to delete from both Firebase Auth and Firestore
      // This uses Firebase Admin SDK on the server which has permission to delete other users
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${selectedUserToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete user');
      }

      await logAuditAction(currentUser?.email, 'delete_user', selectedUserToDelete.email, {
        userId: selectedUserToDelete.id,
      });

      toast.success(
        `User ${selectedUserToDelete.full_name || selectedUserToDelete.email} deleted from both Auth and Firestore.`
      );
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowDeleteConfirm(false);
      setSelectedUserToDelete(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
      setShowDeleteConfirm(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => {
        if (roleFilter === 'admin') return user.role_type === 'admin' || user.role === 'admin';
        if (roleFilter === 'host') return user.host_approved;
        if (roleFilter === 'office') return user.role_type === 'office';
        if (roleFilter === 'marketing') return user.role_type === 'marketing';
        if (roleFilter === 'user')
          return (
            (!user.role_type || user.role_type === 'user') &&
            !user.host_approved &&
            user.role !== 'admin'
          );
        return true;
      });
    }

    if (cityFilter) {
      filtered = filtered.filter((user) =>
        user.city?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(lowercasedQuery) ||
          user.full_name?.toLowerCase().includes(lowercasedQuery)
      );
    }
    return filtered;
  }, [users, searchQuery, roleFilter, cityFilter]);

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
    <PermissionGuard pageId='users'>
      <AdminLayout>
        <div className='space-y-6'>
        <Card className='bg-gradient-to-r from-[#330066] to-[#5C00B8] text-white shadow-2xl'>
          <CardHeader>
            <CardTitle className='text-slate-50 text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-3'>
              <Users className='w-6 h-6 sm:w-7 sm:h-7' />
              Manage All Users ({users?.length || 0})
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex flex-col gap-3 sm:gap-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by name or email...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base'
                />
              </div>
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3'>
                <div className='flex items-center gap-2 flex-1'>
                  <Filter className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0' />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className='h-10 sm:h-11 text-sm sm:text-base'>
                      <SelectValue placeholder='Filter by role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Roles</SelectItem>
                      <SelectItem value='admin'>Admins</SelectItem>
                      <SelectItem value='host'>Hosts</SelectItem>
                      <SelectItem value='office'>Office Managers</SelectItem>
                      <SelectItem value='marketing'>Marketing</SelectItem>{' '}
                      {/* Added Marketing to filter */}
                      <SelectItem value='user'>Regular Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='relative flex-1'>
                  <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400' />
                  <Input
                    type='text'
                    placeholder='Filter by city...'
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className='pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base'
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-3 sm:space-y-4'>
            <div className='space-y-3 sm:space-y-4'>
              {filteredUsers.map((user, index) => {
                const isHost = user.host_approved;
                const isAdmin = user.role_type === 'admin' || user.role === 'admin';
                const isOffice = user.role_type === 'office';
                const isMarketing = user.role_type === 'marketing'; // Added for Marketing role
                const userCity = user.city;

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className='bg-white rounded-xl border border-gray-200/80 p-3 sm:p-4 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300'
                  >
                    <div className='flex flex-col gap-3 sm:gap-4'>
                      {/* User Info Row */}
                      <div className='flex items-center gap-3 sm:gap-4'>
                        <div className='relative flex-shrink-0'>
                          {user.profile_photo ? (
                            <img
                              src={user.profile_photo}
                              alt={user.full_name}
                              className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-offset-2 ring-purple-100'
                              loading='lazy'
                            />
                          ) : (
                            <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#9933CC] to-[#330066] flex items-center justify-center text-white font-bold text-sm sm:text-lg ring-2 ring-offset-2 ring-purple-100'>
                              {(user.full_name?.charAt(0) || user.email?.charAt(0))?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-bold text-gray-800 text-sm sm:text-base lg:text-lg truncate'>
                            {user.full_name || 'No Name'}
                          </h4>
                          <p className='text-xs sm:text-sm text-gray-500 truncate'>{user.email}</p>
                          <div className='flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap'>
                            {isAdmin && (
                              <Badge
                                variant='outline'
                                className='bg-purple-50 text-purple-700 border-purple-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5'
                              >
                                <Shield className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1' />
                                Admin
                              </Badge>
                            )}
                            {isMarketing && (
                              <Badge
                                variant='outline'
                                className='bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5'
                              >
                                <BarChart3 className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1' />
                                Marketing
                              </Badge>
                            )}{' '}
                            {/* Marketing Badge */}
                            {isOffice && (
                              <Badge
                                variant='outline'
                                className='bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5'
                              >
                                <Building2 className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1' />
                                Office {user.company_name ? `• ${user.company_name}` : ''}
                              </Badge>
                            )}
                            {isHost && (
                              <Badge
                                variant='outline'
                                className='bg-green-50 text-green-700 border-green-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5'
                              >
                                <UserCheck className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1' />
                                Host {userCity ? `• ${userCity}` : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className='flex-shrink-0'>
                        {updatingUserId === user.id ? (
                          <div className='flex items-center justify-center w-full h-full min-h-[36px]'>
                            <Loader2 className='w-5 h-5 sm:w-6 sm:h-6 animate-spin text-purple-600' />
                          </div>
                        ) : (
                          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1.5 sm:gap-2'>
                            {' '}
                            {/* Changed to lg:grid-cols-7 */}
                            {/*  Preview Profile Button */}
                            {isHost && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handlePreviewProfile(user)}
                                className='flex items-center justify-center gap-1 sm:gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3'
                              >
                                <Eye className='w-3 h-3 sm:w-4 sm:h-4' />
                                <span className='font-semibold hidden sm:inline'>
                                  Preview Profile
                                </span>
                                <span className='font-semibold sm:hidden'>Profile</span>
                              </Button>
                            )}
                            {isHost ? (
                              <Button
                                size='sm'
                                onClick={() => {
                                  updateUserMutation.mutate({
                                    userId: user.id,
                                    updates: {
                                      host_approved: false,
                                      visible_in_city: false,
                                      city: null,
                                      assigned_cities: [],
                                    },
                                    action: 'revoke_host',
                                    affectedUserEmail: user.email,
                                  });
                                }}
                                className='flex items-center justify-center gap-1 sm:gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3'
                              >
                                <UserX className='w-3 h-3 sm:w-4 sm:h-4' />
                                <span className='font-semibold hidden sm:inline'>Revoke Host</span>
                                <span className='font-semibold sm:hidden'>Revoke</span>
                              </Button>
                            ) : (
                              <Button
                                size='sm'
                                onClick={() => setUserToApprove(user)}
                                disabled={isAdmin || isMarketing} // Disabled if Marketing
                                className='flex items-center justify-center gap-1 sm:gap-1.5 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3'
                              >
                                <UserPlus className='w-3 h-3 sm:w-4 sm:h-4' />
                                <span className='font-semibold hidden sm:inline'>Approve Host</span>
                                <span className='font-semibold sm:hidden'>Approve</span>
                              </Button>
                            )}
                            {hasFullAccess && (
                              <>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => {
                                    if (isAdmin) {
                                      updateUserMutation.mutate({
                                        userId: user.id,
                                        updates: {
                                          role: 'user',
                                          role_type: 'user',
                                          admin_access_type: null,
                                        },
                                        action: 'revoke_admin',
                                        affectedUserEmail: user.email,
                                      });
                                    } else {
                                      updateUserMutation.mutate({
                                        userId: user.id,
                                        updates: {
                                          role: 'admin',
                                          role_type: 'admin',
                                          admin_access_type: 'full',
                                        },
                                        action: 'make_admin',
                                        affectedUserEmail: user.email,
                                      });
                                    }
                                  }}
                                  className={cn(
                                    'flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3',
                                    isAdmin && 'bg-purple-50 border-purple-200'
                                  )}
                                >
                                  <Shield className='w-3 h-3 sm:w-4 sm:h-4' />
                                  <span className='font-semibold'>
                                    {isAdmin ? 'Revoke' : 'Admin'}
                                  </span>
                                </Button>

                                {/* Marketing Role Button */}
                                <Button
                                  size='sm'
                                  variant='outline'
                                  disabled={isAdmin} // Disabled if admin
                                  title={isAdmin ? 'Admins cannot be Marketing.' : ''}
                                  onClick={() => {
                                    if (isMarketing) {
                                      updateUserMutation.mutate({
                                        userId: user.id,
                                        updates: { role_type: 'user' }, // Revoke marketing role
                                        action: 'revoke_marketing',
                                        affectedUserEmail: user.email,
                                      });
                                    } else {
                                      updateUserMutation.mutate({
                                        userId: user.id,
                                        updates: { role_type: 'marketing' }, // Set marketing role
                                        action: 'make_marketing',
                                        affectedUserEmail: user.email,
                                      });
                                    }
                                  }}
                                  className={cn(
                                    'flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3',
                                    isMarketing && 'bg-blue-50 border-blue-200',
                                    isAdmin && 'cursor-not-allowed opacity-50'
                                  )}
                                >
                                  <BarChart3 className='w-3 h-3 sm:w-4 sm:h-4' />
                                  <span className='font-semibold'>
                                    {isMarketing ? 'Revoke' : 'Marketing'}
                                  </span>
                                </Button>

                                <Button
                                  size='sm'
                                  variant='outline'
                                  disabled={isAdmin}
                                  title={isAdmin ? 'Admins cannot be assigned to an office.' : ''}
                                  onClick={() => {
                                    if (isOffice) {
                                      updateUserMutation.mutate({
                                        userId: user.id,
                                        updates: {
                                          role_type: 'user',
                                          company_name: null,
                                          office_id: null,
                                        },
                                        action: 'revoke_office',
                                        affectedUserEmail: user.email,
                                      });
                                    } else {
                                      setUserToAssignOffice(user);
                                    }
                                  }}
                                  className={cn(
                                    'flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3',
                                    isOffice && 'bg-blue-50 border-blue-200',
                                    isAdmin && 'cursor-not-allowed opacity-50'
                                  )}
                                >
                                  <Building2 className='w-3 h-3 sm:w-4 sm:h-4' />
                                  <span className='font-semibold'>
                                    {isOffice ? 'Revoke' : 'Office'}
                                  </span>
                                </Button>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3'
                                  onClick={() => handleOpenPermissions(user)}
                                >
                                  <Lock className='w-3 h-3 sm:w-4 sm:h-4' />
                                  <span className='font-semibold hidden lg:inline'>
                                    Permissions
                                  </span>
                                  <span className='font-semibold lg:hidden'>Perms</span>
                                </Button>
                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => {
                                    setSelectedUserToDelete(user);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className='flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3'
                                >
                                  <Trash2 className='w-3 h-3 sm:w-4 sm:h-4' />
                                  <span className='font-semibold'>Delete</span>
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <ApproveHostDialog
        user={userToApprove}
        isOpen={!!userToApprove}
        onClose={() => setUserToApprove(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['allUsers'] });
          setUserToApprove(null);
        }}
      />

      <AssignOfficeDialog
        user={userToAssignOffice}
        isOpen={!!userToAssignOffice}
        onClose={() => setUserToAssignOffice(null)}
        onConfirm={(office) => {
          if (userToAssignOffice) {
            updateUserMutation.mutate({
              userId: userToAssignOffice.id,
              updates: {},
              officeData: office,
              action: 'make_office',
              affectedUserEmail: userToAssignOffice.email,
            });
          }
          setUserToAssignOffice(null);
        }}
      />

      {permissionsUser && (
        <AdminPermissionsDialog
          user={permissionsUser}
          isOpen={!!permissionsUser}
          onClose={() => setPermissionsUser(null)}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className='space-y-2'>
              <p>
                This will permanently delete{' '}
                <span className='font-semibold'>
                  {selectedUserToDelete?.full_name || selectedUserToDelete?.email}
                </span>{' '}
                from both Firebase Authentication and Firestore.
              </p>
              <p className='text-red-600 font-medium'>
                ⚠️ This action cannot be undone. The user will be completely removed from the system.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedUserToDelete(null);
                setShowDeleteConfirm(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </AdminLayout>
    </PermissionGuard>
  );
}
