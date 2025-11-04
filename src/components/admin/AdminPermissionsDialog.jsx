import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Added import
import { updateDocument } from '@/utils/firestore';

import { useAppContext } from '../context/AppContext';



import { ADMIN_PAGES } from './PermissionGuard';

// Transform ADMIN_PAGES object into an array of page objects for easier mapping in the UI
const ALL_PAGES = Object.values(ADMIN_PAGES);

export default function AdminPermissionsDialog({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAppContext();
  const [currentPermissions, setCurrentPermissions] = useState([]);
  const [accessType, setAccessType] = useState('full');

  useEffect(() => {
    if (user) {
      setAccessType(user.admin_access_type || 'full');
      setCurrentPermissions(
        Array.isArray(user.admin_allowed_pages) ? user.admin_allowed_pages : []
      );
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (updateData) => {
      if (!user) return;
      await updateDocument('users', user.id, {
        ...updateData,
        updated_date: new Date().toISOString(),
      });
      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAdminUsers'] });
      toast.success('Permissions updated successfully!');
      onClose();
    },
    onError: (error) => {
      console.error('Failed to update permissions:', error);
      toast.error('Failed to update permissions.');
    },
  });

  const handleTogglePermission = (pageId) => {
    // Renamed from handleTogglePage
    setCurrentPermissions((prev) =>
      prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId]
    );
  };

  const handleSave = () => {
    if (accessType === 'limited' && currentPermissions.length === 0) {
      // Adapted to currentPermissions
      toast.error('Please select at least one page for limited access.');
      return;
    }

    const updateData = {
      admin_access_type: accessType,
      admin_allowed_pages: accessType === 'limited' ? currentPermissions : [], // Adapted to currentPermissions
    };

    updateUserMutation.mutate(updateData); // Renamed mutation call
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-xl'>
        {' '}
        {/* Changed max-width and removed overflow classes */}
        <DialogHeader>
          <DialogTitle>Manage Permissions for {user.full_name || user.email}</DialogTitle>{' '}
          {/* Changed title */}
          <DialogDescription>
            Control which sections of the admin panel this user can access.{' '}
            {/* Changed description */}
          </DialogDescription>
        </DialogHeader>
        <div className='py-4 space-y-4'>
          <RadioGroup value={accessType} onValueChange={setAccessType}>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='full' id='full-access' />
              <Label htmlFor='full-access'>Full Access</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='limited' id='limited-access' />
              <Label htmlFor='limited-access'>Limited Access</Label>
            </div>
          </RadioGroup>

          {accessType === 'limited' && (
            <div className='space-y-2 pt-4'>
              <h4 className='font-semibold'>Allowed Pages</h4>
              <div className='grid grid-cols-2 gap-2'>
                {ALL_PAGES.map((page) => (
                  <div key={page.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={page.id}
                      checked={currentPermissions.includes(page.id)}
                      onCheckedChange={() => handleTogglePermission(page.id)}
                    />
                    <label
                      htmlFor={page.id}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {page.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}{' '}
            {/* Changed button text and removed icons */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
