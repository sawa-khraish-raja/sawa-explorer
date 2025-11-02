import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessageStatus({ message, currentUserEmail }) {
  // Only show status for messages sent by current user
  if (message.sender_email !== currentUserEmail) {
    return null;
  }

  const isDelivered = message.delivered_to && message.delivered_to.length > 0;
  const isRead = message.read_by && message.read_by.length > 1; // More than just sender
  const isPending = message._isPending;

  return (
    <div className='flex items-center gap-1 text-xs'>
      {isPending ? (
        <Clock className='w-3 h-3 text-gray-400' />
      ) : isRead ? (
        <CheckCheck className='w-4 h-4 text-blue-500' />
      ) : isDelivered ? (
        <CheckCheck className='w-4 h-4 text-gray-400' />
      ) : (
        <Check className='w-3 h-3 text-gray-400' />
      )}

      {isPending && <span className='text-gray-400'>Sending...</span>}
      {!isPending && isRead && <span className='text-blue-500'>Read</span>}
      {!isPending && isDelivered && !isRead && <span className='text-gray-400'>Delivered</span>}
      {!isPending && !isDelivered && <span className='text-gray-400'>Sent</span>}
    </div>
  );
}
