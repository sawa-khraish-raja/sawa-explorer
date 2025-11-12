import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  DollarSign,
  Globe,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Package,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/utils';
import { createPageUrl } from '@/utils';
import {
  getDocument,
  getAllDocuments,
  subscribeToMessages,
  sendMessageToConversation,
  markMessagesAsRead,
  updateDocument,
  queryDocuments,
  addDocument,
} from '@/utils/firestore';

import BookingServicesDisplay from "@/features/shared/booking-components/BookingServicesDisplay";
import { getUserDisplayName } from '@/shared/utils/userHelpers';

import MessageBubble from './MessageBubble';
import MessageStatus from './MessageStatus';
import TypingIndicator from './TypingIndicator';

const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
];

const detectBrowserLanguage = () => {
  try {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();

    if (SUPPORTED_LANGUAGES.some((l) => l.code === langCode)) {
      return langCode;
    }

    return 'en';
  } catch (error) {
    console.warn(' [Chat] Failed to detect browser language:', error);
    return 'en';
  }
};

export default function ConversationView({ conversationId, currentUser, onBack }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [messageText, setMessageText] = useState('');
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerType, setOfferType] = useState('service');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerInclusions, setOfferInclusions] = useState('');
  const [rentalDetails, setRentalDetails] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showBookingSummary, setShowBookingSummary] = useState(true);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [translationVersion, setTranslationVersion] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [displayLanguage, setDisplayLanguage] = useState(() => {
    const savedChatLang = localStorage.getItem('chat_display_lang');

    if (savedChatLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedChatLang)) {
      return savedChatLang;
    }

    const browserLang = detectBrowserLanguage();
    localStorage.setItem('chat_display_lang', browserLang);
    return browserLang;
  });

  const userPreferredLang = currentUser?.preferred_lang || 'en';

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((e) => console.warn('Could not play sound:', e));
    } catch (e) {
      console.warn('Sound playback error:', e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [messageText]);

  const handleLanguageChange = useCallback((langCode) => {
    setDisplayLanguage(langCode);
    localStorage.setItem('chat_display_lang', langCode);
    setTranslationVersion((prev) => prev + 1);

    const langName = SUPPORTED_LANGUAGES.find((l) => l.code === langCode)?.name;
    toast.success(`Chat language: ${langName}`, { duration: 2000 });
  }, []);

  const handleBack = useCallback(() => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    } else {
      navigate('/Messages', { replace: true });
    }
  }, [onBack, navigate]);

  const {
    data: conversation,
    isLoading: isLoadingConversation,
    error: conversationError,
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const conv = await getDocument('conversations', conversationId);

      if (!conv) {
        return null;
      }

      return {
        ...conv,
        host_emails: Array.isArray(conv.host_emails) ? conv.host_emails : [],
        traveler_email: conv.traveler_email || '',
      };
    },
    enabled: !!conversationId && !!currentUser?.email,
    staleTime: 60000,
    retry: 3, // Retry up to 3 times for permission errors
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const [localMessages, setLocalMessages] = useState([]);
  const [fetchedMessages, setFetchedMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Subscribe to messages in real-time
  useEffect(() => {
    if (!conversationId) {
      setFetchedMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);

    const unsubscribe = subscribeToMessages(conversationId, async (messages) => {
      // Mark unread messages as read
      const unreadMessages = messages.filter(
        (msg) =>
          msg.sender_email !== currentUser.email &&
          (!msg.read_by || !msg.read_by.includes(currentUser.email))
      );

      if (unreadMessages.length > 0) {
        await markMessagesAsRead(
          unreadMessages.map((m) => m.id),
          currentUser.email,
          conversationId
        );
      }

      setFetchedMessages(messages);
      setIsLoadingMessages(false);
    });

    return () => {
      console.log('Cleaning up messages subscription');
      unsubscribe();
    };
  }, [conversationId, currentUser.email]);

  useEffect(() => {
    if (fetchedMessages.length > lastMessageCount && lastMessageCount > 0) {
      const newMessages = fetchedMessages.slice(lastMessageCount);
      const hasNewFromOther = newMessages.some((msg) => msg.sender_email !== currentUser.email);

      if (hasNewFromOther) {
        playNotificationSound();
      }
    }
    setLastMessageCount(fetchedMessages.length);
  }, [fetchedMessages.length, lastMessageCount, currentUser.email, playNotificationSound]);

  useEffect(() => {
    if (fetchedMessages) {
      const serverMessagesMap = new Map(fetchedMessages.map((msg) => [msg.id, msg]));
      const newLocalState = [...fetchedMessages];

      localMessages.forEach((localMsg) => {
        if (localMsg._isPending && !serverMessagesMap.has(localMsg.id)) {
          const similarFetched = fetchedMessages.find(
            (fm) =>
              fm.original_text === localMsg.original_text &&
              fm.sender_email === localMsg.sender_email
          );
          if (!similarFetched) {
            newLocalState.push(localMsg);
          }
        }
      });

      newLocalState.sort(
        (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      );
      setLocalMessages(newLocalState);
    }
  }, [fetchedMessages]);

  useEffect(() => {
    if (localMessages.length > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom || localMessages.length === 1) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [localMessages.length]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForConversation'],
    queryFn: async () => {
      try {
        const users = await getAllDocuments('users');
        return Array.isArray(users) ? users : [];
      } catch (error) {
        console.error('Error loading users:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  const isHost =
    conversation &&
    Array.isArray(conversation.host_emails) &&
    conversation.host_emails.includes(currentUser?.email);

  const otherUserEmail =
    conversation && currentUser
      ? isHost
        ? conversation.traveler_email
        : conversation.host_emails?.[0] || ''
      : '';

  const otherUser = allUsers.find((u) => u && u.email === otherUserEmail);
  const otherUserName = getUserDisplayName(otherUser) || 'User';

  const { data: booking } = useQuery({
    queryKey: ['bookingForConvo', conversation?.booking_id],
    queryFn: async () => {
      if (!conversation?.booking_id) return null;
      return getDocument('bookings', conversation.booking_id);
    },
    enabled: !!conversation?.booking_id,
  });

  const isConversationClosed = conversation?.conversation_status === 'closed';
  const isBookingCancelled = booking?.status === 'cancelled';
  const canSendMessages = !isConversationClosed && !isBookingCancelled;

  const { data: cityData } = useQuery({
    queryKey: ['cityData', booking?.city_name],
    queryFn: async () => {
      if (!booking?.city_name) return null;

      const cities = await queryDocuments('cities', [['name', '==', booking.city_name]]);
      return cities && cities.length > 0 ? cities[0] : null;
    },
    enabled: !!booking?.city_name,
    staleTime: 10 * 60 * 1000,
  });

  const { data: offers = [], refetch: refetchOffers } = useQuery({
    queryKey: ['offers', booking?.id, currentUser?.email, conversation?.traveler_email],
    queryFn: async () => {
      if (!booking?.id || !currentUser?.email || !conversation) return [];
      try {
        // Determine if current user is the traveler or host for this conversation
        const isTraveler = conversation.traveler_email === currentUser.email;

        // Query offers by booking_id AND user's role (traveler or host)
        // This satisfies the security rules which check host_email or traveler_email
        const constraints = [['booking_id', '==', booking.id]];

        if (isTraveler) {
          constraints.push(['traveler_email', '==', currentUser.email]);
        } else {
          constraints.push(['host_email', '==', currentUser.email]);
        }

        const bookingOffers = await queryDocuments('offers', constraints, {
          orderBy: { field: 'created_date', direction: 'desc' },
        });

        return Array.isArray(bookingOffers) ? bookingOffers : [];
      } catch (error) {
        console.warn(' Could not fetch offers for booking:', error.message);
        return [];
      }
    },
    enabled: !!booking?.id && !!currentUser?.email && !!conversation,
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const hasAcceptedServiceOffer = useMemo(() => {
    if (!offers || offers.length === 0) return false;
    if (isBookingCancelled) return false;
    if (isConversationClosed) return false;
    if (booking?.status !== 'confirmed') return false;
    return offers.some((o) => o.status === 'accepted' && o.offer_type === 'service');
  }, [offers, isBookingCancelled, isConversationClosed, booking?.status]);

  const handleTextChange = (e) => {
    setMessageText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleSendMessage = useCallback(async () => {
    if (!canSendMessages) {
      toast.error(
        isBookingCancelled
          ? 'Cannot send messages - booking is cancelled'
          : 'This conversation is closed'
      );
      return;
    }

    if ((!messageText.trim() && attachments.length === 0) || !conversation || !currentUser) {
      return;
    }

    if (isSendingMessage) return;

    setIsSendingMessage(true);
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage = {
      id: tempId,
      conversation_id: conversation.id,
      sender_email: currentUser.email,
      original_text: messageText,
      source_lang: userPreferredLang,
      created_date: new Date().toISOString(),
      attachments,
      read_by: [currentUser.email],
      delivered_to: [],
      _isPending: true,
    };

    setLocalMessages((prev) => [...(prev || []), tempMessage]);

    const currentText = messageText;
    const currentAttachments = attachments;

    setMessageText('');
    setAttachments([]);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const messageId = await sendMessageToConversation(conversation.id, {
        sender_email: currentUser.email,
        original_text: tempMessage.original_text,
        source_lang: tempMessage.source_lang,
        attachments: tempMessage.attachments,
      });

      console.log(' Message sent:', messageId);

      // Update local state with the message ID
      setLocalMessages((prev) =>
        (prev || []).map((msg) =>
          msg.id === tempId ? { ...msg, id: messageId, _isPending: false } : msg
        )
      );

      // Real-time subscription will handle updates automatically
      queryClient.invalidateQueries({ queryKey: ['rawConversations'] });
    } catch (error) {
      setLocalMessages((prev) => (prev || []).filter((msg) => msg.id !== tempId));
      setMessageText(currentText);
      setAttachments(currentAttachments);

      toast.error('Failed to send message. Please try again.', error);
    } finally {
      setIsSendingMessage(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [
    messageText,
    attachments,
    conversation,
    currentUser,
    isSendingMessage,
    conversationId,
    userPreferredLang,
    queryClient,
    canSendMessages,
    isBookingCancelled,
  ]);

  const sendOfferMutation = useMutation({
    mutationFn: async () => {
      if (!offerPrice || !booking || !currentUser) throw new Error('Missing data');
      if (!canSendMessages) {
        throw new Error(
          isBookingCancelled
            ? 'Cannot send offers - booking is cancelled'
            : 'This conversation is closed'
        );
      }

      const priceBase = parseFloat(offerPrice);
      let offerData;

      if (offerType === 'rental') {
        offerData = {
          booking_id: booking.id,
          host_email: currentUser.email,
          offer_type: 'rental',
          price_base: priceBase,
          price_total: priceBase,
          rental_details: rentalDetails,
          status: 'pending',
          host_type: currentUser.host_type || 'freelancer',
        };
      } else {
        const isOfficeHost = currentUser.host_type === 'office';
        const sawaPercent = isOfficeHost ? 28 : 35;
        const sawaFee = Number((priceBase * (sawaPercent / 100)).toFixed(2));
        const officeFee = isOfficeHost ? Number((priceBase * 0.07).toFixed(2)) : 0;
        const total = Number((priceBase + sawaFee + officeFee).toFixed(2));

        offerData = {
          booking_id: booking.id,
          host_email: currentUser.email,
          offer_type: 'service',
          price_base: priceBase,
          price_breakdown: {
            base_price: priceBase,
            sawa_percent: sawaPercent,
            sawa_fee: sawaFee,
            office_percent: isOfficeHost ? 7 : 0,
            office_fee: officeFee,
            total: total,
            host_type: isOfficeHost ? 'office' : 'freelancer',
          },
          price_total: total,
          inclusions: offerInclusions,
          status: 'pending',
          host_type: isOfficeHost ? 'office' : 'freelancer',
        };
      }

      // Create offer in Firestore
      const offerId = await addDocument('offers', {
        ...offerData,
        host_id: currentUser.id,
        host_name: currentUser.full_name || currentUser.email,
        traveler_email: booking.traveler_email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      console.log(' Offer created:', offerId);

      // Send message about the offer
      await sendMessageToConversation(conversation.id, {
        sender_email: currentUser.email,
        original_text:
          offerType === 'rental'
            ? `I'm sending you a rental offer for $${priceBase.toFixed(2)}`
            : `I'm sending you a service offer for $${offerData.price_total.toFixed(2)}`,
        source_lang: userPreferredLang,
        attachments: [],
      });

      // Create notification for traveler
      const notificationData = {
        recipient_email: booking.traveler_email,
        type: 'offer_received',
        title: `New ${offerType} offer for ${booking.city_name || booking.city}`,
        message: `You received a ${offerType} offer for $${offerData.price_total.toFixed(2)}`,
        booking_id: booking.id,
        offer_id: offerId,
        read: false,
        created_date: new Date().toISOString(),
      };

      // Only add traveler_id if it exists
      if (booking.traveler_id) {
        notificationData.user_id = booking.traveler_id;
      }

      await addDocument('notifications', notificationData);

      return { id: offerId, ...offerData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Offer sent successfully!');
      setShowOfferDialog(false);
      setOfferPrice('');
      setOfferInclusions('');
      setRentalDetails('');
      setOfferType('service');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send offer');
      console.error(error);
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId) => {
      if (!offerId || typeof offerId !== 'string') {
        throw new Error('Invalid offer ID');
      }
      if (!canSendMessages) {
        throw new Error(
          isBookingCancelled
            ? 'Cannot accept offers - booking is cancelled'
            : 'This conversation is closed'
        );
      }

      // Get the offer
      const offer = await getDocument('offers', offerId);

      if (!offer) {
        throw new Error('Offer not found');
      }

      if (offer.status === 'accepted') {
        throw new Error('This offer has already been accepted');
      }

      // Update offer status to accepted
      await updateDocument('offers', offerId, {
        status: 'accepted',
        accepted_date: new Date().toISOString(),
      });

      // Update booking status to confirmed
      await updateDocument('bookings', booking.id, {
        status: 'confirmed',
        confirmed_date: new Date().toISOString(),
        confirmed_offer_id: offerId,
      });

      // Create notification for host
      const hostNotificationData = {
        recipient_email: offer.host_email,
        type: 'offer_accepted',
        title: 'Offer Accepted!',
        message: `Your offer for ${booking.city_name || booking.city} has been accepted`,
        booking_id: booking.id,
        offer_id: offerId,
        read: false,
        created_date: new Date().toISOString(),
      };

      // Only add host_id if it exists
      if (offer.host_id) {
        hostNotificationData.user_id = offer.host_id;
      }

      await addDocument('notifications', hostNotificationData);

      return { ok: true, offer_id: offerId };
    },
    onSuccess: async () => {
      toast.success('Offer accepted! 🎉', { duration: 3000 });

      await Promise.all([
        refetchOffers(),
        queryClient.invalidateQueries({ queryKey: ['offers'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['messages'] }),
        queryClient.invalidateQueries({ queryKey: ['conversation'] }),
        queryClient.invalidateQueries({ queryKey: ['travelerBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['myOffers'] }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to accept offer', {
        duration: 5000,
      });
    },
  });

  const declineOfferMutation = useMutation({
    mutationFn: async (offerId) => {
      if (!canSendMessages) {
        throw new Error(
          isBookingCancelled
            ? 'Cannot decline offers - booking is cancelled'
            : 'This conversation is closed'
        );
      }

      console.log('Declining offer:', offerId);

      // Update offer status to declined
      await updateDocument('offers', offerId, {
        status: 'declined',
        declined_date: new Date().toISOString(),
      });

      return { ok: true, offer_id: offerId };
    },
    onSuccess: async () => {
      toast.success('Offer declined');

      await Promise.all([
        refetchOffers(),
        queryClient.invalidateQueries({ queryKey: ['offers'] }),
        queryClient.invalidateQueries({ queryKey: ['messages'] }),
      ]);
    },
    onError: (error) => toast.error(error.message || 'Failed to decline offer'),
  });

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckout = () => {
    navigate(createPageUrl('MyOffers'));
  };

  // Show loading state
  if (isLoadingConversation) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        <p className='text-sm text-gray-500'>Loading conversation...</p>
      </div>
    );
  }

  // Show error if there was a problem loading the conversation
  if (conversationError) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4 p-8 text-center'>
        <MessageSquare className='w-16 h-16 text-red-300' />
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Error Loading Conversation</h3>
          <p className='text-sm text-gray-600 mb-2'>
            {conversationError.message || 'Failed to load conversation'}
          </p>
          <p className='text-xs text-gray-500 mb-4'>Conversation ID: {conversationId}</p>
          <div className='flex gap-2'>
            <Button onClick={() => window.location.reload()} variant='default'>
              Retry
            </Button>
            <Button onClick={handleBack} variant='outline'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Messages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if conversation not found
  if (!conversation) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4 p-8 text-center'>
        <MessageSquare className='w-16 h-16 text-gray-300' />
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Conversation Not Found</h3>
          <p className='text-sm text-gray-600 mb-2'>
            This conversation doesn't exist or you don't have access to it.
          </p>
          <p className='text-xs text-gray-500 mb-4'>Conversation ID: {conversationId}</p>
          <Button onClick={handleBack} variant='outline'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  // Show error if user not loaded
  if (!currentUser) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        <p className='text-sm text-gray-500'>Loading user data...</p>
      </div>
    );
  }

  const isTraveler = conversation.traveler_email === currentUser.email;
  const acceptedOffer = offers.find((o) => o.status === 'accepted');
  const myServiceOffer = offers.find(
    (o) => o.host_email === currentUser.email && o.offer_type === 'service'
  );
  const canSendServiceOffer =
    isHost &&
    !myServiceOffer &&
    !acceptedOffer &&
    booking?.status !== 'confirmed' &&
    canSendMessages;
  const canSendRentalOffer = isHost && canSendMessages;

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === displayLanguage);
  const isRTL = displayLanguage === 'ar' || displayLanguage === 'he';

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: {
        label: 'Confirmed',
        className: 'bg-green-100 text-green-800',
      },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || badges['pending'];
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  return (
    <div className='fixed inset-0 flex bg-white z-50' dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        .messages-container {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background: #9933CC;
          border-radius: 3px;
        }
        
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #7B2CBF;
        }
      `}</style>

      {/* Booking Summary Sidebar - Desktop Only */}
      <div
        className={cn(
          'hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 shadow-lg overflow-hidden',
          !showBookingSummary && 'hidden'
        )}
      >
        {booking && (
          <div className='relative h-[180px] overflow-hidden'>
            <img
              src={
                cityData?.cover_image ||
                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
              }
              alt={booking.city}
              className='w-full h-full object-cover'
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
              }}
            />
            <div className='absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60' />

            <div className='absolute bottom-4 left-4 right-4 text-white'>
              <h2 className='text-2xl font-bold drop-shadow-lg mb-1'>
                {booking.city_name || booking.city}
              </h2>
              {cityData?.country && (
                <p className='text-sm opacity-90 drop-shadow-md flex items-center gap-1'>
                  <MapPin className='w-3 h-3' />
                  {cityData.country}
                </p>
              )}
            </div>
          </div>
        )}

        <div className='bg-gradient-to-r from-[#9933CC] to-[#7B2CBF] p-4 text-white'>
          <h3 className='font-bold text-lg flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Booking Summary
          </h3>
        </div>

        {booking && (
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 text-gray-700 mb-2'>
                  <Calendar className='w-4 h-4 text-[#9933CC]' />
                  <span className='text-sm font-semibold'>Trip Dates</span>
                </div>
                <p className='text-sm text-gray-900'>
                  {format(new Date(booking.start_date), 'MMM d, yyyy')} →{' '}
                  {format(new Date(booking.end_date), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 text-gray-700 mb-2'>
                  <Users className='w-4 h-4 text-[#9933CC]' />
                  <span className='text-sm font-semibold'>Guests</span>
                </div>
                <p className='text-sm text-gray-900'>
                  {booking.number_of_adults || 1} Adult
                  {(booking.number_of_adults || 1) > 1 ? 's' : ''}
                  {booking.number_of_children > 0 &&
                    `, ${booking.number_of_children} Child${
                      booking.number_of_children > 1 ? 'ren' : ''
                    }`}
                </p>
              </CardContent>
            </Card>

            {booking.selected_services && booking.selected_services.length > 0 && (
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2 text-gray-700 mb-3'>
                    <Package className='w-4 h-4 text-[#9933CC]' />
                    <span className='text-sm font-semibold'>Selected Services</span>
                  </div>
                  <BookingServicesDisplay
                    serviceIds={booking.selected_services}
                    language={displayLanguage}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-semibold text-gray-700'>Status</span>
                  {getStatusBadge(booking.status)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col h-full overflow-hidden bg-gray-50'>
        {/* Header */}
        <div className='flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-20'>
          <div className='flex items-center justify-between p-4'>
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleBack}
                className='flex-shrink-0 h-9 w-9 rounded-full hover:bg-gray-100 transition-all duration-200'
                aria-label='Go back'
              >
                <ArrowLeft className={cn('w-5 h-5 text-gray-700', isRTL && 'rotate-180')} />
              </Button>

              {otherUser && (
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                  {otherUser.profile_photo ? (
                    <div className='relative'>
                      <img
                        src={otherUser.profile_photo}
                        alt={getUserDisplayName(otherUser)}
                        className='w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-gray-100'
                      />
                      <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white' />
                    </div>
                  ) : (
                    <div className='relative'>
                      <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-gray-100'>
                        {getUserDisplayName(otherUser).charAt(0).toUpperCase()}
                      </div>
                      <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white' />
                    </div>
                  )}

                  <div className='flex-1 min-w-0'>
                    <h3 className='font-bold text-base text-gray-900 truncate'>
                      {getUserDisplayName(otherUser)}
                    </h3>
                    {booking && (
                      <p className='text-xs text-gray-500 truncate'>
                        {booking.city_name || booking.city}
                        {booking.start_date && booking.end_date && (
                          <>
                            {' '}
                            • {format(new Date(booking.start_date), 'MMM d')} -{' '}
                            {format(new Date(booking.end_date), 'MMM d')}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              {hasAcceptedServiceOffer &&
                !isHost &&
                !isBookingCancelled &&
                !isConversationClosed &&
                booking?.status === 'confirmed' && (
                  <Button
                    onClick={handleCheckout}
                    className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 px-4 h-9'
                  >
                    <DollarSign className='w-4 h-4' />
                    <span className='hidden sm:inline'>
                      {isRTL ? 'المتابعة للدفع' : 'Checkout'}
                    </span>
                    <span className='sm:hidden'>💳</span>
                  </Button>
                )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='flex-shrink-0 h-9 w-9 rounded-full hover:bg-purple-50 transition-all duration-200 border border-gray-200'
                  >
                    <Globe className='w-4.5 h-4.5 text-gray-700 hover:text-purple-600 transition-colors' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-48 bg-white shadow-xl border border-gray-200 rounded-xl p-2 mt-2 z-[100]'
                >
                  <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase'>
                    Chat Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        'cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                        lang.code === displayLanguage
                          ? 'bg-purple-50 text-purple-600 font-semibold'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <span className='text-lg'>{lang.flag}</span>
                      <span className='flex-1 text-sm'>{lang.name}</span>
                      {lang.code === displayLanguage && (
                        <div className='w-2 h-2 rounded-full bg-purple-600' />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant='ghost'
                size='icon'
                onClick={() => setShowBookingSummary(!showBookingSummary)}
                className='lg:hidden flex-shrink-0 h-9 w-9 rounded-full hover:bg-gray-100'
              >
                {showBookingSummary ? (
                  <ChevronUp className='w-5 h-5 text-gray-700' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-gray-700' />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Booking Summary */}
          {showBookingSummary && booking && (
            <div className='lg:hidden border-t border-gray-200 bg-white relative z-[5]'>
              <div className='p-4 bg-gray-50'>
                <Card className='overflow-hidden shadow-xl border-2 border-purple-200'>
                  <div className='relative'>
                    <div className='absolute inset-0'>
                      <img
                        src={
                          cityData?.cover_image ||
                          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
                        }
                        alt={booking.city}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
                        }}
                      />
                      <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80' />
                    </div>

                    <div className='relative z-10 p-5 text-white'>
                      <div className='flex items-start justify-between mb-4'>
                        <div>
                          <h3 className='text-2xl font-bold drop-shadow-lg mb-1'>
                            {booking.city_name || booking.city}
                          </h3>
                          {cityData?.country && (
                            <p className='text-sm text-white/90 flex items-center gap-1 drop-shadow-md'>
                              <MapPin className='w-3 h-3' />
                              {cityData.country}
                            </p>
                          )}
                        </div>
                        <div className='bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30'>
                          <span
                            className={cn(
                              'text-xs font-bold',
                              booking.status === 'confirmed' && 'text-green-300',
                              booking.status === 'pending' && 'text-yellow-300',
                              booking.status === 'cancelled' && 'text-red-300'
                            )}
                          >
                            {booking.status === 'confirmed'
                              ? '✓ Confirmed'
                              : booking.status === 'pending'
                                ? '⏳ Pending'
                                : booking.status === 'cancelled'
                                  ? '✕ Cancelled'
                                  : booking.status}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center gap-3 mb-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20'>
                        <Calendar className='w-5 h-5 text-purple-300 flex-shrink-0' />
                        <div>
                          <p className='text-xs text-white/70 font-medium'>Trip Dates</p>
                          <p className='text-sm font-bold'>
                            {format(new Date(booking.start_date), 'MMM d')} -{' '}
                            {format(new Date(booking.end_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20'>
                        <Users className='w-5 h-5 text-purple-300 flex-shrink-0' />
                        <div>
                          <p className='text-xs text-white/70 font-medium'>Guests</p>
                          <p className='text-sm font-bold'>
                            {booking.number_of_adults || 1} Adult
                            {(booking.number_of_adults || 1) > 1 ? 's' : ''}
                            {booking.number_of_children > 0 &&
                              `, ${booking.number_of_children} Child${
                                booking.number_of_children > 1 ? 'ren' : ''
                              }`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {booking.selected_services && booking.selected_services.length > 0 && (
                    <CardContent className='p-4 bg-white'>
                      <button
                        onClick={() => setExpandedDetails(!expandedDetails)}
                        className='flex items-center justify-between w-full text-left mb-2'
                      >
                        <span className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                          <Package className='w-4 h-4 text-purple-600' />
                          Selected Services
                        </span>
                        {expandedDetails ? (
                          <ChevronUp className='w-4 h-4 text-gray-500' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-gray-500' />
                        )}
                      </button>

                      {expandedDetails && (
                        <div className='space-y-2 mt-2'>
                          <BookingServicesDisplay
                            serviceIds={booking.selected_services}
                            language={displayLanguage}
                          />
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Send Offer Button */}
        {(canSendServiceOffer || canSendRentalOffer) && (
          <div className='flex-shrink-0 bg-amber-50 border-b border-amber-200 p-3'>
            <Button
              onClick={() => setShowOfferDialog(true)}
              size='sm'
              className='w-full bg-[#7B2CBF] hover:bg-[#6A1FA0] text-white'
              disabled={!canSendMessages}
            >
              <DollarSign className='w-4 h-4 mr-2' />
              Send Price Offer
            </Button>
          </div>
        )}

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className='flex-1 messages-container p-4 space-y-3 bg-[#F5F7FA] relative'
          style={{ overflowY: 'auto', overflowX: 'hidden' }}
        >
          {isLoadingMessages ? (
            <div className='flex justify-center items-center h-full'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
            </div>
          ) : localMessages.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center px-4'>
              <div className='w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-4'>
                <MessageSquare className='w-10 h-10 text-purple-600' />
              </div>
              <p className='text-base font-bold text-gray-900 mb-2'>No messages yet</p>
              <p className='text-sm text-gray-500'>Start the conversation!</p>
            </div>
          ) : (
            <>
              {localMessages.map((msg) => (
                <div key={`${msg.id}-${translationVersion}`}>
                  <MessageBubble
                    message={msg}
                    currentUserEmail={currentUser.email}
                    displayLanguage={displayLanguage}
                    isHostInConversation={isHost}
                    offers={offers}
                    onAcceptOffer={(offerId) => {
                      console.log(offerId);
                      acceptOfferMutation.mutate(offerId);
                    }}
                    onDeclineOffer={(offerId) => declineOfferMutation.mutate(offerId)}
                    hasAcceptedOffer={!!acceptedOffer}
                    isAcceptingOffer={acceptOfferMutation.isPending}
                    isDecliningOffer={declineOfferMutation.isPending}
                  />
                  <MessageStatus message={msg} currentUserEmail={currentUser.email} />
                </div>
              ))}

              <AnimatePresence>
                {otherUserTyping && <TypingIndicator userName={otherUserName} />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </>
          )}

          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={scrollToBottom}
              className='fixed bottom-24 right-8 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center z-10 transition-all'
            >
              <ChevronDown className='w-5 h-5' />
            </motion.button>
          )}
        </div>

        {/* Input Area */}
        <div className='flex-shrink-0 p-4 bg-white border-t border-gray-200 shadow-lg'>
          {!canSendMessages ? (
            <div className='max-w-4xl mx-auto'>
              <div className='bg-gray-100 border-2 border-gray-300 rounded-2xl p-4 text-center'>
                <div className='flex items-center justify-center gap-2 text-gray-600'>
                  <MessageSquare className='w-5 h-5' />
                  <p className='font-semibold'>
                    {isBookingCancelled
                      ? isRTL
                        ? 'تم إلغاء الحجز - المحادثة مغلقة'
                        : 'Booking Cancelled - Chat Closed'
                      : isRTL
                        ? 'المحادثة مغلقة'
                        : 'Conversation Closed'}
                  </p>
                </div>
                {isBookingCancelled && (
                  <p className='text-sm text-gray-500 mt-1'>
                    {isRTL
                      ? 'لا يمكن إرسال رسائل في محادثة حجز ملغي'
                      : 'Cannot send messages in a cancelled booking'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className='flex items-end gap-3 max-w-4xl mx-auto'>
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={handleTextChange}
                onKeyPress={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    (messageText.trim() || attachments.length > 0) &&
                    !isSendingMessage
                  ) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder='Type in any language...'
                disabled={isSendingMessage}
                rows={1}
                className='flex-1 resize-none text-base px-4 py-3 border-2 border-gray-200 focus:border-purple-600 rounded-2xl transition-all focus:outline-none overflow-hidden shadow-sm bg-gray-50 focus:bg-white'
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!messageText.trim() && attachments.length === 0) || isSendingMessage}
                size='icon'
                className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-12 w-12 rounded-full flex-shrink-0 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSendingMessage ? (
                  <Loader2 className='w-5 h-5 animate-spin' />
                ) : (
                  <Send className='w-5 h-5' />
                )}
              </Button>

              <Button
                variant='ghost'
                size='icon'
                onClick={() => setSoundEnabled(!soundEnabled)}
                className='h-12 w-12 rounded-full'
                aria-label={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
              >
                {soundEnabled ? (
                  <Volume2 className='w-5 h-5 text-gray-600' />
                ) : (
                  <VolumeX className='w-5 h-5 text-gray-400' />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Price Offer</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label>Offer Type</Label>
              <div className='flex gap-2 mt-2'>
                <Button
                  type='button'
                  variant={offerType === 'service' ? 'default' : 'outline'}
                  onClick={() => setOfferType('service')}
                  disabled={!canSendServiceOffer}
                  className='flex-1'
                >
                  Service Offer
                  {!canSendServiceOffer && myServiceOffer && (
                    <span className='ml-1 text-xs'>(Sent)</span>
                  )}
                </Button>
                <Button
                  type='button'
                  variant={offerType === 'rental' ? 'default' : 'outline'}
                  onClick={() => setOfferType('rental')}
                  className='flex-1'
                  disabled={!canSendRentalOffer}
                >
                  Rental Offer
                </Button>
              </div>
            </div>

            <div>
              <Label>
                {offerType === 'rental' ? 'Rental Price ($)' : 'Your Service Price ($)'}
              </Label>
              <Input
                type='number'
                step='0.01'
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder='Enter price'
                disabled={!canSendMessages}
              />
              {offerPrice && offerType === 'service' && (
                <p className='text-sm text-gray-500 mt-1'>
                  + {currentUser.host_type === 'office' ? '35%' : '35%'} Commission =
                  <span className='font-bold text-purple-600'>
                    {' '}
                    ${(parseFloat(offerPrice) * 1.35).toFixed(2)}
                  </span>{' '}
                  total
                </p>
              )}
            </div>

            {offerType === 'service' ? (
              <div>
                <Label>What's Included</Label>
                <Input
                  value={offerInclusions}
                  onChange={(e) => setOfferInclusions(e.target.value)}
                  placeholder='e.g., Airport pickup, full day tour...'
                  disabled={!canSendMessages}
                />
              </div>
            ) : (
              <div>
                <Label>Rental Details</Label>
                <Input
                  value={rentalDetails}
                  onChange={(e) => setRentalDetails(e.target.value)}
                  placeholder='e.g., 2-bedroom apartment...'
                  disabled={!canSendMessages}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowOfferDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendOfferMutation.mutate()}
              disabled={!offerPrice || sendOfferMutation.isPending || !canSendMessages}
              className='bg-purple-600 hover:bg-purple-700'
            >
              {sendOfferMutation.isPending ? (
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
              ) : (
                <DollarSign className='w-4 h-4 mr-2' />
              )}
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
