import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';


export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  onRetry,
  showRetry = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex flex-col items-center justify-center p-8 text-center'
    >
      <div className='w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mb-4'>
        <AlertCircle className='w-8 h-8 sm:w-10 sm:h-10 text-red-600' />
      </div>

      <h3 className='text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words px-4'>{title}</h3>

      <p className='text-sm sm:text-base text-gray-600 mb-6 max-w-md break-words px-4'>{message}</p>

      {showRetry && onRetry && (
        <Button
          onClick={onRetry}
          className='bg-[#9933CC] hover:bg-[#7B2CBF] text-white flex items-center gap-2'
        >
          <RefreshCw className='w-4 h-4' />
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

export function EmptyState({
  title = 'No data found',
  message = 'There are no items to display.',
  icon: Icon = AlertCircle,
  action,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className='flex flex-col items-center justify-center p-8 sm:p-12 text-center'
    >
      <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#E6E6FF] to-[#CCCCFF] rounded-full flex items-center justify-center mb-4'>
        <Icon className='w-8 h-8 sm:w-10 sm:h-10 text-[#9933CC]' />
      </div>

      <h3 className='text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words px-4'>{title}</h3>

      <p className='text-sm sm:text-base text-gray-600 mb-6 max-w-md break-words px-4'>{message}</p>

      {action && <div className='mt-4'>{action}</div>}
    </motion.div>
  );
}
