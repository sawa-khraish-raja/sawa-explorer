import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReviewPrompt({ 
  bookingId, 
  adventureId,
  reviewedEmail, 
  reviewedName,
  reviewType,
  city
}) {
  const navigate = useNavigate();

  const handleWriteReview = () => {
    const params = new URLSearchParams({
      bookingId: bookingId || '',
      adventureId: adventureId || '',
      reviewedEmail,
      reviewedName,
      reviewType,
      city: city || ''
    });
    navigate(`${createPageUrl('WriteReview')}?${params.toString()}`);
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-purple-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              How was your experience?
            </h3>
            <p className="text-gray-600 text-sm">
              Share your experience with {reviewedName} to help future travelers
            </p>
          </div>

          <Button
            onClick={handleWriteReview}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full sm:w-auto"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Write Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}