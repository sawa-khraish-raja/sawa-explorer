import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#7B2CBF] via-[#9D4EDD] to-[#C77DFF] flex items-center justify-center p-6'>
      <div className='max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center'>
        <div className='w-20 h-20 bg-[#7B2CBF]/10 rounded-full flex items-center justify-center mx-auto mb-6'>
          <img
            src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/03ed85280_WhatsAppImage2025-10-16at235514_a21dd7ce.jpg'
            alt='SAWA'
            className='w-16 h-16 rounded-full object-cover'
          />
        </div>

        <h1 className='text-6xl font-bold text-[#7B2CBF] mb-4'>404</h1>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Page Not Found</h2>
        <p className='text-gray-600 mb-8'>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className='space-y-3'>
          <Button onClick={() => navigate(-1)} variant='outline' className='w-full'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Go Back
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className='w-full bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] hover:from-[#6A1BAE] hover:to-[#8C3DCC]'
          >
            <Home className='w-4 h-4 mr-2' />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
