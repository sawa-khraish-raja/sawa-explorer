import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReviewStats({ reviews }) {
  if (!reviews || reviews.length === 0) return null;

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / totalReviews;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => Math.floor(r.overall_rating) === rating).length,
    percentage:
      (reviews.filter((r) => Math.floor(r.overall_rating) === rating).length / totalReviews) * 100,
  }));

  const subRatings = [
    {
      label: 'Communication',
      avg:
        reviews
          .filter((r) => r.communication_rating)
          .reduce((sum, r) => sum + r.communication_rating, 0) /
          reviews.filter((r) => r.communication_rating).length || 0,
    },
    {
      label: 'Value',
      avg:
        reviews.filter((r) => r.value_rating).reduce((sum, r) => sum + r.value_rating, 0) /
          reviews.filter((r) => r.value_rating).length || 0,
    },
    {
      label: 'Accuracy',
      avg:
        reviews.filter((r) => r.accuracy_rating).reduce((sum, r) => sum + r.accuracy_rating, 0) /
          reviews.filter((r) => r.accuracy_rating).length || 0,
    },
    {
      label: 'Cleanliness',
      avg:
        reviews
          .filter((r) => r.cleanliness_rating)
          .reduce((sum, r) => sum + r.cleanliness_rating, 0) /
          reviews.filter((r) => r.cleanliness_rating).length || 0,
    },
  ].filter((r) => r.avg > 0);

  return (
    <Card className='border-2 border-purple-100'>
      <CardContent className='p-6'>
        <div className='grid md:grid-cols-2 gap-6'>
          {/* Overall Rating */}
          <div className='flex flex-col items-center justify-center'>
            <div className='text-6xl font-bold text-gray-900 mb-2'>{averageRating.toFixed(1)}</div>
            <div className='flex items-center gap-1 mb-2'>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-6 h-6',
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <p className='text-gray-600'>
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className='space-y-2'>
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className='flex items-center gap-3'>
                <span className='text-sm font-medium w-12'>
                  {rating} <Star className='w-3 h-3 inline fill-yellow-400 text-yellow-400' />
                </span>
                <div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all'
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className='text-sm text-gray-600 w-12 text-right'>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-ratings */}
        {subRatings.length > 0 && (
          <div className='mt-6 pt-6 border-t'>
            <h4 className='font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-purple-600' />
              Detailed Ratings
            </h4>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {subRatings.map((rating, idx) => (
                <div key={idx} className='text-center p-3 bg-purple-50 rounded-lg'>
                  <div className='text-2xl font-bold text-purple-900'>{rating.avg.toFixed(1)}</div>
                  <div className='text-xs text-gray-600 mt-1'>{rating.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
