import { CheckCircle, Home, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

export default function AccountDeleted() {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4'>
      <Card className='max-w-2xl w-full shadow-2xl border-2 border-purple-200'>
        <CardContent className='p-8 sm:p-12 text-center'>
          <div className='flex justify-center mb-6'>
            <div className='w-20 h-20 rounded-full bg-green-100 flex items-center justify-center'>
              <CheckCircle className='w-12 h-12 text-green-600' />
            </div>
          </div>

          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
            Account Deletion Scheduled
          </h1>

          <p className='text-lg text-gray-600 mb-6'>
            Your account has been scheduled for deletion. You'll receive a confirmation email
            shortly.
          </p>

          <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 text-left'>
            <h3 className='font-semibold text-blue-900 mb-3 flex items-center gap-2'>
              <Mail className='w-5 h-5' />
              What happens next?
            </h3>
            <ul className='space-y-2 text-sm text-blue-900'>
              <li className='flex items-start gap-2'>
                <div className='w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                <span>You'll receive a confirmation email with details</span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                <span>Your account is now inactive</span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                <span>You have 30 days to cancel this request</span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                <span>After 30 days, your data will be permanently deleted</span>
              </li>
            </ul>
          </div>

          <div className='bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-8'>
            <p className='text-sm text-yellow-900'>
              <strong>Changed your mind?</strong> You can cancel the deletion by logging in within
              30 days.
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              onClick={() => navigate(createPageUrl('Home'))}
              variant='outline'
              className='gap-2'
            >
              <Home className='w-4 h-4' />
              Go to Homepage
            </Button>
          </div>

          <p className='text-sm text-gray-500 mt-8'>
            We're sorry to see you go. If you have any feedback or questions,{' '}
            <a href={createPageUrl('CustomerSupport')} className='text-purple-600 hover:underline'>
              contact our support team
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
