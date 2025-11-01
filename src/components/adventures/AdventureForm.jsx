import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, DollarSign, Info } from 'lucide-react';
import { calculateAdventureCommissions } from './commissionCalculator';
import { base44 } from '@/api/base44Client'; // ⚠️ TODO: Migrate image upload to Firebase Storage
import { toast } from 'sonner';

export default function AdventureForm({ adventure, hostType, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: adventure?.title || '',
    description: adventure?.description || '',
    city: adventure?.city || 'Damascus',
    date: adventure?.date ? new Date(adventure.date).toISOString().slice(0, 16) : '',
    duration_hours: adventure?.duration_hours || 4,
    max_participants: adventure?.max_participants || 10,
    host_price: adventure?.host_price || 50,
    category: adventure?.category || 'Cultural',
    difficulty: adventure?.difficulty || 'Easy',
    meeting_point: adventure?.meeting_point || '',
    included: adventure?.included || [],
    image_url: adventure?.image_url || '',
    gallery_images: adventure?.gallery_images || [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [commissionBreakdown, setCommissionBreakdown] = useState({
    hostReceives: 0,
    sawaAmount: 0,
    officeAmount: 0,
    travelerPays: 0,
    sawaPercent: 0,
    officePercent: 0,
    breakdown: [],
  });
  const [includedItem, setIncludedItem] = useState('');

  // Calculate commissions whenever price changes or hostType changes
  useEffect(() => {
    const price = parseFloat(formData.host_price);
    if (!isNaN(price) && price >= 0) {
      let commissionHostType;

      if (hostType === 'admin') {
        commissionHostType = 'admin';
      } else if (hostType === 'office') {
        commissionHostType = 'office_entity';
      } else if (hostType === 'freelancer') {
        commissionHostType = 'freelancer';
      } else if (hostType === 'office_host') {
        commissionHostType = 'office_host_linked';
      } else {
        commissionHostType = 'freelancer';
      }

      const commissions = calculateAdventureCommissions(price, commissionHostType);
      setCommissionBreakdown(commissions);
    } else {
      setCommissionBreakdown({
        hostReceives: 0,
        sawaAmount: 0,
        officeAmount: 0,
        travelerPays: 0,
        sawaPercent: 0,
        officePercent: 0,
        breakdown: [],
      });
    }
  }, [formData.host_price, hostType]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleImageUpload = async (e, isGallery = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (isGallery) {
        setFormData((prev) => ({
          ...prev,
          gallery_images: [...prev.gallery_images, file_url].slice(0, 5),
        }));
      } else {
        setFormData((prev) => ({ ...prev, image_url: file_url }));
      }

      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const addIncludedItem = () => {
    if (includedItem.trim() && !formData.included.includes(includedItem.trim())) {
      setFormData((prev) => ({
        ...prev,
        included: [...prev.included, includedItem.trim()],
      }));
      setIncludedItem('');
    }
  };

  const removeIncludedItem = (item) => {
    setFormData((prev) => ({
      ...prev,
      included: prev.included.filter((i) => i !== item),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.title ||
      !formData.description ||
      !formData.city ||
      !formData.date ||
      !formData.host_price
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    // Ensure numeric fields are correctly parsed
    const hostPriceNum = Number(formData.host_price);
    const durationHoursNum = Number(formData.duration_hours);
    const maxParticipantsNum = Number(formData.max_participants);

    //  Build clean submission data for Firestore
    const submissionData = {
      // Basic Info
      title: formData.title,
      description: formData.description,
      short_description: formData.description?.substring(0, 150),

      // Location
      city: formData.city,
      city_name: formData.city, //  Firestore schema field
      // city_id will be set by parent component

      // Date & Time
      date: formData.date,
      duration: `${durationHoursNum} hours`, //  Convert to string format

      // Capacity
      max_guests: maxParticipantsNum, //  Firestore uses max_guests not max_participants
      min_guests: 1,

      // Pricing
      price: commissionBreakdown.travelerPays, //  Firestore uses price field
      host_price: hostPriceNum, // Keep for commission tracking
      currency: 'USD',

      // Details
      category: formData.category,
      difficulty: formData.difficulty,
      meeting_point: formData.meeting_point,
      what_included: formData.included, //  Firestore uses what_included

      // Images
      images: [formData.image_url, ...formData.gallery_images].filter(Boolean), //  Combine into single images array

      // Commission Data
      sawa_commission_amount: commissionBreakdown.sawaAmount,
      office_commission_amount: commissionBreakdown.officeAmount,
      commission_breakdown: {
        host_receives: commissionBreakdown.hostReceives,
        sawa_percent: commissionBreakdown.sawaPercent,
        sawa_amount: commissionBreakdown.sawaAmount,
        office_percent: commissionBreakdown.officePercent,
        office_amount: commissionBreakdown.officeAmount,
        traveler_pays: commissionBreakdown.travelerPays,
      },
    };

    console.log(' Submitting adventure data:', submissionData);
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Main Image */}
      <div>
        <Label>Main Image *</Label>
        <div className='mt-2'>
          {formData.image_url ? (
            <div className='relative w-full aspect-video rounded-lg overflow-hidden'>
              <img src={formData.image_url} alt='Main' className='w-full h-full object-cover' />
              <Button
                type='button'
                size='icon'
                variant='destructive'
                className='absolute top-2 right-2'
                onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          ) : (
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'>
              <Input
                type='file'
                accept='image/*'
                onChange={(e) => handleImageUpload(e, false)}
                className='hidden'
                id='main-image'
                disabled={uploadingImage}
              />
              <Label htmlFor='main-image' className='cursor-pointer'>
                {uploadingImage ? (
                  <Loader2 className='w-8 h-8 animate-spin mx-auto text-gray-400' />
                ) : (
                  <>
                    <Upload className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                    <p className='text-sm text-gray-600'>Click to upload main image</p>
                  </>
                )}
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Images */}
      <div>
        <Label>Gallery Images (Max 5)</Label>
        <div className='mt-2 grid grid-cols-5 gap-2'>
          {formData.gallery_images.map((img, idx) => (
            <div key={idx} className='relative aspect-square rounded-lg overflow-hidden'>
              <img src={img} alt={`Gallery ${idx + 1}`} className='w-full h-full object-cover' />
              <Button
                type='button'
                size='icon'
                variant='destructive'
                className='absolute top-1 right-1 h-6 w-6'
                onClick={() => removeGalleryImage(idx)}
              >
                <X className='w-3 h-3' />
              </Button>
            </div>
          ))}

          {formData.gallery_images.length < 5 && (
            <div className='border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center'>
              <Input
                type='file'
                accept='image/*'
                onChange={(e) => handleImageUpload(e, true)}
                className='hidden'
                id='gallery-image'
                disabled={uploadingImage}
              />
              <Label htmlFor='gallery-image' className='cursor-pointer'>
                {uploadingImage ? (
                  <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                ) : (
                  <Upload className='w-6 h-6 text-gray-400' />
                )}
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='title'>
            Title <span className='text-red-500 ml-1'>*</span>
          </Label>
          <Input
            id='title'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            placeholder='e.g., Old Damascus Walking Tour'
            required
          />
        </div>

        <div>
          <Label htmlFor='city'>
            City <span className='text-red-500 ml-1'>*</span>
          </Label>
          <Select
            value={formData.city}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Damascus'>Damascus</SelectItem>
              <SelectItem value='Amman'>Amman</SelectItem>
              <SelectItem value='Istanbul'>Istanbul</SelectItem>
              <SelectItem value='Cairo'>Cairo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor='description'>
          Description <span className='text-red-500 ml-1'>*</span>
        </Label>
        <Textarea
          id='description'
          name='description'
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          placeholder='Describe your adventure in detail...'
          required
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='category'>
            Category <span className='text-red-500 ml-1'>*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Cultural'>Cultural</SelectItem>
              <SelectItem value='Food & Dining'>Food & Dining</SelectItem>
              <SelectItem value='Nature'>Nature</SelectItem>
              <SelectItem value='Adventure'>Adventure</SelectItem>
              <SelectItem value='Historical'>Historical</SelectItem>
              <SelectItem value='Nightlife'>Nightlife</SelectItem>
              <SelectItem value='Shopping'>Shopping</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor='difficulty'>Difficulty</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Easy'>Easy</SelectItem>
              <SelectItem value='Moderate'>Moderate</SelectItem>
              <SelectItem value='Challenging'>Challenging</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-4'>
        <div>
          <Label htmlFor='date'>
            Date & Time <span className='text-red-500 ml-1'>*</span>
          </Label>
          <Input
            id='date'
            name='date'
            type='datetime-local'
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor='duration_hours'>
            Duration (hours) <span className='text-red-500 ml-1'>*</span>
          </Label>
          <Input
            id='duration_hours'
            name='duration_hours'
            type='number'
            min='1'
            max='24'
            value={formData.duration_hours}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor='max_participants'>
            Max Participants <span className='text-red-500 ml-1'>*</span>
          </Label>
          <Input
            id='max_participants'
            name='max_participants'
            type='number'
            min='1'
            value={formData.max_participants}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      {/* Pricing */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
          <DollarSign className='w-5 h-5 text-[#7B2CBF]' />
          Pricing
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='host_price'>
              {hostType === 'admin'
                ? 'Traveler Price (USD)'
                : hostType === 'office'
                  ? 'Office Receives (USD)'
                  : 'You Receive (USD)'}
              <span className='text-red-500 ml-1'>*</span>
            </Label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                id='host_price'
                name='host_price'
                type='number'
                step='0.01'
                min='0'
                value={formData.host_price}
                onChange={handleInputChange}
                required
                placeholder='Enter price'
                className='pl-10'
              />
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              {hostType === 'admin'
                ? 'Final price travelers will pay (no commission)'
                : 'The amount you will receive per participant'}
            </p>
          </div>

          {/* Commission Breakdown */}
          {commissionBreakdown.travelerPays > 0 && hostType !== 'admin' ? (
            <div className='bg-purple-50 border-2 border-purple-200 rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Info className='w-5 h-5 text-purple-600' />
                <h4 className='font-semibold text-purple-900'>Commission Breakdown</h4>
              </div>

              <div className='space-y-2'>
                {commissionBreakdown.breakdown.map((item, idx) => (
                  <div key={idx} className='flex justify-between text-sm'>
                    <span
                      className={
                        item.type === 'host'
                          ? 'font-semibold text-gray-900'
                          : item.type === 'sawa'
                            ? 'text-purple-700'
                            : item.type === 'office'
                              ? 'text-blue-700'
                              : 'text-gray-600'
                      }
                    >
                      {item.label}:
                    </span>
                    <span className='font-semibold'>${item.amount.toFixed(2)}</span>
                  </div>
                ))}

                <div className='pt-2 border-t-2 border-purple-300 flex justify-between text-base font-bold'>
                  <span className='text-purple-900'>Traveler Pays:</span>
                  <span className='text-purple-900'>
                    ${commissionBreakdown.travelerPays.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className='mt-3 pt-3 border-t border-purple-200'>
                <p className='text-xs text-purple-700 font-medium'>
                  {hostType === 'freelancer' && '💡 35% SAWA commission added on top'}
                  {hostType === 'office_host' && '💡 28% SAWA + 7% Office commission added on top'}
                  {hostType === 'office' && '💡 35% SAWA commission added on top'}
                </p>
              </div>
            </div>
          ) : (
            hostType === 'admin' && (
              <div className='bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center gap-3'>
                <Info className='w-5 h-5 text-blue-600 flex-shrink-0' />
                <p className='text-sm text-blue-800'>
                  <strong>Admin Mode:</strong> No commission applied. Price is final for travelers.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Meeting Point */}
      <div>
        <Label htmlFor='meeting_point'>
          Meeting Point <span className='text-red-500 ml-1'>*</span>
        </Label>
        <Input
          id='meeting_point'
          name='meeting_point'
          value={formData.meeting_point}
          onChange={handleInputChange}
          placeholder='e.g., Umayyad Square, next to the fountain'
          required
        />
      </div>

      {/* What's Included */}
      <div>
        <Label>What's Included</Label>
        <div className='flex gap-2 mt-2'>
          <Input
            value={includedItem}
            onChange={(e) => setIncludedItem(e.target.value)}
            placeholder='e.g., Traditional lunch'
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIncludedItem())}
          />
          <Button type='button' onClick={addIncludedItem}>
            Add
          </Button>
        </div>
        <div className='flex flex-wrap gap-2 mt-2'>
          {formData.included.map((item, idx) => (
            <Badge key={idx} variant='secondary' className='flex items-center gap-1'>
              {item}
              <X className='w-3 h-3 cursor-pointer' onClick={() => removeIncludedItem(item)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className='flex justify-end gap-3 pt-4 border-t'>
        <Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting} className='bg-[#7B2CBF] hover:bg-[#6A1FA0]'>
          {isSubmitting ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin mr-2' /> Saving...
            </>
          ) : adventure ? (
            'Update Adventure'
          ) : (
            'Create Adventure'
          )}
        </Button>
      </div>
    </form>
  );
}
