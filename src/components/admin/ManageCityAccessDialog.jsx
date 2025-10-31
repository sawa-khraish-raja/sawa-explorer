
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
// createPageUrl is no longer used after the mutationFn update, so it's removed.
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Replaced showNotification with toast

const AVAILABLE_CITIES = ['Damascus', 'Amman', 'Istanbul', 'Cairo'];

// Changed prop 'host' to 'user', and added 'onSuccess' prop
export default function ManageCityAccessDialog({ user, isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [selectedCities, setSelectedCities] = useState([]);
  const [visibleInCity, setVisibleInCity] = useState(true);

  // The currentUser query is kept as it was not part of the outlined changes,
  // although its usage in the original mutationFn (for audit logs) has been removed.
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    // Updated to use the 'user' prop
    if (user) {
      setSelectedCities(user.assigned_cities || []);
      // The outline sets visible_in_city to true unconditionally on save,
      // but for initial display, we still respect the current user setting.
      setVisibleInCity(user.visible_in_city !== false);
    }
  }, [user]);

  const updateCityAccessMutation = useMutation({
    mutationFn: async () => {
      console.log(`🏙️ Updating cities for ${user.email}:`, selectedCities);

      // تحديث User entity
      await base44.entities.User.update(user.id, {
        assigned_cities: selectedCities,
        city: selectedCities[0] || null, // أول مدينة كـ primary
        visible_in_city: true // تأكد من الرؤية (as per outline, always true on save)
      });

      // تحديث HostProfile إذا موجود
      try {
        const hostProfiles = await base44.entities.HostProfile.filter({
          user_email: user.email
        });

        if (hostProfiles && hostProfiles.length > 0) {
          await base44.entities.HostProfile.update(hostProfiles[0].id, {
            city: selectedCities[0] || null,
            cities: selectedCities,
            last_synced: new Date().toISOString()
          });
          console.log('✅ HostProfile updated');
        }
      } catch (error) {
        console.log('⚠️ No HostProfile to update or error during update:', error);
      }

      return { email: user.email, cities: selectedCities };
    },
    onSuccess: (data) => {
      // Invalidate 'allUsers' instead of 'allHosts'
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['cityHosts'] });
      // Use toast for success notification
      toast.success(`✅ Cities updated for ${data.email}`, {
        description: `Assigned to: ${data.cities.join(', ')}`
      });
      if (onSuccess) onSuccess(); // Call the optional onSuccess prop
      onClose();
    },
    onError: (error) => {
      console.error('Update city access error:', error);
      // Use toast for error notification
      toast.error('Failed to update cities', {
        description: error.message || 'An unknown error occurred.'
      });
    }
  });

  const handleToggleCity = (city) => {
    setSelectedCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const handleSave = () => {
    if (selectedCities.length === 0) {
      // Use toast for warning notification
      toast.warning('Please select at least one city');
      return;
    }

    // Call mutate without arguments as mutationFn now uses state directly
    updateCityAccessMutation.mutate();
  };

  // Updated to use the 'user' prop
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-6 h-6 text-purple-600" />
            {/* Updated to use the 'user' prop */}
            Manage City Access: {user.full_name || user.email}
          </DialogTitle>
          <DialogDescription>
            Select which cities this host can receive bookings from and appear in.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Available Cities</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_CITIES.map((city) => (
                <div
                  key={city}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={`city-${city}`}
                    checked={selectedCities.includes(city)}
                    onCheckedChange={() => handleToggleCity(city)}
                  />
                  <Label
                    htmlFor={`city-${city}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {city}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <Label htmlFor="visible-toggle" className="font-semibold text-purple-900">
                Show on City Pages
              </Label>
              <p className="text-sm text-purple-700 mt-1">
                Display this host publicly on city booking pages
              </p>
            </div>
            {/* The outline sets visible_in_city to true unconditionally on save.
                However, for consistency, the checkbox still reflects the state,
                but its value is overridden to 'true' during the save operation based on the outline.
                If the intention was for this checkbox to control the 'visible_in_city' field,
                the mutationFn's `visible_in_city: true` line should be `visible_in_city: visibleInCity`.
                Sticking to the outline's explicit instruction: `visible_in_city: true`.
            */}
            <Checkbox
              id="visible-toggle"
              checked={visibleInCity}
              onCheckedChange={setVisibleInCity}
            />
          </div>

          {selectedCities.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Selected Cities ({selectedCities.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCities.map(city => (
                  <Badge key={city} className="bg-purple-600 text-white">
                    {city}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateCityAccessMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateCityAccessMutation.isPending || selectedCities.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updateCityAccessMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
