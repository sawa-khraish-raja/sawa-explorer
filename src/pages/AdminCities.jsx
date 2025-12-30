import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Eye,
  Star,
  CheckCircle,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { uploadImage } from '@/utils/storage';

import AdminLayout from '@/features/admin/components/AdminLayout';

const CityFormDialog = ({ city, isOpen, onClose, createCityMutation, updateCityMutation }) => {
  const initialFormData = useMemo(
    () => ({
      name: '',
      country: '',
      description: '',
      card_image: '',
      gallery_images: [],
      is_active: true,
      is_featured: false,
      timezone: '',
      currency: 'USD',
      languages: [],
      highlights: [],
      best_time_to_visit: '',
      average_temp: '',
      population: null,
      page_slug: '',
      coordinates: { lat: null, lng: null },
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState('general');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (city) {
      setFormData({
        ...initialFormData,
        ...city,
        coordinates: city.coordinates ? { ...city.coordinates } : { lat: null, lng: null },
        gallery_images: city.gallery_images || [],
        highlights: city.highlights || [],
      });
    } else {
      setFormData(initialFormData);
    }
    setActiveTab('general');
  }, [city, isOpen, initialFormData]);

  const handleImageUpload = async (e, type = 'card') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const file_url = await uploadImage(file);

      if (!file_url) {
        throw new Error('No URL returned from upload');
      }

      if (type === 'card') {
        setFormData((prev) => ({
          ...prev,
          card_image: file_url,
        }));
      } else if (type === 'gallery') {
        setFormData((prev) => ({
          ...prev,
          gallery_images: [...(prev.gallery_images || []), file_url],
        }));
      }

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploadingImage(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveGalleryImage = (index) => {
    const newGallery = [...(formData.gallery_images || [])];
    newGallery.splice(index, 1);
    setFormData((prev) => ({ ...prev, gallery_images: newGallery }));
  };

  const handleAddHighlight = () => {
    const currentHighlights = formData.highlights || [];
    setFormData((prev) => ({
      ...prev,
      highlights: [...currentHighlights, ''],
    }));
  };

  const handleUpdateHighlight = (index, value) => {
    const newHighlights = [...(formData.highlights || [])];
    newHighlights[index] = value;
    setFormData((prev) => ({ ...prev, highlights: newHighlights }));
  };

  const handleRemoveHighlight = (index) => {
    const newHighlights = [...(formData.highlights || [])];
    newHighlights.splice(index, 1);
    setFormData((prev) => ({ ...prev, highlights: newHighlights }));
  };

  const handleSubmit = () => {
    if (!formData.name?.trim() || !formData.country?.trim()) {
      toast.error('City name and country are required');
      return;
    }

    if (!formData.card_image) {
      toast.error('Card image is required for homepage');
      return;
    }

    const dataToSave = {
      ...formData,
      name: formData.name.trim(),
      country: formData.country.trim(),
      description: formData.description?.trim() || '',
      page_slug: formData.page_slug?.trim() || '',
      population: formData.population ? Number(formData.population) : null,
      coordinates: {
        lat: formData.coordinates.lat ? Number(formData.coordinates.lat) : null,
        lng: formData.coordinates.lng ? Number(formData.coordinates.lng) : null,
      },
    };

    if (city) {
      updateCityMutation.mutate({ id: city.id, data: dataToSave });
    } else {
      createCityMutation.mutate(dataToSave);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{city ? 'Edit City' : 'Add New City'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='general'>General</TabsTrigger>
            <TabsTrigger value='media'>Media</TabsTrigger>
            <TabsTrigger value='details'>Details</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value='general' className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>City Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder='e.g., Damascus'
                />
              </div>
              <div>
                <Label>Country *</Label>
                <Input
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  placeholder='e.g., Syria'
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder='Short description of the city...'
                rows={3}
              />
            </div>

            <div>
              <Label>Page Slug (URL)</Label>
              <Input
                value={formData.page_slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    page_slug: e.target.value,
                  }))
                }
                placeholder='e.g., BookingDamascus'
              />
              <p className='text-xs text-gray-500 mt-1'>This will be the URL: /BookingDamascus</p>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='flex items-center justify-between'>
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
              <div className='flex items-center justify-between'>
                <Label>Featured</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_featured: checked }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* MEDIA TAB */}
          <TabsContent value='media' className='space-y-6'>
            {/* Card Image */}
            <div>
              <Label>Card Image (Homepage) *</Label>
              <p className='text-xs text-gray-500 mb-2'>
                This image appears on the homepage city cards
              </p>
              {formData.card_image ? (
                <div className='relative'>
                  <img
                    src={formData.card_image}
                    alt='Card'
                    className='w-full rounded-lg max-h-64 object-cover'
                  />
                  <Button
                    variant='destructive'
                    size='icon'
                    className='absolute top-2 right-2'
                    onClick={() => setFormData((prev) => ({ ...prev, card_image: '' }))}
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              ) : (
                <div className='border-2 border-dashed rounded-lg p-8 text-center'>
                  <Upload className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleImageUpload(e, 'card')}
                    disabled={isUploadingImage}
                    className='max-w-xs mx-auto'
                  />
                </div>
              )}
            </div>

            {/*  Note about Hero Video */}
            <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-4'>
              <div className='flex items-start gap-3'>
                <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0'>
                  <CheckCircle className='w-5 h-5 text-white' />
                </div>
                <div>
                  <h4 className='font-semibold text-blue-900 mb-1'>Hero Video Management</h4>
                  <p className='text-sm text-blue-700'>
                    To add/edit hero videos for this city page, go to <strong>Hero Slides</strong>{' '}
                    management and select <strong>City Pages</strong>, then choose{' '}
                    <strong>{formData.name || 'this city'}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Images */}
            <div>
              <Label>Gallery Images</Label>
              <div className='grid grid-cols-3 gap-4 mt-2'>
                {formData.gallery_images?.map((img, idx) => (
                  <div key={idx} className='relative'>
                    <img
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className='w-full h-32 object-cover rounded-lg'
                    />
                    <Button
                      variant='destructive'
                      size='icon'
                      className='absolute top-1 right-1 h-6 w-6'
                      onClick={() => handleRemoveGalleryImage(idx)}
                    >
                      <X className='w-3 h-3' />
                    </Button>
                  </div>
                ))}
                <div className='border-2 border-dashed rounded-lg p-4 flex items-center justify-center'>
                  <label className='cursor-pointer text-center'>
                    <Upload className='w-6 h-6 mx-auto mb-1 text-gray-400' />
                    <Input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleImageUpload(e, 'gallery')}
                      className='hidden'
                      disabled={isUploadingImage}
                    />
                    <span className='text-xs text-gray-500'>Add Image</span>
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* DETAILS TAB */}
          <TabsContent value='details' className='space-y-4'>
            <div>
              <Label>Highlights</Label>
              <div className='space-y-2 mt-2'>
                {formData.highlights?.map((highlight, idx) => (
                  <div key={idx} className='flex gap-2'>
                    <Input
                      value={highlight}
                      onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                      placeholder='e.g., Rich history and culture'
                    />
                    <Button
                      variant='outline'
                      size='icon'
                      onClick={() => handleRemoveHighlight(idx)}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
                <Button variant='outline' size='sm' onClick={handleAddHighlight} className='w-full'>
                  <Plus className='w-4 h-4 mr-2' /> Add Highlight
                </Button>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Timezone</Label>
                <Input
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  placeholder='e.g., Asia/Damascus'
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Input
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  placeholder='e.g., USD'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Best Time to Visit</Label>
                <Input
                  value={formData.best_time_to_visit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      best_time_to_visit: e.target.value,
                    }))
                  }
                  placeholder='e.g., Spring and Fall'
                />
              </div>
              <div>
                <Label>Average Temperature</Label>
                <Input
                  value={formData.average_temp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      average_temp: e.target.value,
                    }))
                  }
                  placeholder='e.g., 20°C'
                />
              </div>
            </div>

            <div>
              <Label>Population</Label>
              <Input
                type='number'
                value={formData.population || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    population: e.target.value,
                  }))
                }
                placeholder='e.g., 1800000'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Latitude</Label>
                <Input
                  type='number'
                  step='0.000001'
                  value={formData.coordinates.lat || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, lat: e.target.value },
                    }))
                  }
                  placeholder='e.g., 33.5138'
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type='number'
                  step='0.000001'
                  value={formData.coordinates.lng || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, lng: e.target.value },
                    }))
                  }
                  placeholder='e.g., 36.2765'
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className='flex justify-end gap-3 mt-6'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createCityMutation.isPending || updateCityMutation.isPending}
          >
            {(createCityMutation.isPending || updateCityMutation.isPending) && (
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            )}
            {city ? 'Update City' : 'Create City'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminCities() {
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  //  Using Firestore for cities
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { queryDocuments } = await import('@/utils/firestore');
      return queryDocuments('cities', [], {
        orderBy: { field: 'name', direction: 'asc' },
      });
    },
  });

  const createCityMutation = useMutation({
    mutationFn: async (data) => {
      const { addDocument } = await import('@/utils/firestore');
      return addDocument('cities', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.removeQueries({ queryKey: ['destinationCities'] });
      queryClient.removeQueries({ queryKey: ['allDestinations'] });
      toast.success('City created successfully');
      setIsDialogOpen(false);
      setSelectedCity(null);
    },
    onError: (error) => {
      toast.error('Failed to create city');
      console.error(error);
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { updateDocument } = await import('@/utils/firestore');
      return updateDocument('cities', id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.removeQueries({ queryKey: ['destinationCities'] });
      queryClient.removeQueries({ queryKey: ['allDestinations'] });
      toast.success('City updated successfully');
      setIsDialogOpen(false);
      setSelectedCity(null);
    },
    onError: (error) => {
      toast.error('Failed to update city');
      console.error(error);
    },
  });

  const deleteCityMutation = useMutation({
    mutationFn: async (id) => {
      const { deleteDocument } = await import('@/utils/firestore');
      return deleteDocument('cities', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.removeQueries({ queryKey: ['destinationCities'] });
      queryClient.removeQueries({ queryKey: ['allDestinations'] });
      toast.success('City deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete city');
      console.error(error);
    },
  });

  const handleAddCity = () => {
    setSelectedCity(null);
    setIsDialogOpen(true);
  };

  const handleEditCity = (city) => {
    setSelectedCity(city);
    setIsDialogOpen(true);
  };

  const handleDeleteCity = (city) => {
    if (confirm(`Are you sure you want to delete ${city.name}?`)) {
      deleteCityMutation.mutate(city.id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout currentPage='cities'>
        <div className='flex justify-center items-center h-64'>
          <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage='cities'>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Cities Management</h1>
            <p className='text-gray-600 mt-1'>Manage cities and their information</p>
          </div>
          <Button onClick={handleAddCity} className='bg-purple-600 hover:bg-purple-700'>
            <Plus className='w-4 h-4 mr-2' />
            Add City
          </Button>
        </div>

        {cities.length === 0 ? (
          <Card>
            <CardContent className='py-16 text-center'>
              <MapPin className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-700'>No cities yet</h3>
              <p className='text-gray-500 mt-2'>Create your first city to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {cities.map((city) => (
              <Card key={city.id} className='overflow-hidden hover:shadow-lg transition-shadow'>
                <div className='relative h-48'>
                  {city.card_image ? (
                    <img
                      src={city.card_image}
                      alt={city.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full bg-gradient-to-br from-purple-500 to-pink-500' />
                  )}
                  <div className='absolute top-2 right-2 flex gap-2'>
                    {city.is_featured && (
                      <Badge className='bg-amber-500'>
                        <Star className='w-3 h-3 mr-1' /> Featured
                      </Badge>
                    )}
                    {city.is_active ? (
                      <Badge className='bg-green-500'>
                        <Eye className='w-3 h-3 mr-1' /> Active
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='bg-white'>
                        Hidden
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <h3 className='text-lg font-bold text-gray-900'>{city.name}</h3>
                      <p className='text-sm text-gray-600'>{city.country}</p>
                    </div>
                    <Badge className='bg-blue-100 text-blue-800'>
                      <ImageIcon className='w-3 h-3 mr-1' /> Image
                    </Badge>
                  </div>

                  {city.description && (
                    <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{city.description}</p>
                  )}

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditCity(city)}
                      className='flex-1'
                    >
                      <Edit className='w-3 h-3 mr-1' /> Edit
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleDeleteCity(city)}
                      className='text-red-600 hover:bg-red-50'
                    >
                      <Trash2 className='w-3 h-3' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CityFormDialog
        city={selectedCity}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCity(null);
        }}
        createCityMutation={createCityMutation}
        updateCityMutation={updateCityMutation}
      />
    </AdminLayout>
  );
}
