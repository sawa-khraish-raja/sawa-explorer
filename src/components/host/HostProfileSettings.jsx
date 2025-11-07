import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Save,
  Loader2,
  Plus,
  X,
  Globe, // Keep MapPin for potential future use or if needed elsewhere in the component
  User,
  Briefcase,
  Image as ImageIcon,
  Sparkles,
  Eye, // Keep AlertCircle for potential future use or if needed elsewhere in the component
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { queryDocuments, addDocument, updateDocument } from '@/utils/firestore';
import { uploadImage } from '@/utils/storage';

import { UseAppContext } from '../context/AppContext';

const AVAILABLE_SERVICES = [
  'Airport Transportation Service',
  'Mobility and Companionship',
  'One-Week Travel Planning',
  'Full-Day Guided Tour',
  'Handy Essentials Package',
  'Booking a House or Hotel',
  'Emergency Support',
];

const AVAILABLE_LANGUAGES = [
  'English',
  'Arabic',
  'French',
  'German',
  'Spanish',
  'Turkish',
  'Russian',
  'Italian',
  'Chinese',
  'Japanese',
];

export default function HostProfileSettings({ user, onProfileUpdated }) {
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    display_name: user.display_name || user.full_name || '',
    bio: user.bio || '',
    languages: user.languages || ['English', 'Arabic'],
    services_offered: user.services_offered || [],
    response_time_hours: user.response_time_hours || 24,
    office_name: user.office_name || '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(user.profile_photo || '');
  const [coverPhotos, setCoverPhotos] = useState([]);
  const [existingCoverPhotos, setExistingCoverPhotos] = useState(user.cover_photos || []);
  const [uploading, setUploading] = useState(false);

  const [newLanguage, setNewLanguage] = useState('');
  const [newService, setNewService] = useState('');

  const handleProfilePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB');
      return;
    }

    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleCoverPhotosSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalPhotos = existingCoverPhotos.length + coverPhotos.length + files.length;
    if (totalPhotos > 6) {
      toast.error('Maximum 6 cover photos allowed');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Some images are too large. Maximum size is 5MB each');
        return;
      }
    }

    setCoverPhotos([...coverPhotos, ...files]);
  };

  const removeCoverPhoto = (index) => {
    setCoverPhotos(coverPhotos.filter((_, i) => i !== index));
  };

  const removeExistingCoverPhoto = (index) => {
    setExistingCoverPhotos(existingCoverPhotos.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    if (!newLanguage) {
      toast.warning('Please select a language');
      return;
    }
    if (profileData.languages.includes(newLanguage)) {
      toast.warning('Language already added');
      return;
    }
    setProfileData({
      ...profileData,
      languages: [...profileData.languages, newLanguage],
    });
    setNewLanguage('');
  };

  const removeLanguage = (lang) => {
    setProfileData({
      ...profileData,
      languages: profileData.languages.filter((l) => l !== lang),
    });
  };

  const addService = () => {
    if (!newService) {
      toast.warning('Please select a service');
      return;
    }
    if (profileData.services_offered.includes(newService)) {
      toast.warning('Service already added');
      return;
    }
    setProfileData({
      ...profileData,
      services_offered: [...profileData.services_offered, newService],
    });
    setNewService('');
  };

  const removeService = (service) => {
    setProfileData({
      ...profileData,
      services_offered: profileData.services_offered.filter((s) => s !== service),
    });
  };

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);

      try {
        let uploadedProfilePhoto = user.profile_photo;
        const uploadedCoverPhotos = [...existingCoverPhotos];

        //  Upload profile photo if changed
        if (profilePhoto) {
          const { file_url } = await uploadImage(profilePhoto, 'uploads');
          uploadedProfilePhoto = file_url;
        }

        //  Upload new cover photos
        if (coverPhotos.length > 0) {
          for (const photo of coverPhotos) {
            const { file_url } = await uploadImage(photo, 'uploads');
            uploadedCoverPhotos.push(file_url);
          }
        }

        const updateData = {
          display_name: profileData.display_name,
          bio: profileData.bio,
          languages: profileData.languages,
          services_offered: profileData.services_offered,
          response_time_hours: parseInt(profileData.response_time_hours),
          profile_photo: uploadedProfilePhoto,
          cover_photos: uploadedCoverPhotos,
          office_name: profileData.office_name,
        };

        console.log('Updating User entity...');
        await updateMe(updateData);

        // Fetch the user again to get the latest state including admin-controlled fields
        const freshUser = await UseAppContext().user;

        //  Update or Create HostProfile for unified display
        console.log('Syncing HostProfile...');
        const hostProfiles = await queryDocuments('hostprofiles', [
          ['user_email', '==', freshUser.email],
        ]);

        const hostProfileData = {
          user_email: freshUser.email,
          user_id: freshUser.id,
          full_name: freshUser.full_name,
          display_name: profileData.display_name,
          // This now reads the city from the synced user data, which is only set by admin
          city: freshUser.city,
          bio: profileData.bio,
          profile_photo: uploadedProfilePhoto,
          cover_photos: uploadedCoverPhotos,
          languages: profileData.languages,
          services_offered: profileData.services_offered,
          rating: freshUser.rating || 5.0,
          completed_bookings: freshUser.completed_bookings || 0,
          response_time_hours: parseInt(profileData.response_time_hours),
          host_type: freshUser.host_type,
          office_name: profileData.office_name,
          phone: freshUser.phone,
          whatsapp_number: freshUser.whatsapp_number || freshUser.phone,
          facebook_profile: freshUser.facebook_profile || '',
          instagram_profile: freshUser.instagram_profile || '',
          availability_status: 'available',
          is_active: freshUser.host_approved,
          last_synced: new Date().toISOString(),
        };

        if (hostProfiles && hostProfiles.length > 0) {
          await updateDocument('hostprofiles', hostProfiles[0].id, {
            ...hostProfileData,
            updated_date: new Date().toISOString(),
          });
          console.log(' HostProfile updated');
        } else if (freshUser.host_approved) {
          await addDocument('hostprofiles', {
            ...hostProfileData,
            created_date: new Date().toISOString(),
          });
          console.log(' HostProfile created');
        } else {
          console.log('HostProfile not created: user is not host_approved.');
        }

        return updateData;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['hostProfile'] });

      setProfilePhoto(null);
      setCoverPhotos([]);

      if (onProfileUpdated) {
        onProfileUpdated();
      }

      toast.success(' Profile updated successfully! Changes are live now.');
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    },
  });

  return (
    <div className='space-y-6'>
      {/* Preview Button - ONE ONLY */}
      <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg'>
                <Eye className='w-7 h-7 text-white' />
              </div>
              <div>
                <h3 className='text-xl font-bold text-blue-900 mb-1'>Your Public Profile</h3>
                <p className='text-sm text-blue-700'>See how travelers will view your profile</p>
              </div>
            </div>
            <Button
              onClick={() =>
                window.open(createPageUrl(`HostProfile?email=${user.email}`), '_blank')
              }
              size='lg'
              className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-lg'
            >
              <Eye className='w-5 h-5 mr-2' />
              Preview Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Photo */}
      <Card className='shadow-lg border-2 border-gray-200'>
        <CardHeader className='border-b bg-gradient-to-r from-gray-50 to-white'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Camera className='w-5 h-5 text-purple-600' />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='flex items-center gap-6'>
            <div className='relative'>
              {profilePhotoPreview ? (
                <img
                  src={profilePhotoPreview}
                  alt='Profile'
                  className='w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-lg'
                />
              ) : (
                <div className='w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg'>
                  <User className='w-16 h-16 text-white' />
                </div>
              )}
              <label className='absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-colors'>
                <Camera className='w-5 h-5' />
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleProfilePhotoSelect}
                  className='hidden'
                />
              </label>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-2 font-medium'>
                Your profile photo appears on your public profile
              </p>
              <p className='text-xs text-gray-500'>
                Maximum size: 5MB • Recommended: Square image (500x500px)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Photos */}
      <Card className='shadow-lg border-2 border-gray-200'>
        <CardHeader className='border-b bg-gradient-to-r from-gray-50 to-white'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <ImageIcon className='w-5 h-5 text-purple-600' />
            Cover Photos (Max 6)
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
            {existingCoverPhotos.map((photo, idx) => (
              <div key={`existing-${idx}`} className='relative group'>
                <img
                  src={photo}
                  alt={`Cover ${idx + 1}`}
                  className='w-full h-32 object-cover rounded-lg shadow-md'
                />
                <button
                  onClick={() => removeExistingCoverPhoto(idx)}
                  className='absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
            {coverPhotos.map((photo, idx) => (
              <div key={`new-${idx}`} className='relative group'>
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`New Cover ${idx + 1}`}
                  className='w-full h-32 object-cover rounded-lg shadow-md'
                />
                <button
                  onClick={() => removeCoverPhoto(idx)}
                  className='absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
            {existingCoverPhotos.length + coverPhotos.length < 6 && (
              <label className='border-2 border-dashed border-purple-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors'>
                <Plus className='w-8 h-8 text-purple-400 mb-2' />
                <span className='text-sm text-purple-600 font-medium'>Add Photo</span>
                <input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={handleCoverPhotosSelect}
                  className='hidden'
                />
              </label>
            )}
          </div>
          <p className='text-xs text-gray-500'>
            These photos appear in your profile gallery. Maximum 6 photos, 5MB each.
          </p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className='shadow-lg border-2 border-gray-200'>
        <CardHeader className='border-b bg-gradient-to-r from-gray-50 to-white'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <User className='w-5 h-5 text-purple-600' />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div>
            <Label htmlFor='display_name' className='text-sm font-semibold text-gray-700'>
              Display Name *
            </Label>
            <Input
              id='display_name'
              value={profileData.display_name}
              onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
              placeholder='How travelers will see your name'
              className='mt-2'
            />
            <p className='text-xs text-gray-500 mt-1'>This name appears on your public profile</p>
          </div>

          <div>
            <Label htmlFor='bio' className='text-sm font-semibold text-gray-700'>
              Bio *
            </Label>
            <Textarea
              id='bio'
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder='Tell travelers about yourself, your experience, and why you love being a host...'
              rows={6}
              className='mt-2'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Share your story, experience, and what makes you a great host
            </p>
          </div>

          {/* City is now managed in the admin panel and synced. Display only: */}
          <div>
            <Label className='text-sm font-semibold text-gray-700'>City</Label>
            <Input
              value={user.city || 'N/A'}
              readOnly
              className='mt-2 bg-gray-50 cursor-not-allowed'
            />
            <p className='text-xs text-gray-500 mt-1'>Your city is managed by administrators.</p>
          </div>

          <div>
            <Label htmlFor='response_time' className='text-sm font-semibold text-gray-700'>
              Response Time (hours)
            </Label>
            <Input
              id='response_time'
              type='number'
              min='1'
              max='72'
              value={profileData.response_time_hours}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  response_time_hours: e.target.value,
                })
              }
              className='mt-2'
            />
            <p className='text-xs text-gray-500 mt-1'>
              How quickly do you typically respond to messages?
            </p>
          </div>

          {user.host_type === 'office' && (
            <div>
              <Label htmlFor='office_name' className='text-sm font-semibold text-gray-700'>
                Office Name *
              </Label>
              <Input
                id='office_name'
                value={profileData.office_name}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    office_name: e.target.value,
                  })
                }
                placeholder='Your company/office name'
                className='mt-2'
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card className='shadow-lg border-2 border-gray-200'>
        <CardHeader className='border-b bg-gradient-to-r from-gray-50 to-white'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Globe className='w-5 h-5 text-purple-600' />
            Languages
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='flex gap-2'>
            <Select value={newLanguage} onValueChange={setNewLanguage}>
              <SelectTrigger className='flex-1'>
                <SelectValue placeholder='Select language' />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_LANGUAGES.filter((lang) => !profileData.languages.includes(lang)).map(
                  (lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Button onClick={addLanguage} variant='outline'>
              <Plus className='w-4 h-4 mr-2' />
              Add
            </Button>
          </div>

          <div className='flex flex-wrap gap-2'>
            {profileData.languages.map((lang) => (
              <Badge key={lang} variant='outline' className='px-3 py-2 text-sm'>
                {lang}
                <button onClick={() => removeLanguage(lang)} className='ml-2 hover:text-red-600'>
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card className='shadow-lg border-2 border-gray-200'>
        <CardHeader className='border-b bg-gradient-to-r from-gray-50 to-white'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Briefcase className='w-5 h-5 text-purple-600' />
            Services Offered
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='flex gap-2'>
            <Select value={newService} onValueChange={setNewService}>
              <SelectTrigger className='flex-1'>
                <SelectValue placeholder='Select service' />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SERVICES.filter(
                  (service) => !profileData.services_offered.includes(service)
                ).map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addService} variant='outline'>
              <Plus className='w-4 h-4 mr-2' />
              Add
            </Button>
          </div>

          <div className='space-y-2'>
            {profileData.services_offered.map((service) => (
              <div
                key={service}
                className='flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100'
              >
                <Briefcase className='w-4 h-4 text-purple-600 flex-shrink-0' />
                <span className='flex-1 text-sm font-medium'>{service}</span>
                <button
                  onClick={() => removeService(service)}
                  className='text-red-500 hover:text-red-700'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card className='bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-lg'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg'>
                <Sparkles className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-lg font-bold text-purple-900'>Ready to Update?</h3>
                <p className='text-sm text-purple-700'>Changes will be live immediately</p>
              </div>
            </div>
            <Button
              onClick={() => saveProfileMutation.mutate()}
              disabled={uploading || saveProfileMutation.isPending}
              size='lg'
              className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 shadow-lg'
            >
              {uploading || saveProfileMutation.isPending ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-5 h-5 mr-2' />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
