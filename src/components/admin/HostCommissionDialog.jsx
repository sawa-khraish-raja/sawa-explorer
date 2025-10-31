import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { showNotification } from '../notifications/NotificationManager';

export default function HostCommissionDialog({ host, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [sawaPercent, setSawaPercent] = useState(host?.commission_overrides?.sawa || '');
  const [officePercent, setOfficePercent] = useState(host?.commission_overrides?.office || '');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async () => {
      const overrides = {};
      if (sawaPercent) overrides.sawa = parseFloat(sawaPercent);
      if (officePercent) overrides.office = parseFloat(officePercent);

      await base44.entities.User.update(host.id, {
        commission_overrides: Object.keys(overrides).length > 0 ? overrides : null
      });

      // Audit log
      await base44.entities.AuditLog.create({
        admin_email: currentUser.email,
        action: 'permissions_updated',
        affected_user_email: host.email,
        details: JSON.stringify({
          type: 'commission_override',
          overrides,
          previousOverrides: host.commission_overrides
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHosts'] });
      showNotification({
        title: '✅ Commission Updated',
        message: 'Host commission overrides have been saved',
        type: 'success'
      });
      onClose();
    },
    onError: (error) => {
      console.error('Update commission error:', error);
      showNotification({
        title: '❌ Error',
        message: 'Failed to update commission',
        type: 'error'
      });
    }
  });

  const calculateExample = () => {
    const basePrice = 100;
    const sawa = parseFloat(sawaPercent) || (host.host_type === 'agency' ? 28 : 35);
    const office = parseFloat(officePercent) || (host.host_type === 'agency' ? 7 : 0);
    
    const sawaAmount = (basePrice * sawa / 100).toFixed(2);
    const officeAmount = (basePrice * office / 100).toFixed(2);
    const total = (basePrice + parseFloat(sawaAmount) + parseFloat(officeAmount)).toFixed(2);
    
    return { base: basePrice, sawa: sawaAmount, office: officeAmount, total };
  };

  const example = calculateExample();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Override Commission for {host?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Leave fields empty to use default rates. Custom rates will only apply to this specific host.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Current Type:</strong> {host?.host_type === 'agency' ? 'Agency Host' : 'Freelancer Host'}</p>
            <p className="text-gray-600 mt-1">
              Default: SAWA {host?.host_type === 'agency' ? '28%' : '35%'}
              {host?.host_type === 'agency' && ', Office 7%'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sawa">SAWA Commission (%)</Label>
              <Input
                id="sawa"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={sawaPercent}
                onChange={(e) => setSawaPercent(e.target.value)}
                placeholder={host?.host_type === 'agency' ? '28' : '35'}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="office">Office Commission (%)</Label>
              <Input
                id="office"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={officePercent}
                onChange={(e) => setOfficePercent(e.target.value)}
                placeholder={host?.host_type === 'agency' ? '7' : '0'}
                className="mt-2"
                disabled={host?.host_type !== 'agency'}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-sm text-purple-900 mb-2">
              Example Calculation (Base Price: $100)
            </h4>
            <div className="space-y-1 text-sm text-purple-800">
              <div className="flex justify-between">
                <span>Service Price:</span>
                <span className="font-medium">${example.base}</span>
              </div>
              <div className="flex justify-between">
                <span>+ SAWA ({sawaPercent || (host?.host_type === 'agency' ? 28 : 35)}%):</span>
                <span className="font-medium">${example.sawa}</span>
              </div>
              {host?.host_type === 'agency' && (
                <div className="flex justify-between">
                  <span>+ Office ({officePercent || 7}%):</span>
                  <span className="font-medium">${example.office}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-purple-300 pt-2 mt-2">
                <span>Total (Traveler Pays):</span>
                <span className="text-purple-900">${example.total}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => updateCommissionMutation.mutate()}
            disabled={updateCommissionMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {updateCommissionMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              'Save Overrides'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}