import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
    queryFn: () => base44.entities.City.list(),
  });

  const { data: offices = [] } = useQuery({
    queryKey: ['offices'],
    queryFn: () => base44.entities.Office.list(),
    enabled: hostType === 'office',
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!city) throw new Error('Please select a city');
      if (hostType === 'office' && !officeId) throw new Error('Please select an office');

      console.log(' Approving host:', {
        email: user.email,
        hostType,
        city,
        officeId,
      });

      //  1. Update User
      const userData = {
        host_approved: true,
        host_type: hostType,
        city: city,
        assigned_cities: [city],
        visible_in_city: visible,
        role_type: 'user',
        role: 'user',
        office_id: hostType === 'office' ? officeId : null,
        company_name: hostType === 'office' ? offices.find((o) => o.id === officeId)?.name : null,
      };

      await base44.entities.User.update(user.id, userData);

      //  2. Create/Update HostProfile
      const profiles = await base44.entities.HostProfile.filter({
        user_email: user.email,
      });

      const profileData = {
        user_email: user.email,
        user_id: user.id,
        full_name: user.full_name,
        display_name: user.display_name || user.full_name,
        city: city,
        cities: [city],
        bio: user.bio || '',
        profile_photo: user.profile_photo || '',
        languages: user.languages || ['English', 'Arabic'],
        rating: 5.0,
        host_type: hostType,
        office_id: hostType === 'office' ? officeId : null,
        is_active: true,
      };

      if (profiles?.length > 0) {
        await base44.entities.HostProfile.update(profiles[0].id, profileData);
      } else {
        await base44.entities.HostProfile.create(profileData);
      }

      //  3. Update Office
      if (hostType === 'office' && officeId) {
        const office = offices.find((o) => o.id === officeId);
        if (office) {
          const assignedHosts = office.assigned_hosts || [];
          if (!assignedHosts.includes(user.email)) {
            await base44.entities.Office.update(officeId, {
              assigned_hosts: [...assignedHosts, user.email],
              total_hosts: (office.total_hosts || 0) + 1,
            });
          }
        }
      }

      //  إرسال إشعارات عن جميع الحجوزات المفتوحة في المدينة
      try {
        const openBookings = await base44.entities.Booking.filter({
          city: city,
          state: 'open',
        });

        console.log(`📢 Found ${openBookings.length} open bookings in ${city}`);

        for (const booking of openBookings) {
          await base44.entities.Notification.create({
            recipient_email: user.email,
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
