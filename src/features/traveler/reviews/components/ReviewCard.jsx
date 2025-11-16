import { format } from 'date-fns';
import { Star, ThumbsUp, Flag, MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils';
import { updateDocument } from '@/utils/firestore';


const StarDisplay = ({ rating, showNumber = true }) => {
  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
      {showNumber && (
        <span className='ml-1 text-sm font-semibold text-gray-700'>{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

export default function ReviewCard({ review, currentUser, onUpdate }) {
  const [showResponse, setShowResponse] = useState(false);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const isReviewer = currentUser?.email === review.reviewer_email;
  const isReviewed = currentUser?.email === review.reviewed_email;
  const isAdmin = currentUser?.role_type === 'admin';

  const hasHelpful = review.helpful_by?.includes(currentUser?.email);

  const handleHelpful = async () => {
    try {
      const updatedHelpfulBy = hasHelpful
        ? review.helpful_by.filter((email) => email !== currentUser.email)
        : [...(review.helpful_by || []), currentUser.email];

      await updateDocument('reviews', review.id, {
        helpful_by: updatedHelpfulBy,
        helpful_count: updatedHelpfulBy.length,
      });

      toast.success(hasHelpful ? 'Removed from helpful' : 'Marked as helpful');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      await updateDocument('reviews', review.id, {
        host_response: response.trim(),
        host_response_date: new Date().toISOString(),
      });

      toast.success('Response submitted');
      setShowResponse(false);
      setResponse('');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subRatings = [
    { label: 'Communication', value: review.communication_rating },
    { label: 'Value', value: review.value_rating },
    { label: 'Accuracy', value: review.accuracy_rating },
    { label: 'Cleanliness', value: review.cleanliness_rating },
    { label: 'Location', value: review.location_rating },
  ].filter((r) => r.value > 0);

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-6'>
        {/* Header */}
        <div className='flex items-start justify-between gap-4 mb-4'>
          <div className='flex items-start gap-3 flex-1'>
            <Avatar className='w-12 h-12'>
              <AvatarImage src={review.reviewer_photo} />
              <AvatarFallback className='bg-purple-100 text-purple-700 font-semibold'>
                {review.reviewer_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 flex-wrap'>
                <h4 className='font-semibold text-gray-900'>{review.reviewer_name}</h4>
                {review.is_verified && (
                  <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <p className='text-sm text-gray-500'>
                {format(new Date(review.created_date), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <StarDisplay rating={review.overall_rating} />
        </div>

        {/* Sub-ratings */}
        {subRatings.length > 0 && (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 pb-4 border-b'>
            {subRatings.map((rating, idx) => (
              <div key={idx} className='flex items-center justify-between'>
                <span className='text-xs text-gray-600'>{rating.label}</span>
                <StarDisplay rating={rating.value} showNumber={false} />
              </div>
            ))}
          </div>
        )}

        {/* Comment */}
        <p className='text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap'>{review.comment}</p>

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className='mb-4'>
            <div className='flex gap-2 flex-wrap'>
              {review.photos.slice(0, 4).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Review photo ${idx + 1}`}
                  className='w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity'
                  onClick={() => setShowPhotos(true)}
                />
              ))}
              {review.photos.length > 4 && (
                <button
                  onClick={() => setShowPhotos(true)}
                  className='w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-semibold text-gray-600 hover:bg-gray-200'
                >
                  +{review.photos.length - 4}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Host Response */}
        {review.host_response && (
          <div className='mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500'>
            <div className='flex items-center gap-2 mb-2'>
              <MessageSquare className='w-4 h-4 text-purple-600' />
              <span className='text-sm font-semibold text-gray-900'>
                Response from {review.reviewed_name}
              </span>
              <span className='text-xs text-gray-500 ml-auto'>
                {format(new Date(review.host_response_date), 'MMM d, yyyy')}
              </span>
            </div>
            <p className='text-sm text-gray-700'>{review.host_response}</p>
          </div>
        )}

        {/* Actions */}
        <div className='flex items-center gap-3 mt-4 pt-4 border-t'>
          {currentUser && !isReviewer && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleHelpful}
              className={cn('gap-2', hasHelpful && 'text-purple-600')}
            >
              <ThumbsUp className={cn('w-4 h-4', hasHelpful && 'fill-current')} />
              Helpful ({review.helpful_count || 0})
            </Button>
          )}

          {isReviewed && !review.host_response && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowResponse(!showResponse)}
              className='gap-2'
            >
              <MessageSquare className='w-4 h-4' />
              Respond
            </Button>
          )}

          {(isAdmin || isReviewed) && (
            <Button
              variant='ghost'
              size='sm'
              className='gap-2 text-red-600 hover:text-red-700 ml-auto'
            >
              <Flag className='w-4 h-4' />
              Report
            </Button>
          )}
        </div>

        {/* Response Form */}
        {showResponse && (
          <div className='mt-4 p-4 bg-gray-50 rounded-lg space-y-3'>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder='Write your response...'
              rows={3}
            />
            <div className='flex gap-2'>
              <Button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !response.trim()}
                size='sm'
                className='bg-purple-600 hover:bg-purple-700'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className='w-4 h-4 mr-2' />
                    Send Response
                  </>
                )}
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setShowResponse(false);
                  setResponse('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Photo Lightbox */}
      {showPhotos && (
        <div
          className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4'
          onClick={() => setShowPhotos(false)}
        >
          <button
            onClick={() => setShowPhotos(false)}
            className='absolute top-4 right-4 text-white hover:text-gray-300'
          >
            <X className='w-8 h-8' />
          </button>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl'>
            {review.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`Review photo ${idx + 1}`}
                className='max-h-[80vh] object-contain rounded-lg'
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
