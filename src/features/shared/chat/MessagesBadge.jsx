import { MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';
import { createPageUrl } from '@/utils';
import { subscribeToConversations } from '@/utils/firestore';

import { UseAppContext } from "@/shared/context/AppContext";

export default function MessagesBadge({ className }) {
  const { user } = UseAppContext();
  const [conversations, setConversations] = useState([]);
  const [showBadgePulse, setShowBadgePulse] = useState(false);

  // Subscribe to conversations for real-time unread counts
  useEffect(() => {
    if (!user?.email) {
      setConversations([]);
      return;
    }

    const isHost = user?.host_approved;

    const unsubscribe = subscribeToConversations(user.email, isHost, (updatedConversations) => {
      setConversations(updatedConversations);
    });

    return () => unsubscribe();
  }, [user?.email, user?.host_approved]);

  // Calculate unread count
  const unreadCount = conversations.reduce((count, conversation) => {
    const isHost = user?.host_approved;

    if (isHost) {
      // Host: check if their email is in unread_by_hosts array
      if (
        Array.isArray(conversation.unread_by_hosts) &&
        conversation.unread_by_hosts.includes(user.email)
      ) {
        return count + 1;
      }
    } else {
      // Traveler: check unread_by_traveler flag
      if (conversation.unread_by_traveler === true) {
        return count + 1;
      }
    }

    return count;
  }, 0);

  // Pulse animation when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setShowBadgePulse(true);
      const timer = setTimeout(() => setShowBadgePulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <Link to={createPageUrl('Messages')}>
      <Button
        variant='ghost'
        className={cn(
          'relative rounded-full w-10 h-10 hover:bg-gray-100 transition-colors',
          className
        )}
        aria-label='Messages'
      >
        <MessageSquare className='w-5 h-5 text-gray-700' />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full text-white text-xs font-semibold flex items-center justify-center',
              showBadgePulse ? 'bg-red-500 animate-pulse' : 'bg-red-500'
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
