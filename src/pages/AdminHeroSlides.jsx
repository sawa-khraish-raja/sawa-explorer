import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Save,
  Upload,
  Eye,
  EyeOff,
  Film,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { showSuccess, showError } from '../components/utils/notifications';
import { Badge } from '@/components/ui/badge';

const PAGE_TYPES = [
  { value: 'home', label: 'Home Page', icon: '🏠' },
  { value: 'my_trips', label: 'My Trips', icon: '✈️' },
  { value: 'destinations', label: 'Destinations', icon: '🗺️' },
  { value: 'forum', label: 'Community Forum', icon: '💬' },
  { value: 'about', label: 'About Us', icon: 'ℹ️' },
  { value: 'city', label: 'City Pages', icon: '🏙️' },
];

const CITIES = ['Damascus', 'Amman', 'Istanbul', 'Cairo'];

export default function AdminHeroSlides() {
  const [selectedPage, setSelectedPage] = useState('home');
  const [selectedCity, setSelectedCity] = useState('Damascus');
  const [editingSlide, setEditingSlide] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['adminHeroSlides', selectedPage, selectedCity],
    queryFn: async () => {
      let allSlides;

      if (selectedPage === 'city') {
        allSlides = await base44.entities.HeroSlide.filter({
          page_type: 'city',
          city_name: selectedCity,
        });
      } else {
        allSlides = await base44.entities.HeroSlide.filter({
          page_type: selectedPage,
        });
      }

      return allSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
    },
  });

  const createMutation = useMutation({
    mutationFn: (slideData) => base44.entities.HeroSlide.create(slideData),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminHeroSlides']);
      showSuccess('Hero slide created successfully!');
      setEditingSlide(null);
    },
    onError: (error) => {
      showError('Failed to create slide: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HeroSlide.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminHeroSlides']);
      showSuccess('Hero slide updated successfully!');
      setEditingSlide(null);
    },
    onError: (error) => {
      showError('Failed to update slide: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HeroSlide.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminHeroSlides']);
      showSuccess('Hero slide deleted successfully!');
    },
    onError: (error) => {
      showError('Failed to delete slide: ' + error.message);
    },
  });

  const handleSave = () => {
    if (!editingSlide.video_url || editingSlide.video_url.trim() === '') {
      showError('Please provide a video URL');
      return;
    }

    const slideData = {
      page_type: selectedPage,
      ...(selectedPage === 'city' && { city_name: selectedCity }),
      video_url: editingSlide.video_url.trim(),
      poster_image: editingSlide.poster_image?.trim() || '',
      title: editingSlide.title?.trim() || '',
      subtitle: editingSlide.subtitle?.trim() || '',
      order: editingSlide.order !== undefined ? parseInt(editingSlide.order) : slides.length,
      display_duration: editingSlide.display_duration ? parseInt(editingSlide.display_duration) : 6,
      is_active: editingSlide.is_active !== undefined ? editingSlide.is_active : true,
    };

    console.log('💾 Saving slide:', slideData);

    if (editingSlide.id) {
      updateMutation.mutate({ id: editingSlide.id, data: slideData });
    } else {
      createMutation.mutate(slideData);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditingSlide((prev) => ({ ...prev, [field]: file_url }));
      showSuccess('File uploaded successfully!');
    } catch (error) {
      showError('Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = null; // Clear the input so same file can be selected again
    }
  };

  return (
    <AdminLayout currentPage='hero_slides'>
      <div className='space-y-6'>
        <div className='bg-gradient-to-r from-[#330066] to-[#9933CC] rounded-2xl p-8 text-white'>
          <h1 className='text-3xl font-bold mb-2'>Hero Video Slides</h1>
          <p className='text-white/90'>Manage hero videos for all pages</p>
        </div>

        {/* Page Selector */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Film className='w-5 h-5' />
              Select Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
              {PAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedPage(type.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPage === type.value
                      ? 'border-[#9933CC] bg-purple-50'
                      : 'border-gray-200 hover:border-[#9933CC]/50'
                  }`}
                >
                  <div className='text-3xl mb-2'>{type.icon}</div>
                  <div className='text-sm font-semibold'>{type.label}</div>
                </button>
              ))}
            </div>

            {/* City Selector - Only show if city page selected */}
            {selectedPage === 'city' && (
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <Label className='text-base font-semibold mb-3 block'>Select City</Label>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedCity === city
                          ? 'border-[#9933CC] bg-purple-50'
                          : 'border-gray-200 hover:border-[#9933CC]/50'
                      }`}
                    >
                      <div className='text-sm font-semibold'>{city}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add New Slide Button */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>
                New Slide for {PAGE_TYPES.find((p) => p.value === selectedPage)?.label}
                {selectedPage === 'city' && ` - ${selectedCity}`}
              </span>
              <Button
                onClick={() =>
                  setEditingSlide({
                    page_type: selectedPage,
                    ...(selectedPage === 'city' && { city_name: selectedCity }),
                    order: slides.length,
                    display_duration: 6,
                    is_active: true,
                    video_url: '',
                    poster_image: '',
                    title: '',
                    subtitle: '',
                  })
                }
                size='sm'
              >
                <Plus className='w-4 h-4 mr-2' />
                Add Slide
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Edit Slide Form */}
        {editingSlide && (
          <Card>
            <CardHeader>
              <CardTitle>{editingSlide.id ? 'Edit Slide' : 'Create New Slide'}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/*  Video URL */}
              <div className='space-y-2'>
                <Label
                  htmlFor='video_url'
                  className='text-base font-semibold flex items-center gap-2'
                >
                  <Film className='w-5 h-5 text-[#9933CC]' />
                  Video URL *
                </Label>
                <Input
                  id='video_url'
                  value={editingSlide.video_url || ''}
                  onChange={(e) =>
                    setEditingSlide({
                      ...editingSlide,
                      video_url: e.target.value,
                    })
                  }
                  placeholder='https://example.com/video.mp4'
                  className='text-base'
                />
                <div className='flex items-center gap-2 mt-2'>
                  <Upload className='w-4 h-4 text-gray-400' />
                  <Label
                    htmlFor='video-upload'
                    className='text-sm text-[#9933CC] hover:text-[#7B2CBF] cursor-pointer font-medium'
                  >
                    {uploading && editingSlide.video_url === ''
                      ? 'Uploading...'
                      : 'Or upload video file'}
                  </Label>
                  <input
                    id='video-upload'
                    type='file'
                    accept='video/*'
                    onChange={(e) => handleFileUpload(e, 'video_url')}
                    className='hidden'
                    disabled={uploading}
                  />
                </div>
              </div>

              {/*  Poster Image - HIGHLIGHTED */}
              <div className='space-y-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200'>
                <Label
                  htmlFor='poster_image'
                  className='text-base font-semibold flex items-center gap-2'
                >
                  <Upload className='w-5 h-5 text-blue-600' />
                  Poster Image (Thumbnail) - Shows while video loads ⚡
                </Label>
                <p className='text-sm text-gray-600 mb-3'>
                  ⭐ This image appears instantly before the video loads - prevents white screen!
                </p>
                <Input
                  id='poster_image'
                  value={editingSlide.poster_image || ''}
                  onChange={(e) =>
                    setEditingSlide({
                      ...editingSlide,
                      poster_image: e.target.value,
                    })
                  }
                  placeholder='https://example.com/poster.jpg'
                  className='text-base'
                />
                <div className='flex items-center gap-2 mt-2'>
                  <Label htmlFor='poster-upload' className='cursor-pointer'>
                    <div className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
                      <Upload className='w-4 h-4' />
                      <span className='text-sm font-medium'>
                        {uploading && editingSlide.poster_image === ''
                          ? 'Uploading...'
                          : '📤 Upload Poster Image'}
                      </span>
                    </div>
                  </Label>
                  <input
                    id='poster-upload'
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileUpload(e, 'poster_image')}
                    className='hidden'
                    disabled={uploading}
                  />
                </div>
                {editingSlide.poster_image && (
                  <div className='mt-3'>
                    <img
                      src={editingSlide.poster_image}
                      alt='Poster preview'
                      className='w-full h-48 object-cover rounded-lg border-2 border-blue-300'
                    />
                  </div>
                )}
              </div>

              {/* Other Fields */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label>Title (Optional)</Label>
                  <Input
                    value={editingSlide.title || ''}
                    onChange={(e) =>
                      setEditingSlide({
                        ...editingSlide,
                        title: e.target.value,
                      })
                    }
                    placeholder='Slide title...'
                  />
                </div>

                <div>
                  <Label>Subtitle (Optional)</Label>
                  <Input
                    value={editingSlide.subtitle || ''}
                    onChange={(e) =>
                      setEditingSlide({
                        ...editingSlide,
                        subtitle: e.target.value,
                      })
                    }
                    placeholder='Slide subtitle...'
                  />
                </div>

                <div>
                  <Label>Display Duration (seconds)</Label>
                  <Input
                    type='number'
                    value={editingSlide.display_duration || 6}
                    onChange={(e) =>
                      setEditingSlide({
                        ...editingSlide,
                        display_duration: parseInt(e.target.value) || 6,
                      })
                    }
                    min='1'
                    max='30'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Default: 6 seconds</p>
                </div>

                <div>
                  <Label>Order</Label>
                  <Input
                    type='number'
                    value={editingSlide.order !== undefined ? editingSlide.order : slides.length}
                    onChange={(e) =>
                      setEditingSlide({
                        ...editingSlide,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    min='0'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Lower numbers show first</p>
                </div>

                <div className='flex items-center gap-2'>
                  <Switch
                    checked={editingSlide.is_active !== false}
                    onCheckedChange={(checked) =>
                      setEditingSlide({ ...editingSlide, is_active: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>

              {/* Save Buttons */}
              <div className='flex justify-end gap-3 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setEditingSlide(null)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending || uploading}
                  className='bg-[#9933CC] hover:bg-[#7B2CBF]'
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='w-4 h-4 mr-2' />
                      {editingSlide.id ? 'Update Slide' : 'Create Slide'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Slides */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>
                Current Slides for {PAGE_TYPES.find((p) => p.value === selectedPage)?.label}
                {selectedPage === 'city' && ` - ${selectedCity}`}
              </CardTitle>
              {/* This button is intentionally left here, it will be redundant if editingSlide is present as the form is already open */}
              <Button
                onClick={() =>
                  setEditingSlide({
                    page_type: selectedPage,
                    ...(selectedPage === 'city' && { city_name: selectedCity }),
                    order: slides.length,
                    is_active: true,
                    display_duration: 6,
                    video_url: '',
                    poster_image: '',
                    title: '',
                    subtitle: '',
                  })
                }
                className='bg-[#9933CC] hover:bg-[#7B2CBF]'
              >
                <Plus className='w-4 h-4 mr-2' />
                Add New Slide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='text-center py-8 text-gray-500'>Loading...</div>
            ) : slides.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                No slides for this page yet. Add one above!
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {slides.map((slide) => (
                  <Card key={slide.id} className='overflow-hidden'>
                    <div className='relative aspect-video bg-gray-100'>
                      {slide.poster_image ? (
                        <img
                          src={slide.poster_image}
                          alt={slide.title || 'Hero slide'}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='flex items-center justify-center h-full'>
                          <Film className='w-12 h-12 text-gray-400' />
                        </div>
                      )}
                      <div className='absolute top-2 right-2 flex gap-2'>
                        {slide.is_active ? (
                          <Badge className='bg-green-500 text-white'>
                            <Eye className='w-3 h-3 mr-1' />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant='secondary'>
                            <EyeOff className='w-3 h-3 mr-1' />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <h3 className='font-semibold'>{slide.title || 'Untitled Slide'}</h3>
                          <p className='text-sm text-gray-600'>
                            Order: {slide.order} • {slide.display_duration}s
                          </p>
                        </div>
                      </div>
                      <div className='flex gap-2 mt-3'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setEditingSlide(slide)}
                          className='flex-1'
                        >
                          Edit
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => {
                            if (confirm('Delete this slide?')) {
                              deleteMutation.mutate(slide.id);
                            }
                          }}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
