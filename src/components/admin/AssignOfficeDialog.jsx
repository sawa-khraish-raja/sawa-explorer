import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AssignOfficeDialog({ user, isOpen, onClose, onConfirm }) {
  const queryClient = useQueryClient();
  const [selectedOfficeId, setSelectedOfficeId] = useState('');

  const { data: offices = [], isLoading } = useQuery({
    queryKey: ['allOfficesForSelect'],
    queryFn: () => base44.entities.Office.list(),
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedOfficeId('');
    }
  }, [isOpen]);

  //  Mutation to assign office
  const assignOfficeMutation = useMutation({
    mutationFn: async (officeData) => {
      // Update user with office info
      await base44.entities.User.update(user.id, {
        role_type: 'office',
        office_id: officeData.id,
        company_name: officeData.name,
        role: 'user',
      });

      // Update office to include this host
      const currentAssignedHosts = officeData.assigned_hosts || [];
      if (!currentAssignedHosts.includes(user.email)) {
        await base44.entities.Office.update(officeData.id, {
          assigned_hosts: [...currentAssignedHosts, user.email],
          total_hosts: (officeData.total_hosts || 0) + 1,
        });
      }

      return officeData;
    },
    onSuccess: (officeData) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allOffices'] });
      queryClient.invalidateQueries({ queryKey: ['officeCurrentHosts'] });
      toast.success(` ${user.full_name || user.email} assigned to ${officeData.name}`);
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to assign office: ${error.message}`);
    },
  });

  const handleConfirm = () => {
    const selectedOffice = offices.find((o) => o.id === selectedOfficeId);
    if (selectedOffice) {
      assignOfficeMutation.mutate(selectedOffice);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Building2 className='w-6 h-6 text-blue-600' />
            Assign User to Office
          </DialogTitle>
          <DialogDescription>
            Select an office to assign{' '}
            <span className='font-bold'>{user.full_name || user.email}</span> to.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4 space-y-4'>
          {user.office_id && (
            <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2'>
              <AlertCircle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
              <p className='text-sm text-amber-800'>
                This user is currently assigned to an office. Assigning a new office will update
                their assignment.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor='office-select' className='text-sm font-semibold'>
              Available Offices
            </Label>
            {isLoading ? (
              <div className='flex items-center justify-center h-24'>
                <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
              </div>
            ) : (
              <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                <SelectTrigger id='office-select' className='mt-2'>
                  <SelectValue placeholder='Select an office...' />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name} ({office.city}) - {office.total_hosts || 0} hosts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOfficeId || isLoading || assignOfficeMutation.isPending}
            className='bg-blue-600 hover:bg-blue-700'
          >
            {assignOfficeMutation.isPending ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Assigning...
              </>
            ) : (
              <>
                <UserCheck className='w-4 h-4 mr-2' />
                Assign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
