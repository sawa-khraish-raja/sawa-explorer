import { Star, Upload, X, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';
import { addDocument, queryDocuments, updateDocument } from '@/utils/firestore';

import { UseAppContext } from "@/shared/context/AppContext";

const StarRating = ({ value, onChange, label, required = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <Label className='text-sm font-medium mb-2 block'>
        {label} {required && <span className='text-red-500'>*</span>}
      </Label>
      <div className='flex items-center gap-1'>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type='button'
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className='transition-all hover:scale-110'
          >
            <Star
              className={cn(
                'w-8 h-8 transition-colors',
                (hover || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className='ml-2 text-sm font-semibold text-gray-700'>
            {value === 5
              ? 'Excellent!'
              : value === 4
                ? 'Great!'
                : value === 3
                  ? 'Good'
                  : value === 2
                    ? 'Fair'
                    : 'Poor'}
          </span>
        )}
      </div>
    </div>
  );
};

export default function ReviewForm({
  bookingId,
  adventureId,
  reviewedEmail,
  reviewedName,
  reviewedUserId, // Add this prop for Firestore user ID
  reviewType, // 'traveler_to_host', 'host_to_traveler', 'adventure_review'
  city,
  onSuccess,
}) {
  const { user } = UseAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    overall_rating: 0,
    communication_rating: 0,
    value_rating: 0,
    accuracy_rating: 0,
    cleanliness_rating: 0,
    location_rating: 0,
    comment: '',
    photos: [],
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Migrate to Firebase Storage
      // For now, disable photo uploads until Firebase Storage is set up
      toast.info('Photo uploads coming soon!');
      // const uploadPromises = files.map((file) => uploadToFirebaseStorage(file));
      // const urls = await Promise.all(uploadPromises);
      // setFormData((prev) => ({
      //   ...prev,
      //   photos: [...prev.photos, ...urls],
      // }));
    } catch {
      toast.error('Failed to upload photos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to submit a review');
      return;
    }

    if (formData.overall_rating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    if (!formData.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        booking_id: bookingId,
        adventure_id: adventureId,
        reviewer_id: user.id,
        reviewer_email: user.email,
        reviewer_name: user.full_name || user.email.split('@')[0],
        reviewer_photo: user.profile_photo,
        reviewed_user_id: reviewedUserId,
        reviewed_email: reviewedEmail,
        reviewed_name: reviewedName,
        review_type: reviewType,
        city: city,
        overall_rating: formData.overall_rating,
        comment: formData.comment.trim(),
        photos: formData.photos,
        is_verified: true,
        status: 'published',
        created_at: new Date().toISOString(),
      };

      // Add sub-ratings based on review type
      if (reviewType === 'traveler_to_host' || reviewType === 'adventure_review') {
        reviewData.communication_rating = formData.communication_rating;
        reviewData.value_rating = formData.value_rating;
        reviewData.accuracy_rating = formData.accuracy_rating;
        if (reviewType === 'adventure_review') {
          reviewData.location_rating = formData.location_rating;
        }
      }

      if (reviewType === 'traveler_to_host') {
        reviewData.cleanliness_rating = formData.cleanliness_rating;
      }

      await addDocument('reviews', reviewData);

      // Update reviewed user's rating
      await updateUserRating(reviewedUserId);

      toast.success('Review submitted successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserRating = async (userId) => {
    try {
      // Get all published reviews for this user
      const allReviews = await queryDocuments('reviews', [
        ['reviewed_user_id', '==', userId],
        ['status', '==', 'published'],
      ]);

      if (allReviews.length > 0) {
        const avgRating =
          allReviews.reduce((sum, r) => sum + r.overall_rating, 0) / allReviews.length;

        // Update user's rating
        await updateDocument('users', userId, {
          rating: parseFloat(avgRating.toFixed(2)),
        });
      }
    } catch (error) {
      console.error('Failed to update user rating:', error);
    }
  };

  const showSubRatings = reviewType === 'traveler_to_host' || reviewType === 'adventure_review';

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your experience with {reviewedName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Overall Rating */}
          <StarRating
            label='Overall Rating'
            value={formData.overall_rating}
            onChange={(val) => setFormData((prev) => ({ ...prev, overall_rating: val }))}
            required
          />

          {/* Sub-ratings */}
          {showSubRatings && (
            <div className='space-y-4 pt-4 border-t'>
              <h4 className='font-semibold text-gray-900'>Detailed Ratings</h4>

              <StarRating
                label='Communication'
                value={formData.communication_rating}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    communication_rating: val,
                  }))
                }
              />

              <StarRating
                label='Value for Money'
                value={formData.value_rating}
                onChange={(val) => setFormData((prev) => ({ ...prev, value_rating: val }))}
              />

              <StarRating
                label='Accuracy'
                value={formData.accuracy_rating}
                onChange={(val) => setFormData((prev) => ({ ...prev, accuracy_rating: val }))}
              />

              {reviewType === 'traveler_to_host' && (
                <StarRating
                  label='Cleanliness'
                  value={formData.cleanliness_rating}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      cleanliness_rating: val,
                    }))
                  }
                />
              )}

              {reviewType === 'adventure_review' && (
                <StarRating
                  label='Location'
                  value={formData.location_rating}
                  onChange={(val) => setFormData((prev) => ({ ...prev, location_rating: val }))}
                />
              )}
            </div>
          )}

          {/* Comment */}
          <div>
            <Label htmlFor='comment'>Your Review *</Label>
            <Textarea
              id='comment'
              value={formData.comment}
              onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder='Share details about your experience...'
              rows={5}
              className='mt-2'
              required
            />
            <p className='text-xs text-gray-500 mt-1'>{formData.comment.length} characters</p>
          </div>

          {/* Photos */}
          <div>
            <Label>Add Photos (Optional)</Label>
            <div className='mt-2'>
              {formData.photos.length < 5 && (
                <label className='cursor-pointer'>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handlePhotoUpload}
                    className='hidden'
                    disabled={isSubmitting}
                  />
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors'>
                    <Upload className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>Click to upload photos (max 5)</p>
                  </div>
                </label>
              )}

              {formData.photos.length > 0 && (
                <div className='grid grid-cols-3 gap-3 mt-3'>
                  {formData.photos.map((photo, index) => (
                    <div key={index} className='relative group'>
                      <img
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className='w-full h-32 object-cover rounded-lg'
                      />
                      <button
                        type='button'
                        onClick={() => removePhoto(index)}
                        className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type='submit'
            disabled={isSubmitting || formData.overall_rating === 0 || !formData.comment.trim()}
            className='w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Submitting...
              </>
            ) : (
              <>
                <Send className='w-4 h-4 mr-2' />
                Submit Review
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
