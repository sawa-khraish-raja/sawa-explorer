import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, updateDocument } from '@/utils/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ApproveHostDialog({ isOpen, onClose, user, onSuccess }) {
  const queryClient = useQueryClient();

  const [hostType, setHostType] = useState('freelancer');
  const [city, setCity] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (user) {
      setHostType(user.host_type || 'freelancer');
      setCity(user.city || '');
      setOfficeId(user.office_id || '');
      setVisible(user.visible_in_city ?? true);
    }
  }, [user]);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => getAllDocuments('cities'),
  });

  // Note: Offices collection not yet migrated to Firestore
  const { data: offices = [] } = useQuery({
    queryKey: ['offices'],
    queryFn: () => getAllDocuments('offices'),
    enabled: hostType === 'office',
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!city) throw new Error('Please select a city');
      if (hostType === 'office' && !officeId) throw new Error('Please select an office');

      console.log('✅ Approving host:', {
        userId: user.id,
        email: user.email,
        hostType,
        city,
        officeId,
      });

      // Update user document with host approval
      const userData = {
        host_approved: true,
        host_type: hostType,
        city: city,
        visible_in_city: visible,
        role_type: 'host',
        office_id: hostType === 'office' ? officeId : null,
        company_name: hostType === 'office' ? offices.find((o) => o.id === officeId)?.name : null,
        updated_date: new Date().toISOString(),
      };

      await updateDocument('users', user.id, userData);

      console.log('✅ User approved as host successfully');
      return true;
    },
    onSuccess: () => {
      //  NO TOAST HERE - let parent handle it
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allHosts'] });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Approve Host: {user?.full_name || user?.email}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Host Type */}
          <div>
            <Label>Host Type</Label>
            <Select value={hostType} onValueChange={setHostType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='freelancer'>Freelancer (35% SAWA)</SelectItem>
                <SelectItem value='office'>Office (28% SAWA + 7% Office)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div>
            <Label>City *</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder='Select city...' />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Office (if type = office) */}
          {hostType === 'office' && (
            <div>
              <Label>Office *</Label>
              <Select value={officeId} onValueChange={setOfficeId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select office...' />
                </SelectTrigger>
                <SelectContent>
                  {offices.length === 0 ? (
                    <div className='p-4 text-sm text-gray-500'>No offices available</div>
                  ) : (
                    offices.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name} - {o.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Visible */}
          <div className='flex items-center gap-2'>
            <Checkbox checked={visible} onCheckedChange={setVisible} id='visible' />
            <Label htmlFor='visible'>Visible in city page</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className='bg-green-600 hover:bg-green-700'
          >
            {approveMutation.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            Approve Host
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
