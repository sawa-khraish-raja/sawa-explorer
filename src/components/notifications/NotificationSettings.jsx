import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, BellOff, Mail, Volume2, VolumeX, Moon, 
  Briefcase, MessageSquare, Star, DollarSign, Megaphone,
  Save, Loader2, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.NotificationPreferences.filter({
        user_email: user.email
      });
      
      if (prefs.length > 0) {
        return prefs[0];
      }
      
      // Create default preferences
      return await base44.entities.NotificationPreferences.create({
        user_email: user.email,
        push_enabled: true,
        email_enabled: true,
        in_app_enabled: true,
        booking_request_received: true,
        offer_received: true,
        offer_accepted: true,
        booking_confirmed: true,
        booking_cancelled: true,
        message_received: true,
        review_reminder: true,
        payment_updates: true,
        promotional: false,
        sound_enabled: true,
        quiet_hours_enabled: false,
      });
    },
    enabled: !!user?.email,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates) => {
      if (!preferences?.id) return;
      return await base44.entities.NotificationPreferences.update(preferences.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences', user?.email] });
      toast.success('Settings Saved', {
        description: 'Your notification preferences have been updated',
        duration: 3000,
      });
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to Save', {
        description: 'Could not update your preferences. Please try again.',
        duration: 4000,
      });
      setIsSaving(false);
    }
  });

  const handleToggle = (field, value) => {
    updatePreferences.mutate({ [field]: value });
  };

  const handleQuietHoursChange = (field, value) => {
    updatePreferences.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="space-y-6">
      {/* Master Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <Label className="text-base font-semibold">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications in your browser</p>
              </div>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <Label className="text-base font-semibold">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preferences.sound_enabled ? (
                <Volume2 className="w-5 h-5 text-gray-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <Label className="text-base font-semibold">Notification Sounds</Label>
                <p className="text-sm text-gray-500">Play sound when notifications arrive</p>
              </div>
            </div>
            <Switch
              checked={preferences.sound_enabled}
              onCheckedChange={(checked) => handleToggle('sound_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            Booking & Travel Notifications
          </CardTitle>
          <CardDescription>
            Customize which booking updates you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.host_approved && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">New Booking Requests</Label>
                  <p className="text-sm text-gray-500">When travelers request your services</p>
                </div>
                <Switch
                  checked={preferences.booking_request_received}
                  onCheckedChange={(checked) => handleToggle('booking_request_received', checked)}
                />
              </div>
              <Separator />
            </>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Offers Received</Label>
              <p className="text-sm text-gray-500">When hosts send you offers</p>
            </div>
            <Switch
              checked={preferences.offer_received}
              onCheckedChange={(checked) => handleToggle('offer_received', checked)}
            />
          </div>

          <Separator />

          {user?.host_approved && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Offers Accepted</Label>
                  <p className="text-sm text-gray-500">When travelers accept your offers</p>
                </div>
                <Switch
                  checked={preferences.offer_accepted}
                  onCheckedChange={(checked) => handleToggle('offer_accepted', checked)}
                />
              </div>
              <Separator />
            </>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Booking Confirmations</Label>
              <p className="text-sm text-gray-500">When bookings are confirmed</p>
            </div>
            <Switch
              checked={preferences.booking_confirmed}
              onCheckedChange={(checked) => handleToggle('booking_confirmed', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Cancellations</Label>
              <p className="text-sm text-gray-500">When bookings are cancelled</p>
            </div>
            <Switch
              checked={preferences.booking_cancelled}
              onCheckedChange={(checked) => handleToggle('booking_cancelled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Communication
          </CardTitle>
          <CardDescription>
            Manage message and review notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">New Messages</Label>
              <p className="text-sm text-gray-500">When you receive new messages</p>
            </div>
            <Switch
              checked={preferences.message_received}
              onCheckedChange={(checked) => handleToggle('message_received', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Review Reminders</Label>
              <p className="text-sm text-gray-500">Reminders to leave reviews after trips</p>
            </div>
            <Switch
              checked={preferences.review_reminder}
              onCheckedChange={(checked) => handleToggle('review_reminder', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment & Promotional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Payment & Marketing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Payment Updates</Label>
              <p className="text-sm text-gray-500">Payment confirmations and refunds</p>
            </div>
            <Switch
              checked={preferences.payment_updates}
              onCheckedChange={(checked) => handleToggle('payment_updates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Promotional Offers</Label>
              <p className="text-sm text-gray-500">Special deals and platform updates</p>
            </div>
            <Switch
              checked={preferences.promotional}
              onCheckedChange={(checked) => handleToggle('promotional', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Mute notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-semibold">Enable Quiet Hours</Label>
            <Switch
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Start Time</Label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_start || '22:00'}
                    onChange={(e) => handleQuietHoursChange('quiet_hours_start', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">End Time</Label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_end || '08:00'}
                    onChange={(e) => handleQuietHoursChange('quiet_hours_end', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You won't receive notifications during these hours
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Confirmation */}
      {updatePreferences.isSuccess && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="w-4 h-4" />
          All changes are automatically saved
        </div>
      )}
    </div>
  );
}