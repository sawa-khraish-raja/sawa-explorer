
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Briefcase,
  MessageSquare,
  CheckCircle,
  XCircle,
  DollarSign,
  Star,
  Trash2,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';

const NOTIFICATION_ICONS = {
  booking_request: Briefcase,
  booking_accepted: CheckCircle,
  offer_received: Bell,
  offer_accepted: CheckCircle,
  message_received: MessageSquare,
  booking_confirmed: CheckCircle,
  booking_cancelled: XCircle,
  payment_received: DollarSign,
  review_received: Star,
  reel_liked: Star,
  host_assigned_to_office: Briefcase,
};

const NOTIFICATION_COLORS = {
  booking_request: 'text-blue-600 bg-blue-50',
  booking_accepted: 'text-green-600 bg-green-50',
  offer_received: 'text-purple-600 bg-purple-50',
  offer_accepted: 'text-green-600 bg-green-50',
  message_received: 'text-indigo-600 bg-indigo-50',
  booking_confirmed: 'text-green-600 bg-green-50',
  booking_cancelled: 'text-red-600 bg-red-50',
  payment_received: 'text-emerald-600 bg-emerald-50',
  review_received: 'text-amber-600 bg-amber-50',
  reel_liked: 'text-pink-600 bg-pink-50',
  host_assigned_to_office: 'text-blue-600 bg-blue-50',
};

export default function NotificationItem({ notification, onClick, onDelete }) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-50';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 border-b border-gray-100 cursor-pointer transition-colors group',
        notification.read ? 'hover:bg-gray-50' : 'bg-purple-50/50 hover:bg-purple-50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          colorClass
        )}
      >
        <Icon className='w-5 h-5' />
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <h4
          className={cn(
            'text-sm mb-1',
            notification.read ? 'font-medium text-gray-900' : 'font-bold text-gray-900'
          )}
        >
          {notification.title}
        </h4>
        <p className='text-sm text-gray-600 line-clamp-2 mb-1'>{notification.message}</p>
        <span className='text-xs text-gray-500'>
          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
        </span>
      </div>

      {/* Unread Indicator & Delete */}
      <div className='flex items-center gap-2 flex-shrink-0'>
        {!notification.read && <div className='w-2 h-2 rounded-full bg-purple-600' />}
        <Button
          variant='ghost'
          size='icon'
          className='w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600'
          onClick={onDelete}
        >
          <Trash2 className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
