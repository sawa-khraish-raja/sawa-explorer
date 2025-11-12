import { format, isToday, isYesterday } from 'date-fns';
import { motion } from 'framer-motion';
import { MessageSquare, Pin, Lock } from 'lucide-react';

import { cn } from '@/shared/utils';


import { getUserDisplayName } from '@/shared/utils/userHelpers';


import UnreadBadge from './UnreadBadge';

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isHost,
  currentUserEmail,
  allUsers = [],
}) {
  if (!Array.isArray(conversations) || conversations.length === 0) {
    return (
      <div className='p-8 text-center'>
        <MessageSquare className='w-12 h-12 mx-auto mb-2 text-gray-300' />
        <p className='text-sm text-gray-500'>No conversations yet</p>
      </div>
    );
  }

  const visibleConversations = conversations.filter((conv) => {
    if (!isHost) return true;
    return conv.conversation_status !== 'closed';
  });

  const getTimeLabel = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  //  Calculate unread count per conversation
  const getUnreadCount = (conversation) => {
    if (!conversation.unread_by_hosts && !conversation.unread_by_traveler) return 0;

    if (isHost) {
      return Array.isArray(conversation.unread_by_hosts) &&
        conversation.unread_by_hosts.includes(currentUserEmail)
        ? 1
        : 0;
    } 
      return conversation.unread_by_traveler ? 1 : 0;
    
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      {visibleConversations.map((conversation, index) => {
        if (!conversation) return null;

        const travelerEmail = conversation.traveler_email || '';
        const hostEmails = Array.isArray(conversation.host_emails) ? conversation.host_emails : [];
        const otherUserEmail = isHost ? travelerEmail : hostEmails[0] || '';
        const otherUser = allUsers.find((u) => u?.email === otherUserEmail);
        const displayName = getUserDisplayName(otherUser) || conversation.otherUserName || 'User';
        const profilePhoto = conversation.profilePhoto || otherUser?.profile_photo;

        const unreadCount = getUnreadCount(conversation);
        const isSelected = conversation.id === selectedConversationId;
        const isPinned = conversation.is_pinned;
        const isClosed = conversation.conversation_status === 'closed';

        return (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => {
              if (onSelectConversation) {
                onSelectConversation(conversation.id);
              }
            }}
            className={cn(
              'px-4 py-3 cursor-pointer transition-all duration-150 border-b border-gray-100 relative',
              'hover:bg-gray-50 active:bg-gray-100',
              isSelected && 'bg-purple-50 border-l-4 border-l-purple-600',
              unreadCount > 0 && !isSelected && 'bg-blue-50/50',
              isClosed && 'opacity-60'
            )}
          >
            <div className='flex items-start gap-3'>
              {/* Avatar */}
              <div className='relative flex-shrink-0'>
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={displayName}
                    className='w-12 h-12 rounded-full object-cover ring-2 ring-gray-100'
                  />
                ) : (
                  <div className='w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-gray-100'>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {!isClosed && (
                  <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white' />
                )}
              </div>

              {/* Content */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between mb-1'>
                  <h3
                    className={cn(
                      'font-semibold text-gray-900 truncate flex items-center gap-1',
                      unreadCount > 0 && 'font-bold'
                    )}
                  >
                    {isPinned && <Pin className='w-3 h-3 text-purple-600' />}
                    {isClosed && <Lock className='w-3 h-3 text-gray-400' />}
                    {displayName}
                  </h3>

                  <span className='text-xs text-gray-500 ml-2 flex-shrink-0'>
                    {getTimeLabel(conversation.last_message_timestamp)}
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  <p
                    className={cn(
                      'text-sm text-gray-600 truncate flex-1',
                      unreadCount > 0 && 'font-semibold text-gray-900',
                      isClosed && 'italic'
                    )}
                  >
                    {isClosed && '🔒 '}
                    {conversation.last_message_text || 'No messages yet'}
                  </p>

                  {/*  Unread Badge */}
                  {unreadCount > 0 && !isClosed && <UnreadBadge count={unreadCount} />}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
