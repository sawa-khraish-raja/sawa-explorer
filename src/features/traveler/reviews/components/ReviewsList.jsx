import { format } from 'date-fns';
import { Star, ThumbsUp } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/ui/card';

export default function ReviewsList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className='p-12 text-center'>
          <p className='text-gray-500'>No reviews yet</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate rating breakdown
  const ratingBreakdown = {
    5: reviews.filter((r) => r.overall_rating === 5).length,
    4: reviews.filter((r) => r.overall_rating === 4).length,
    3: reviews.filter((r) => r.overall_rating === 3).length,
    2: reviews.filter((r) => r.overall_rating === 2).length,
    1: reviews.filter((r) => r.overall_rating === 1).length,
  };

  const avgRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;

  return (
    <div className='space-y-6'>
      {/* Overall Rating Summary */}
      <Card>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='text-center'>
              <div className='text-5xl font-bold text-gray-900 mb-2'>{avgRating.toFixed(1)}</div>
              <div className='flex items-center justify-center gap-1 mb-2'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={
                      star <= Math.round(avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }
                    size={20}
                  />
                ))}
              </div>
              <p className='text-gray-600'>{reviews.length} reviews</p>
            </div>

            <div className='space-y-2'>
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className='flex items-center gap-3'>
                  <div className='flex items-center gap-1 w-16'>
                    <span className='text-sm font-medium'>{star}</span>
                    <Star size={14} className='fill-yellow-400 text-yellow-400' />
                  </div>
                  <div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-yellow-400'
                      style={{ width: `${(ratingBreakdown[star] / reviews.length) * 100}%` }}
                    />
                  </div>
                  <span className='text-sm text-gray-600 w-8 text-right'>
                    {ratingBreakdown[star]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      <div className='space-y-4'>
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                {review.reviewer_photo ? (
                  <img
                    src={review.reviewer_photo}
                    alt={review.reviewer_name}
                    className='w-12 h-12 rounded-full object-cover'
                  />
                ) : (
                  <div className='w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold'>
                    {(review.reviewer_name || 'T').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className='flex-1'>
                  <div className='flex items-center justify-between mb-2'>
                    <div>
                      <p className='font-semibold text-gray-900'>{review.reviewer_name}</p>
                      <p className='text-sm text-gray-500'>
                        {format(new Date(review.created_date), 'MMMM yyyy')}
                      </p>
                    </div>
                    <div className='flex items-center gap-1'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= review.overall_rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <p className='text-gray-700 leading-relaxed mb-3'>{review.comment}</p>

                  {/* Review Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className='flex gap-2 mb-3'>
                      {review.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Review ${idx + 1}`}
                          className='w-20 h-20 rounded-lg object-cover'
                        />
                      ))}
                    </div>
                  )}

                  {/* Helpful Counter */}
                  <div className='flex items-center gap-4 text-sm text-gray-600'>
                    <button className='flex items-center gap-1 hover:text-purple-600 transition-colors'>
                      <ThumbsUp size={14} />
                      <span>Helpful ({review.helpful_count || 0})</span>
                    </button>
                  </div>

                  {/* Host Response */}
                  {review.host_response && (
                    <div className='mt-4 pl-4 border-l-2 border-purple-200 bg-purple-50 p-3 rounded-r-lg'>
                      <p className='text-sm font-semibold text-purple-900 mb-1'>
                        Response from host
                      </p>
                      <p className='text-sm text-gray-700'>{review.host_response}</p>
                      {review.host_response_date && (
                        <p className='text-xs text-gray-500 mt-1'>
                          {format(new Date(review.host_response_date), 'MMMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
