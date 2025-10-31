import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReviewForm from '../components/reviews/ReviewForm';

export default function WriteReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const bookingId = searchParams.get('bookingId');
  const adventureId = searchParams.get('adventureId');
  const reviewedEmail = searchParams.get('reviewedEmail');
  const reviewedName = searchParams.get('reviewedName');
  const reviewType = searchParams.get('reviewType');
  const city = searchParams.get('city');

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Check if already reviewed
        const existingReviews = await base44.entities.Review.filter({
          booking_id: bookingId || adventureId,
          reviewer_email: currentUser.email
        });

        if (existingReviews.length > 0) {
          alert('You have already reviewed this booking');
          navigate(-1);
        }
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    }
    fetchUser();
  }, [bookingId, adventureId, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <ReviewForm
          bookingId={bookingId}
          adventureId={adventureId}
          reviewedEmail={reviewedEmail}
          reviewedName={reviewedName}
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