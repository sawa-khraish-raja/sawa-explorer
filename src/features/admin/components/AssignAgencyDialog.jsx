import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, User, DollarSign } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { queryDocuments, addDocument, updateDocument } from '@/utils/firestore';
import { UseAppContext } from "@/shared/context/AppContext";
import { showNotification } from '@/features/shared/notifications/NotificationManager';

export default function AssignAgencyDialog({ host, isOpen, onClose }) {
  const { user } = UseAppContext();
  const queryClient = useQueryClient();
  const [selectedAgencyId, setSelectedAgencyId] = useState(host?.agency_id || '');

  const { data: agencies = [] } = useQuery({
    queryKey: ['allAgencies'],
    queryFn: () => queryDocuments('agencies', [['is_active', '==', true]]),
  });

  const assignAgencyMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        host_type: selectedAgencyId ? 'agency' : 'freelancer',
        agency_id: selectedAgencyId || null,
      };

      await updateDocument('users', host.id, {
        ...updates,
        updated_date: new Date().toISOString(),
      });

      // Update agency hosts count
      if (selectedAgencyId) {
        const agency = agencies.find((a) => a.id === selectedAgencyId);
        if (agency) {
          const hostsInAgency = await queryDocuments('users', [
            ['agency_id', '==', selectedAgencyId],
            ['host_approved', '==', true],
          ]);
          await updateDocument('agencies', selectedAgencyId, {
            total_hosts: hostsInAgency.length + 1,
            updated_date: new Date().toISOString(),
          });
        }
      }

      // Remove from old agency if changed
      if (host.agency_id && host.agency_id !== selectedAgencyId) {
        const oldAgency = agencies.find((a) => a.id === host.agency_id);
        if (oldAgency && oldAgency.total_hosts > 0) {
          await updateDocument('agencies', host.agency_id, {
            total_hosts: oldAgency.total_hosts - 1,
            updated_date: new Date().toISOString(),
          });
        }
      }

      // Audit log
      await addDocument('auditlogs', {
        admin_email: user.email,
        action: 'host_reassigned',
        affected_user_email: host.email,
        details: JSON.stringify({
          previousAgencyId: host.agency_id,
          newAgencyId: selectedAgencyId,
          previousType: host.host_type,
          newType: selectedAgencyId ? 'agency' : 'freelancer',
        }),
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHosts'] });
      queryClient.invalidateQueries({ queryKey: ['allAgencies'] });
      showNotification({
        title: ' Agency Assigned',
        message: `Host ${selectedAgencyId ? 'assigned to agency' : 'set as freelancer'}`,
        type: 'success',
      });
      onClose();
    },
    onError: (error) => {
      console.error('Assign agency error:', error);
      showNotification({
        title: ' Error',
        message: 'Failed to assign agency',
        type: 'error',
      });
    },
  });

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Building2 className='w-5 h-5 text-indigo-600' />
            Assign Agency
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Host Info */}
          <div className='bg-gray-50 p-3 rounded-lg'>
            <div className='flex items-center gap-2 text-sm'>
              <User className='w-4 h-4 text-gray-600' />
              <span className='font-medium'>{host?.full_name || host?.email}</span>
            </div>
            <div className='mt-2 text-xs text-gray-600'>
              Current:{' '}
              {host?.host_type === 'agency'
                ? `Agency Host (${
                    agencies.find((a) => a.id === host.agency_id)?.name || 'Unknown'
                  })`
                : 'Freelancer Host'}
            </div>
          </div>

          {/* Agency Selection */}
          <div>
            <Label>Select Agency</Label>
            <select
              value={selectedAgencyId}
              onChange={(e) => setSelectedAgencyId(e.target.value)}
              className='w-full mt-2 h-10 px-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none'
            >
              <option value=''>None (Freelancer)</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name} - {agency.city}
                </option>
              ))}
            </select>
          </div>

          {/* Commission Preview */}
          <div className='bg-indigo-50 p-4 rounded-lg border border-indigo-200'>
            <h4 className='font-semibold text-sm text-indigo-900 mb-2 flex items-center gap-2'>
              <DollarSign className='w-4 h-4' />
              Commission Structure:
            </h4>

            {selectedAgencyId && selectedAgency ? (
              <div className='space-y-1 text-sm text-indigo-800'>
                <p>
                  • Host Type: <Badge className='ml-2 bg-indigo-600 text-white'>Agency</Badge>
                </p>
                <p>• SAWA Commission: {selectedAgency.commission_sawa_default || 28}%</p>
                <p>• Office Commission: {selectedAgency.commission_office_default || 7}%</p>
                <div className='mt-2 pt-2 border-t border-indigo-200 text-xs text-indigo-600'>
                  <p>
                    <strong>Example:</strong> If host sets service at $100:
                  </p>
                  <p>
                    • SAWA gets: $
                    {((100 * (selectedAgency.commission_sawa_default || 28)) / 100).toFixed(2)}
                  </p>
                  <p>
                    • Office gets: $
                    {((100 * (selectedAgency.commission_office_default || 7)) / 100).toFixed(2)}
                  </p>
                  <p>
                    • Traveler pays: $
                    {(
                      100 +
                      (100 * (selectedAgency.commission_sawa_default || 28)) / 100 +
                      (100 * (selectedAgency.commission_office_default || 7)) / 100
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-1 text-sm text-indigo-800'>
                <p>
                  • Host Type: <Badge className='ml-2 bg-purple-600 text-white'>Freelancer</Badge>
                </p>
                <p>• SAWA Commission: 35%</p>
                <p>• Office Commission: 0%</p>
                <div className='mt-2 pt-2 border-t border-indigo-200 text-xs text-indigo-600'>
                  <p>
                    <strong>Example:</strong> If host sets service at $100:
                  </p>
                  <p>• SAWA gets: $35</p>
                  <p>• Traveler pays: $135</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => assignAgencyMutation.mutate()}
            disabled={assignAgencyMutation.isPending}
            className='bg-gradient-to-r from-indigo-600 to-purple-600'
          >
            {assignAgencyMutation.isPending ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Assigning...
              </>
            ) : (
              'Assign Agency'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
