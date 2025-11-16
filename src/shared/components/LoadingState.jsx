import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingState({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='flex flex-col items-center gap-4'
      >
        <div className='relative'>
          <div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#E6E6FF] to-[#CCCCFF] absolute inset-0 animate-pulse`}
          />
          <Loader2 className={`${sizeClasses[size]} text-[#9933CC] animate-spin relative`} />
        </div>
        {message && (
          <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>{message}</p>
        )}
      </motion.div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className='card-responsive animate-pulse'>
      <div className='h-48 bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg mb-4' />
      <div className='h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded mb-2' />
      <div className='h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-3/4' />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
