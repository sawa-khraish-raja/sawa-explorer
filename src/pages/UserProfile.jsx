import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2,
  Camera,
  Save,
  User,
  Briefcase,
  Shield,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { queryDocuments, updateDocument } from '@/utils/firestore';
import { uploadImage } from '@/utils/storage';

import { UseAppContext } from '@/shared/context/AppContext';
import DeleteAccountDialog from '@/features/traveler/components/DeleteAccountDialog';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const defaultTab = urlParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState(defaultTab);

  const [profileData, setProfileData] = useState({
    full_name: '',
    display_name: '',
    bio: '',
    phone: '',
    instagram_profile: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [newProfileImageFile, setNewProfileImageFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  let fileInputRef = null;

  const { user, userLoading: isLoadingUser, isHost } = UseAppContext();

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        display_name: user.display_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        instagram_profile: user.instagram_profile || '',
      });
      if (user.profile_photo) {
        setProfileImage(user.profile_photo);
      }
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      navigate(`?${params.toString()}`, { replace: true });
    }
  }, [activeTab, location.search, navigate]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({ updatedAuthData, hostProfileUpdateData, userId, userEmail }) => {
      if (!userId) {
        throw new Error('User ID is required to update profile');
      }

      await updateDocument('users', userId, {
        ...updatedAuthData,
        updated_date: new Date().toISOString(),
      });

      if (hostProfileUpdateData && userEmail) {
        const hostProfiles = await queryDocuments('host_profiles', [
          ['user_email', '==', userEmail],
        ]);
        if (hostProfiles && hostProfiles.length > 0) {
          const hostProfileId = hostProfiles[0].id;
          await updateDocument('host_profiles', hostProfileId, {
            ...hostProfileUpdateData,
            last_synced: new Date().toISOString(),
          });
        }
      }
    },
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['hostProfile', user?.email] });
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      toast.error(error.message || 'Failed to update profile');
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const handleProfileDataChange = (e) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfileImageFile(e.target.files[0]);
      setProfileImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      let photoUrl = profileImage;
      if (newProfileImageFile) {
        // Upload to Firebase Storage
        photoUrl = await uploadImage(newProfileImageFile, 'uploads');
      }

      const updatedAuthData = {
        ...profileData,
        profile_photo: photoUrl,
      };

      let hostProfileUpdateData = null;
      if (user?.host_approved) {
        hostProfileUpdateData = {
          ...profileData,
          profile_photo: photoUrl,
        };
      }

      updateProfileMutation.mutate({
        updatedAuthData,
        hostProfileUpdateData,
        userId: user?.id,
        userEmail: user?.email,
      });
    } catch (e) {
      console.error('Image upload failed:', e);
      toast.error('Image upload failed.');
      setIsUpdating(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className='flex justify-center items-center min-h-[50vh]'>
        <Loader2 className='w-8 h-8 animate-spin text-[#9933CC]' />
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex justify-center items-center min-h-[50vh] text-red-500'>
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      {/* Hero Section */}
      <section className='relative bg-gradient-to-br from-[#330066] via-[#9933CC] to-[#AD5CD6] pt-20 pb-32 overflow-hidden'>
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl' />
          <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-[#330066] opacity-20 rounded-full blur-3xl' />
        </div>

        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='flex flex-col items-start gap-4'
          >
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30'>
              <User className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>Profile Settings</span>
            </div>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight'>
              My Profile
            </h1>

            <p className='text-lg sm:text-xl text-white/90 max-w-2xl'>
              Manage your personal information and preferences
            </p>
          </motion.div>
        </div>

        <div className='absolute bottom-0 left-0 right-0 h-16 sm:h-24'>
          <svg
            className='w-full h-full'
            viewBox='0 0 1440 120'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            preserveAspectRatio='none'
          >
            <path
              d='M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z'
              fill='white'
              fillOpacity='1'
            />
          </svg>
        </div>
      </section>

      {/* Content Section */}
      <section className='py-8 sm:py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
            <TabsList className='flex flex-wrap w-full gap-2 bg-white p-2 rounded-xl shadow-md border border-gray-100'>
              <TabsTrigger
                value='profile'
                className='flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-[#E6E6FF] data-[state=active]:text-[#330066] rounded-lg'
              >
                <User className='w-4 h-4' />
                Profile
              </TabsTrigger>
              {isHost && (
                <TabsTrigger
                  value='host'
                  className='flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-[#E6E6FF] data-[state=active]:text-[#330066] rounded-lg'
                >
                  <Briefcase className='w-4 h-4' />
                  Host Settings
                </TabsTrigger>
              )}
              <TabsTrigger
                value='security'
                className='flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-[#E6E6FF] data-[state=active]:text-[#330066] rounded-lg'
              >
                <Shield className='w-4 h-4' />
                Security
              </TabsTrigger>
              <TabsTrigger
                value='account'
                className='flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-[#E6E6FF] data-[state=active]:text-[#330066] rounded-lg'
              >
                <Trash2 className='w-4 h-4' />
                Delete Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value='profile'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className='bg-white shadow-2xl border-2 border-[#CCCCFF]'>
                  <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-[#E6E6FF] to-white p-6'>
                    <CardTitle className='text-2xl text-gray-900'>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className='p-6 lg:p-8'>
                    <div className='flex items-center gap-6 mb-8 pb-8 border-b border-gray-100'>
                      <div className='relative'>
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={profileData.full_name || user.email}
                            className='w-24 h-24 rounded-full object-cover border-4 border-white ring-4 ring-[#CCCCFF]'
                          />
                        ) : (
                          <div className='w-24 h-24 rounded-full bg-gradient-to-br from-[#9933CC] to-[#330066] flex items-center justify-center border-4 border-white ring-4 ring-[#CCCCFF]'>
                            <span className='text-3xl font-bold text-white'>
                              {(
                                profileData.full_name?.charAt(0) || user.email?.charAt(0)
                              )?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <button
                          type='button'
                          onClick={handleCameraClick}
                          className='absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-[#330066] to-[#9933CC] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform'
                        >
                          <Camera className='w-5 h-5 text-white' />
                        </button>
                        <input
                          type='file'
                          ref={(input) => {
                            fileInputRef = input;
                          }}
                          onChange={handleImageChange}
                          className='hidden'
                          accept='image/*'
                        />
                      </div>
                      <div>
                        <h3 className='text-xl font-bold text-gray-900 mb-1'>
                          {profileData.full_name || 'User'}
                        </h3>
                        <p className='text-gray-600'>{user.email}</p>
                      </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className='space-y-6'>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='full_name'
                          className='text-base font-semibold text-gray-700'
                        >
                          Full Name
                        </Label>
                        <Input
                          id='full_name'
                          value={profileData.full_name}
                          onChange={handleProfileDataChange}
                          className='h-12 border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl'
                          placeholder='Enter your full name'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='display_name'
                          className='text-base font-semibold text-gray-700'
                        >
                          Display Name
                        </Label>
                        <Input
                          id='display_name'
                          value={profileData.display_name}
                          onChange={handleProfileDataChange}
                          className='h-12 border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl'
                          placeholder='How you want to be called'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='email' className='text-base font-semibold text-gray-700'>
                          Email
                        </Label>
                        <Input
                          id='email'
                          value={user.email}
                          disabled
                          className='h-12 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-not-allowed'
                        />
                        <p className='text-sm text-gray-500'>Email cannot be changed</p>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='phone' className='text-base font-semibold text-gray-700'>
                          Phone Number
                        </Label>
                        <Input
                          id='phone'
                          value={profileData.phone}
                          onChange={handleProfileDataChange}
                          placeholder='+1 234 567 8900'
                          className='h-12 border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='instagram_profile'
                          className='text-base font-semibold text-gray-700'
                        >
                          Instagram Profile
                        </Label>
                        <Input
                          id='instagram_profile'
                          value={profileData.instagram_profile}
                          onChange={handleProfileDataChange}
                          className='h-12 border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl'
                          placeholder='@username'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='bio' className='text-base font-semibold text-gray-700'>
                          About Me
                        </Label>
                        <Textarea
                          id='bio'
                          value={profileData.bio}
                          onChange={handleProfileDataChange}
                          placeholder='Tell us about yourself...'
                          rows={4}
                          className='border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl resize-none'
                        />
                      </div>

                      <Button
                        type='submit'
                        disabled={isUpdating}
                        className='w-full h-12 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white font-semibold rounded-xl shadow-lg text-base'
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className='w-5 h-5 mr-2' />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {isHost && (
              <TabsContent value='host'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className='bg-white shadow-2xl border-2 border-[#CCCCFF]'>
                    <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-[#E6E6FF] to-white p-6'>
                      <CardTitle className='text-2xl text-gray-900'>Host Settings</CardTitle>
                    </CardHeader>
                    <CardContent className='p-6 lg:p-8'>
                      <p className='text-gray-700'>
                        This section is for managing your host-specific profile and settings.
                      </p>
                      <Button
                        onClick={() => navigate(createPageUrl('HostDashboard'))}
                        className='mt-6 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6]'
                      >
                        Go to Host Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}

            <TabsContent value='security'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className='bg-white shadow-2xl border-2 border-[#CCCCFF]'>
                  <CardHeader className='border-b border-gray-100 bg-gradient-to-r from-[#E6E6FF] to-white p-6'>
                    <CardTitle className='text-2xl text-gray-900'>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className='p-6 lg:p-8'>
                    <p className='text-gray-700 mb-6'>
                      Manage your account security, including password changes and two-factor
                      authentication.
                    </p>
                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='current-password'
                          className='text-base font-semibold text-gray-700'
                        >
                          Current Password
                        </Label>
                        <Input
                          type='password'
                          id='current-password'
                          placeholder='********'
                          className='h-12 border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='new-password'
                          className='text-base font-semibold text-gray-700'
                        >
                          New Password
                        </Label>
                        <Input
                          type='password'
                          id='new-password'
                          placeholder='********'
                          className='h-12 border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='confirm-password'
                          className='text-base font-semibold text-gray-700'
                        >
                          Confirm New Password
                        </Label>
                        <Input
                          type='password'
                          id='confirm-password'
                          placeholder='********'
                          className='h-12 border-2 border-[#CCCCFF] focus:border-[#9933CC] rounded-xl'
                        />
                      </div>
                      <Button className='mt-4 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6]'>
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value='account'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className='bg-white shadow-2xl border-2 border-red-200'>
                  <CardHeader className='border-b border-red-100 bg-gradient-to-r from-red-50 to-white p-6'>
                    <CardTitle className='text-2xl text-red-900 flex items-center gap-2'>
                      <Trash2 className='w-6 h-6' />
                      Delete Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-6 lg:p-8 space-y-6'>
                    <div className='bg-red-50 border-2 border-red-200 rounded-xl p-6'>
                      <h3 className='text-lg font-bold text-red-900 mb-3 flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5' />
                        Warning: This action cannot be undone
                      </h3>
                      <p className='text-gray-700 mb-4'>
                        Deleting your account will permanently remove:
                      </p>
                      <ul className='list-disc list-inside space-y-2 text-gray-700 mb-4'>
                        <li>Your profile information and photos</li>
                        <li>All your bookings history</li>
                        <li>Your messages and conversations</li>
                        <li>Your reviews and ratings</li>
                        <li>Access to any active bookings</li>
                      </ul>
                      <p className='text-sm text-gray-600 italic'>
                        Note: Some data may be retained for legal and compliance purposes as
                        outlined in our Privacy Policy.
                      </p>
                    </div>

                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant='destructive'
                      className='w-full h-12 text-base font-semibold'
                    >
                      <Trash2 className='w-5 h-5 mr-2' />
                      Delete My Account
                    </Button>

                    <p className='text-center text-sm text-gray-500'>
                      Need help instead?{' '}
                      <a
                        href={createPageUrl('CustomerSupport')}
                        className='text-purple-600 hover:underline'
                      >
                        Contact Support
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        user={user}
      />
    </div>
  );
}
