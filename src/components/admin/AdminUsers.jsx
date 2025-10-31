
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreVertical, Search, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX, Building2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminPermissionsDialog from './AdminPermissionsDialog';
import ApproveHostDialog from './ApproveHostDialog';
import AssignOfficeDialog from './AssignOfficeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ name: '', role: 'all', hostStatus: 'all', city: 'all' });
  const [sort, setSort] = useState({ by: 'created_date', dir: 'desc' });
  
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);

  // Replaced isApproveHostDialogOpen and selectedUserForApproval
  const [userToApprove, setUserToApprove] = useState(null);
  const [isApproveDialogOpen, setApproveDialogOpen] = useState(false);
  
  const [userToRevoke, setUserToRevoke] = useState(null);
  const [isRevokeAlertOpen, setRevokeAlertOpen] = useState(false);
  
  const [isAssignOfficeDialogOpen, setIsAssignOfficeDialogOpen] = useState(false);
  const [selectedUserForOffice, setSelectedUserForOffice] = useState(null);
  
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allAdminUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
    refetchInterval: 5000,
  });

  const { data: offices = [] } = useQuery({
    queryKey: ['allOffices'],
    queryFn: () => base44.entities.Office.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      setUpdatingUserId(userId);
      return base44.entities.User.update(userId, data);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      toast.success(`User ${updatedUser.full_name || updatedUser.email} updated successfully.`);
    },
    onError: (error, variables) => {
      toast.error(`Failed to update user: ${error.message}`);
      base44.entities.ErrorLog.create({
        section: "AdminUsersMutation",
        message: error.message,
        user_email: variables.userId,
        details: JSON.stringify(error)
      });
    },
    onSettled: () => {
      setUpdatingUserId(null);
    }
  });

  const updateOfficeHostCountMutation = useMutation({
    mutationFn: async (officeId) => {
      if (!officeId) return; // Only proceed if an officeId is provided
      const officeHosts = await base44.entities.User.filter({ office_id: officeId, host_approved: true });
      return base44.entities.Office.update(officeId, { total_hosts: officeHosts.length });
    },
    onSuccess: (updatedOffice) => {
      if (updatedOffice) {
        queryClient.invalidateQueries({ queryKey: ['allOffices'] });
        queryClient.invalidateQueries({ queryKey: ['officeHosts', updatedOffice.id] });
        queryClient.invalidateQueries({ queryKey: ['officeOverview', updatedOffice.id] });
      }
    },
    onError: (error) => {
      console.error('Failed to update office host count:', error);
      toast.error('Failed to update office host count.');
    }
  });

  // EXISTING revokeHostMutation (modified to ensure only toast is used, and aligned with updateOfficeHostCountMutation)
  const revokeHostMutation = useMutation({
    mutationFn: async (userId) => {
      // Fetch user's current state to get old office ID before updating
      const userToUpdate = await base44.entities.User.get(userId);
      const oldOfficeId = userToUpdate.office_id;
      const oldCity = userToUpdate.city;

      const updatedUser = await base44.entities.User.update(userId, { 
        host_approved: false, 
        visible_in_city: false, 
        city: null, 
        office_id: null, 
        company_name: null, 
        role_type: 'user' 
      });
      
      // Update office host count if the user was assigned to an office
      if (oldOfficeId) {
        updateOfficeHostCountMutation.mutate(oldOfficeId);
      }
      return { updatedUser, oldCity, oldOfficeId }; // Return old info for onSuccess invalidation
    },
    onSuccess: ({ updatedUser, oldCity, oldOfficeId }) => {
      toast.success(`Host access revoked for ${updatedUser.full_name || updatedUser.email}`);
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      if (oldCity) {
          queryClient.invalidateQueries({ queryKey: ['hosts', oldCity] });
      }
      // Invalidation for office queries is handled by updateOfficeHostCountMutation's onSuccess
    },
    onError: (error) => {
      toast.error('Failed to revoke host access.');
      console.error('Host revocation error:', error);
    },
    onSettled: () => {
        setUpdatingUserId(null); // Ensure loading state is reset
    }
  });

  // NEW/REFACTORED MUTATIONS AS PER OUTLINE (corrected for admin panel functionality)
  const makeAdminMutation = useMutation({
    mutationFn: async (userId) => {
      setUpdatingUserId(userId);
      console.log('🔐 Making user admin:', userId);
      const userToUpdate = await base44.entities.User.get(userId);

      const updates = {
        role: 'admin', // Make them a full admin
        admin_access_type: null,
        admin_allowed_pages: []
      };

      // If they were a host, revoke host status and clear related fields
      if (userToUpdate.host_approved) {
        updates.host_approved = false;
        updates.visible_in_city = false;
        updates.city = null;
        updates.office_id = null;
        updates.company_name = null;
        // Trigger office count update if they were a host in an office
        if (userToUpdate.office_id) {
            updateOfficeHostCountMutation.mutate(userToUpdate.office_id);
        }
      }
      // If they were an office manager, their primary role_type becomes 'admin'
      if (userToUpdate.role_type === 'office' || userToUpdate.role_type === 'host') {
        updates.role_type = 'admin'; 
      }
      
      return base44.entities.User.update(userId, updates);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      toast.success(`🔐 User ${updatedUser.full_name || updatedUser.email} is now a Full Admin (other specific roles removed).`);
    },
    onError: (error) => {
      toast.error('Failed to make user admin');
      console.error('❌ Make admin error:', error);
    },
    onSettled: () => {
      setUpdatingUserId(null);
    }
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId) => {
      setUpdatingUserId(userId);
      console.log('🔓 Revoking admin from user:', userId);
      // Revoke full admin status, revert to 'user' role, clear admin access fields
      return base44.entities.User.update(userId, { role: 'user', admin_access_type: null, admin_allowed_pages: [] });
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      toast.success(`Admin role revoked for ${updatedUser.full_name || updatedUser.email}.`);
    },
    onError: (error) => {
      toast.error('Failed to revoke admin');
      console.error('❌ Revoke admin error:', error);
    },
    onSettled: () => {
      setUpdatingUserId(null);
    }
  });

  const approveHostMutation = useMutation({
    mutationFn: async ({ userId, city, officeId, companyName }) => {
      setUpdatingUserId(userId);
      console.log('✅ Approving host:', { userId, city, officeId, companyName });
      
      const updates = {
        host_approved: true,
        visible_in_city: true,
        city: city,
        role_type: 'host', // Ensure role_type is host
        office_id: officeId || null, // Ensure null if not selected
        company_name: companyName || null // Ensure null if not selected
      };
      
      const updatedUser = await base44.entities.User.update(userId, updates);
      
      // Update office host count if assigned to an office
      if (officeId) {
          updateOfficeHostCountMutation.mutate(officeId);
      }
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      toast.success(`✅ ${updatedUser.full_name || updatedUser.email} is now a Host`);
      setApproveDialogOpen(false); // Close dialog here after success
    },
    onError: (error) => {
      toast.error('Failed to approve host');
      console.error('❌ Approve host error:', error);
    },
    onSettled: () => {
      setUpdatingUserId(null);
    }
  });

  const makeOfficeMutation = useMutation({
    mutationFn: async (userId) => {
      setUpdatingUserId(userId);
      console.log('🏢 Making user office manager:', userId);
      const userToUpdate = await base44.entities.User.get(userId);

      const updates = { role_type: 'office' };

      // If they were a host, revoke host status and clear related fields
      if (userToUpdate.host_approved) {
        updates.host_approved = false;
        updates.visible_in_city = false;
        updates.city = null;
        updates.office_id = null;
        updates.company_name = null;
        // Trigger office count update if they were a host in an office
        if (userToUpdate.office_id) {
            updateOfficeHostCountMutation.mutate(userToUpdate.office_id);
        }
      }
      // If the user was a full admin, demote them to a regular user role when becoming an office manager
      if (userToUpdate.role === 'admin' && userToUpdate.admin_access_type !== 'limited') {
          updates.role = 'user';
          updates.admin_access_type = null;
          updates.admin_allowed_pages = [];
      }

      return base44.entities.User.update(userId, updates);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      toast.success(`🏢 User ${updatedUser.full_name || updatedUser.email} is now an Office Manager`);
    },
    onError: (error) => {
      toast.error('Failed to make user office manager');
      console.error('❌ Make office error:', error);
    },
    onSettled: () => {
      setUpdatingUserId(null);
    }
  });

  const revokeOfficeMutation = useMutation({
    mutationFn: async (userId) => {
      setUpdatingUserId(userId);
      console.log('🔓 Revoking office manager role from user:', userId);
      return base44.entities.User.update(userId, { role_type: 'user' });
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      toast.success(`Office manager role revoked for ${updatedUser.full_name || updatedUser.email}.`);
    },
    onError: (error) => {
      toast.error('Failed to revoke office manager role');
      console.error('❌ Revoke office error:', error);
    },
    onSettled: () => {
      setUpdatingUserId(null);
    }
  });
  // END NEW/REFACTORED MUTATIONS

  const handleRevokeHost = async () => {
    if (!userToRevoke) return;

    setUpdatingUserId(userToRevoke.id); // Set loading state for the specific user

    try {
      const currentUser = await base44.auth.me();
      await base44.entities.AuditLog.create({
        admin_email: currentUser.email,
        action: 'revoke_host',
        affected_user_email: userToRevoke.email,
      });
    } catch(e) {
        console.warn("Failed to log audit action for host revocation", e);
    }

    revokeHostMutation.mutate(userToRevoke.id);
    setRevokeAlertOpen(false);
    setUserToRevoke(null);
  };

  const handleOpenPermissionsDialog = (user) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleOpenAssignOfficeDialog = (user) => {
    setSelectedUserForOffice(user);
    setIsAssignOfficeDialogOpen(true);
  };

  const handleOpenApproveDialog = (user) => {
    setUserToApprove(user);
    setApproveDialogOpen(true);
  };
  
  const handleOpenRevokeAlert = (user) => {
    setUserToRevoke(user);
    setRevokeAlertOpen(true);
  };

  const getOfficeName = (officeId) => {
    if (!offices || !officeId) return 'N/A';
    const office = offices.find(o => o.id === officeId);
    return office ? office.name : 'N/A';
  };

  const filteredAndSortedUsers = useMemo(() => {
    let users = [...allUsers];

    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      users = users.filter(user =>
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.role !== 'all') {
        if (filters.role === 'limited_admin') {
            users = users.filter(user => user.admin_access_type === 'limited');
        } else if (filters.role === 'full_admin') {
            users = users.filter(user => user.role === 'admin' && user.admin_access_type !== 'limited');
        } else if (filters.role === 'office_limited_admin') {
            users = users.filter(user => user.role === 'admin' && Array.isArray(user.admin_allowed_pages) && user.admin_allowed_pages.includes('OfficeDashboard'));
        } else {
            users = users.filter(user => user.role_type === filters.role || user.role === filters.role);
        }
    }

    if (filters.hostStatus !== 'all') {
      const isApproved = filters.hostStatus === 'approved';
      users = users.filter(user => !!user.host_approved === isApproved);
    }
    
    if (filters.city !== 'all') {
        users = users.filter(user => user.city === filters.city);
    }

    users.sort((a, b) => {
      const aVal = a[sort.by];
      const bVal = b[sort.by];
      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return users;
  }, [allUsers, filters, sort]);

  const uniqueCities = useMemo(() => {
    const cities = new Set(allUsers.map(u => u.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [allUsers]);

  if (usersLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Users ({allUsers.length})</CardTitle>
            <CardDescription>View, edit, and manage all users in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email"
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                <SelectTrigger><SelectValue placeholder="Filter by role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Full Admin</SelectItem>
                  <SelectItem value="limited_admin">Limited Admin</SelectItem>
                  <SelectItem value="office_limited_admin">Office-scoped Admin</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="user">Traveler</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.hostStatus} onValueChange={(value) => setFilters({ ...filters, hostStatus: value })}>
                <SelectTrigger><SelectValue placeholder="Filter by host status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Host Statuses</SelectItem>
                  <SelectItem value="approved">Host Approved</SelectItem>
                  <SelectItem value="not_approved">Not a Host</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.city} onValueChange={(value) => setFilters({ ...filters, city: value })}>
                <SelectTrigger><SelectValue placeholder="Filter by city" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold hidden md:table-cell">Role</th>
                    <th className="text-left p-3 font-semibold hidden lg:table-cell">Status</th>
                    <th className="text-left p-3 font-semibold hidden lg:table-cell">Details</th>
                    <th className="text-right p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-bold">{user.full_name || 'N/A'}</div>
                        <div className="text-gray-500">{user.email}</div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {user.role === 'admin' && user.admin_access_type !== 'limited' && <Badge variant="destructive">Admin</Badge>}
                          {user.admin_access_type === 'limited' && <Badge variant="secondary">Limited Admin</Badge>}
                          {user.role_type === 'office' && <Badge className="bg-blue-100 text-blue-800">Office</Badge>}
                          {user.role_type === 'host' && <Badge className="bg-purple-100 text-purple-800">Host</Badge>}
                          {user.role === 'user' && user.role_type === 'user' && <Badge variant="outline">Traveler</Badge>}
                        </div>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {user.host_approved ? (
                          <Badge className="bg-green-100 text-green-800">Host Approved</Badge>
                        ) : (
                          <Badge variant="outline">Not a Host</Badge>
                        )}
                        {user.visible_in_city && <Badge className="bg-green-100 text-green-800 ml-1">Visible</Badge>}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {user.city && <div>City: {user.city}</div>}
                        {user.office_id && (
                            <div>Office: {getOfficeName(user.office_id)}</div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {updatingUserId === user.id ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {/* --- Office Assignment --- */}
                              {user.host_approved && (
                                <DropdownMenuItem onSelect={() => handleOpenAssignOfficeDialog(user)}>
                                  <Building2 className="mr-2 h-4 w-4" />
                                  <span>Assign/Change Office</span>
                                </DropdownMenuItem>
                              )}

                              {/* --- Admin Roles --- */}
                              {user.role !== 'admin' || user.admin_access_type === 'limited' ? ( // Check for full admin status
                                <DropdownMenuItem onSelect={() => makeAdminMutation.mutate(user.id)}>
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  <span>Make Full Admin</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => revokeAdminMutation.mutate(user.id)}>
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  <span>Revoke Admin</span>
                                </DropdownMenuItem>
                              )}
                              
                              {/* --- Limited Admin --- */}
                              <DropdownMenuItem onSelect={() => handleOpenPermissionsDialog(user)}>
                                <Settings2 className="mr-2 h-4 w-4" />
                                <span>Set Limited Access</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {/* --- Host Roles --- */}
                              {user.host_approved ? (
                                <DropdownMenuItem onSelect={() => handleOpenRevokeAlert(user)} 
                                    disabled={revokeHostMutation.isPending && userToRevoke?.id === user.id}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  <span>Revoke Host Access</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => handleOpenApproveDialog(user)}
                                    disabled={approveHostMutation.isPending && updatingUserId === user.id}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  <span>Approve as Host</span>
                                </DropdownMenuItem>
                              )}
                              
                              {/* --- Office Roles --- */}
                              {user.role_type !== 'office' ? (
                                <DropdownMenuItem onSelect={() => makeOfficeMutation.mutate(user.id)}>
                                  <Building2 className="mr-2 h-4 w-4" />
                                  <span>Make Office Manager</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => revokeOfficeMutation.mutate(user.id)}>
                                  <Building2 className="mr-2 h-4 w-4" />
                                   <span>Revoke Office Role</span>
                                </DropdownMenuItem>
                              )}


                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onSelect={() => alert('Delete feature coming soon')}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete User</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <AdminPermissionsDialog
          user={selectedUserForPermissions}
          isOpen={isPermissionsDialogOpen}
          onClose={() => setIsPermissionsDialogOpen(false)}
          onSave={(userId, permissions) => {
            updateUserMutation.mutate({
              userId,
              data: {
                role: 'admin', // A limited user is still an admin technically
                admin_access_type: 'limited',
                admin_allowed_pages: permissions
              }
            });
            setIsPermissionsDialogOpen(false);
          }}
        />

        {/* Updated ApproveHostDialog props to use the new approveHostMutation */}
        <ApproveHostDialog
          user={userToApprove}
          isOpen={isApproveDialogOpen}
          onClose={() => setApproveDialogOpen(false)}
          onApprove={(userId, city, officeId, companyName) => { 
            approveHostMutation.mutate({ userId, city, officeId, companyName });
            // The dialog will close on approveHostMutation's onSuccess
          }}
        />

        <AssignOfficeDialog
          user={selectedUserForOffice}
          isOpen={isAssignOfficeDialogOpen}
          onClose={() => setIsAssignOfficeDialogOpen(false)}
          onSave={(userId, officeId, officeName, oldOfficeId) => { // oldOfficeId passed to handle stats
            updateUserMutation.mutate({ userId, data: { office_id: officeId, company_name: officeName } });
            
            // Update counts for both old and new offices
            if (oldOfficeId && oldOfficeId !== officeId) {
                updateOfficeHostCountMutation.mutate(oldOfficeId);
            }
            if (officeId) {
                updateOfficeHostCountMutation.mutate(officeId);
            }
            setIsAssignOfficeDialogOpen(false);
          }}
        />

        {/* New AlertDialog for host revocation */}
        <AlertDialog open={isRevokeAlertOpen} onOpenChange={setRevokeAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will revoke host access for <span className="font-bold">{userToRevoke?.email}</span>. They will no longer appear on city pages or receive booking requests. Their associated city and office will also be removed, and their role will revert to a general user. This action can be reversed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={revokeHostMutation.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRevokeHost}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={revokeHostMutation.isPending}
                >
                  {revokeHostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Yes, Revoke Access
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
