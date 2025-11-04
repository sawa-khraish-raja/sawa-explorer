import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { queryDocuments } from '@/utils/firestore';

import { useAppContext } from '../components/context/AppContext';
import ReviewForm from '../components/reviews/ReviewForm';

export default function WriteReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userLoading } = useAppContext();
  const [checked, setChecked] = useState(false);

  const bookingId = searchParams.get('bookingId');
  const adventureId = searchParams.get('adventureId');
  const reviewedEmail = searchParams.get('reviewedEmail');
  const reviewedName = searchParams.get('reviewedName');
  const reviewedUserId = searchParams.get('reviewedUserId');
  const reviewType = searchParams.get('reviewType');
  const city = searchParams.get('city');

  useEffect(() => {
    async function checkExistingReview() {
      if (userLoading) return;

      if (!user) {
        toast.info('Please sign in to write a review');
        navigate(createPageUrl('Home'));
        return;
      }

      try {
        // Check if already reviewed
        const existingReviews = await queryDocuments('reviews', [
          ['booking_id', '==', bookingId || adventureId],
          ['reviewer_id', '==', user.id],
        ]);

        if (existingReviews.length > 0) {
          toast.info('You have already reviewed this booking');
          navigate(-1);
          return;
        }

        setChecked(true);
      } catch (error) {
        console.error('Error checking reviews:', error);
        toast.error('Failed to load review data');
      }
    }
    checkExistingReview();
  }, [user, userLoading, bookingId, adventureId, navigate]);

  if (userLoading || !checked) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        {/* Back Button */}
        <Button variant='ghost' onClick={() => navigate(-1)} className='mb-6'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back
        </Button>

        <ReviewForm
          bookingId={bookingId}
          adventureId={adventureId}
          reviewedEmail={reviewedEmail}
          reviewedName={reviewedName}
          reviewedUserId={reviewedUserId}
          reviewType={reviewType}
          city={city}
          onSuccess={() => {
            navigate(createPageUrl('MyOffers'));
          }}
        />
      </div>
    </div>
  );
}
