import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, Search, Briefcase, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils';
import { subscribeToConversations, getAllDocuments } from '@/utils/firestore';

import ConversationList from '@/features/shared/chat/ConversationList';
import ConversationView from '@/features/shared/chat/ConversationView';
import { UseAppContext } from '@/shared/context/AppContext';

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('services');

  //  FIXED: Use shared user from AppContext
  const { user, userLoading: isUserLoading } = UseAppContext();

  // State for conversations (updated via real-time subscription)
  const [rawConversations, setRawConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  //  Subscribe to conversations in real-time
  useEffect(() => {
    if (!user?.email) {
      setRawConversations([]);
      setConversationsLoading(false);
      return;
    }

    setConversationsLoading(true);

    const isHost = user?.host_approved;

    // Subscribe to conversations
    const unsubscribe = subscribeToConversations(user.email, isHost, (conversations) => {
      setRawConversations(conversations);
      setConversationsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.email, user?.host_approved]);

  //  Load users
  const userEmails = useMemo(() => {
    const emails = new Set();
    rawConversations.forEach((convo) => {
      if (convo?.traveler_email) emails.add(convo.traveler_email);
      if (Array.isArray(convo?.host_emails)) {
        convo.host_emails.forEach((email) => emails.add(email));
      }
    });
    if (user?.email) emails.add(user.email);
    return Array.from(emails);
  }, [rawConversations, user?.email]);

  const { data: relevantUsers = [] } = useQuery({
    queryKey: ['relevantUsers', userEmails],
    queryFn: async () => {
      if (userEmails.length === 0) return [];
      try {
        const allUsers = await getAllDocuments('users');
        return allUsers.filter((u) => u && userEmails.includes(u.email));
      } catch (error) {
        console.error('Error loading users:', error);
        return userEmails.map((email) => ({
          email,
          display_name: email.split('@')[0],
          full_name: email.split('@')[0],
        }));
      }
    },
    enabled: userEmails.length > 0,
    staleTime: 15 * 60 * 1000, //  INCREASED: 5 min -> 15 min
    cacheTime: 30 * 60 * 1000, //  INCREASED
  });

  //  Process conversations
  const conversations = useMemo(() => {
    if (!user) return [];

    return rawConversations
      .filter((convo) => convo && typeof convo === 'object')
      .map((convo) => {
        const hostEmails = Array.isArray(convo.host_emails) ? convo.host_emails : [];
        const travelerEmail = convo.traveler_email || '';
        const otherUserEmail = travelerEmail === user.email ? hostEmails[0] || null : travelerEmail;
        const otherUser = relevantUsers.find((u) => u?.email === otherUserEmail);

        let displayName = 'User';
        if (otherUser?.display_name) {
          displayName = otherUser.display_name;
        } else if (otherUser?.full_name) {
          displayName = otherUser.full_name.split(' ')[0];
        } else if (otherUserEmail) {
          displayName = otherUserEmail.split('@')[0];
        }

        return {
          ...convo,
          otherUserEmail,
          otherUser,
          otherUserName: displayName,
          profilePhoto: otherUser?.profile_photo,
          avatarFallbackText: displayName.charAt(0)?.toUpperCase() || 'U',
        };
      })
      .filter((c) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          c.traveler_email?.toLowerCase().includes(search) ||
          c.host_emails?.some((e) => e?.toLowerCase().includes(search)) ||
          c.last_message_preview?.toLowerCase().includes(search) ||
          c.otherUserName?.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        const timeA = a.last_message_timestamp
          ? new Date(a.last_message_timestamp)
          : new Date(a.created_date);
        const timeB = b.last_message_timestamp
          ? new Date(b.last_message_timestamp)
          : new Date(b.created_date);
        return timeB.getTime() - timeA.getTime();
      });
  }, [rawConversations, user, relevantUsers, searchTerm]);

  const serviceConversations = conversations.filter(
    (c) => c.conversation_type === 'service' || !c.conversation_type
  );
  const adventureConversations = conversations.filter((c) => c.conversation_type === 'adventure');

  const handleConversationSelect = useCallback(
    (conversationId) => {
      console.log(' [Messages] Opening conversation:', conversationId);
      setActiveConversationId(conversationId);
      navigate(`/Messages?conversation_id=${conversationId}`, {
        replace: true,
      });
    },
    [navigate]
  );

  //  FIXED: Better back handler
  const handleConversationBack = useCallback(() => {
    console.log('🔙 [Messages] Closing conversation');
    setActiveConversationId(null);
    navigate('/Messages', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convoId = params.get('conversation_id');

    if (convoId) {
      setActiveConversationId(convoId);
    } else {
      setActiveConversationId(null);
    }
  }, [location.search]);

  if (isUserLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  if (!user) return null;

  const currentConversations =
    selectedTab === 'services' ? serviceConversations : adventureConversations;

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-gray-50 to-white',
        activeConversationId ? 'fixed inset-0 z-50' : 'min-h-screen'
      )}
    >
      <div className='h-full flex flex-col'>
        {/* 🎨 Professional Header */}
        {(!activeConversationId || window.innerWidth >= 768) && conversations.length > 0 && (
          <div className='flex-shrink-0 bg-white border-b border-gray-200 shadow-sm'>
            <div className='max-w-7xl mx-auto px-4 py-4'>
              {/* Title & Tabs */}
              <div className='flex items-center justify-between mb-4'>
                <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
                  <MessageSquare className='w-6 h-6 text-purple-600' />
                  Messages
                </h1>

                {/* Tabs */}
                <div className='flex gap-2'>
                  <Button
                    variant={selectedTab === 'services' ? 'default' : 'ghost'}
                    onClick={() => setSelectedTab('services')}
                    size='sm'
                    className={cn(
                      'gap-2',
                      selectedTab === 'services' && 'bg-purple-600 hover:bg-purple-700'
                    )}
                  >
                    <Briefcase className='w-4 h-4' />
                    <span className='hidden sm:inline'>Services</span>
                    <span className='bg-white/20 px-1.5 rounded-full text-xs'>
                      {serviceConversations.length}
                    </span>
                  </Button>

                  <Button
                    variant={selectedTab === 'adventures' ? 'default' : 'ghost'}
                    onClick={() => setSelectedTab('adventures')}
                    size='sm'
                    className={cn(
                      'gap-2',
                      selectedTab === 'adventures' && 'bg-purple-600 hover:bg-purple-700'
                    )}
                  >
                    <Sparkles className='w-4 h-4' />
                    <span className='hidden sm:inline'>Adventures</span>
                    <span className='bg-white/20 px-1.5 rounded-full text-xs'>
                      {adventureConversations.length}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className='relative'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  placeholder='Search conversations...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-purple-600 rounded-xl transition-all'
                />
              </div>
            </div>
          </div>
        )}

        <div className='flex-1 flex overflow-hidden'>
          <div className='w-full max-w-7xl mx-auto flex h-full'>
            {/* 📱 Conversation List */}
            <div
              className={cn(
                'flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto',
                activeConversationId ? 'hidden md:block md:w-80 lg:w-96' : 'w-full md:w-80 lg:w-96'
              )}
            >
              {conversationsLoading ? (
                <div className='p-8 text-center'>
                  <Loader2 className='w-6 h-6 animate-spin mx-auto mb-2 text-purple-600' />
                  <p className='text-sm text-gray-500'>Loading conversations...</p>
                </div>
              ) : currentConversations.length > 0 ? (
                <ConversationList
                  conversations={currentConversations}
                  selectedConversationId={activeConversationId}
                  onSelectConversation={handleConversationSelect}
                  currentUserEmail={user.email}
                  isHost={!!user?.host_approved}
                  allUsers={relevantUsers}
                />
              ) : (
                <div className='flex items-center justify-center h-full p-8'>
                  <div className='text-center'>
                    <div className='w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <MessageSquare className='w-10 h-10 text-purple-600' />
                    </div>
                    <h3 className='text-lg font-bold text-gray-900 mb-2'>No conversations</h3>
                    <p className='text-sm text-gray-600'>
                      Your {selectedTab} conversations will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Conversation View */}
            <div
              className={cn(
                'flex-1 bg-gray-50 overflow-hidden',
                activeConversationId ? 'block' : 'hidden md:flex md:items-center md:justify-center'
              )}
            >
              {activeConversationId ? (
                <ConversationView
                  key={activeConversationId}
                  conversationId={activeConversationId}
                  currentUser={user}
                  onBack={handleConversationBack}
                />
              ) : (
                <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
                  <div className='w-24 h-24 bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 rounded-full flex items-center justify-center mb-6 shadow-lg'>
                    <MessageSquare className='w-12 h-12 text-purple-600' />
                  </div>
                  <h2 className='text-2xl font-bold text-gray-800 mb-2'>Select a conversation</h2>
                  <p className='text-gray-600 max-w-sm'>
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
