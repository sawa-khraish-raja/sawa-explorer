import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showNotification } from '../notifications/NotificationManager';

export function BookingID({ booking, size = 'default', showCopy = true }) {
  const [copied, setCopied] = React.useState(false);

  if (!booking || !booking.id) return null;

  const shortId = booking.id.substring(0, 8).toUpperCase();

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    showNotification({
      title: 'Copied',
      message: 'Booking ID copied to clipboard',
      type: 'success',
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    large: 'text-base px-3 py-1.5',
  };

  return (
    <div className='inline-flex items-center gap-1.5'>
      <span
        className={`font-mono ${sizeClasses[size]} bg-gray-100 text-gray-700 rounded border border-gray-300`}
      >
        #{shortId}
      </span>
      {showCopy && (
        <Button
          variant='ghost'
          size='icon'
          onClick={handleCopy}
          className='h-6 w-6 hover:bg-gray-100'
        >
          {copied ? (
            <Check className='w-3 h-3 text-green-600' />
          ) : (
            <Copy className='w-3 h-3 text-gray-500' />
          )}
        </Button>
      )}
    </div>
  );
}

export function UserID({ user, size = 'default', showCopy = true }) {
  const [copied, setCopied] = React.useState(false);

  if (!user || !user.id) return null;

  const shortId = user.id.substring(0, 8).toUpperCase();

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    showNotification({
      title: 'Copied',
      message: 'User ID copied to clipboard',
      type: 'success',
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    large: 'text-base px-3 py-1.5',
  };

  return (
    <div className='inline-flex items-center gap-1.5'>
      <span
        className={`font-mono ${sizeClasses[size]} bg-blue-100 text-blue-700 rounded border border-blue-300`}
      >
        #{shortId}
      </span>
      {showCopy && (
        <Button
          variant='ghost'
          size='icon'
          onClick={handleCopy}
          className='h-6 w-6 hover:bg-gray-100'
        >
          {copied ? (
            <Check className='w-3 h-3 text-green-600' />
          ) : (
            <Copy className='w-3 h-3 text-gray-500' />
          )}
        </Button>
      )}
    </div>
  );
}
