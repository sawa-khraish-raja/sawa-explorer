import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import {
  Loader2,
  Send,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  DollarSign,
  Package,
  Image as ImageIcon,
  X,
  Globe,
  Volume2,
} from 'lucide-react';
import { Mic, Square } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MessageBubble from '../chat/MessageBubble';
import OfferCard from '../chat/OfferCard';
import { format } from 'date-fns';
import { NotificationHelpers, notifyNewMessage } from '../notifications/notificationHelpers';
import { MessageValidator } from '../chat/MessageValidator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { TARGET_LANGS, normLang } from '@/components/i18n/i18nVoice';
import { playVoice } from '@/components/voice/playVoice';
import { useSawaTranslation } from '../chat/useSawaTranslation';
import { getUserDisplayName } from '../utils/userHelpers'; // Added import

export default function HostConversationView({
  conversationId,
  onBack,
  currentUser,
  showNotification,
}) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // Ref for scrollable container
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null); // For speech recognition
  const isFirstLoad = useRef(true);
  const lastPlayedMessageId = useRef(null);

  const [newMessage, setNewMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [violations, setViolations] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Offer related states
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerInclusions, setOfferInclusions] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  // Rental Offer related states
  const [showRentalOfferDialog, setShowRentalOfferDialog] = useState(false);
  const [rentalType, setRentalType] = useState('Car');
  const [rentalPrice, setRentalPrice] = useState('');
  const [rentalDetails, setRentalDetails] = useState('');
  const [rentalMessage, setRentalMessage] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [displayLanguage, setDisplayLanguage] = useState(
    localStorage.getItem('sawa_display_lang') || navigator.language.split('-')[0] || 'en'
  );
  const [autoVoice, setAutoVoice] = useState(() => {
    const stored = localStorage.getItem('sawa_auto_voice');
    return stored ? JSON.parse(stored) : false;
  });

  const {
    data: conversation,
    isLoading: isLoadingConversation,
    error: conversationError,
  } = useQuery({
    queryKey: ['hostConversation', conversationId],
    queryFn: () => getDocument('conversations', conversationId),
    enabled: !!conversationId,
  });

  const {
    data: booking,
    isLoading: isLoadingBooking,
    error: bookingError,
  } = useQuery({
    queryKey: ['hostBooking', conversation?.booking_id],
    queryFn: () => getDocument('bookings', conversation.booking_id),
    enabled: !!conversation?.booking_id,
    staleTime: Infinity, // Bookings usually don't change often in a chat context
  });

  // Fetch all users to get traveler's full profile
  const { data: allUsers = [], isLoading: isLoadingAllUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => getAllDocuments('users'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Find the traveler and get their display name
  const traveler = useMemo(() => {
    if (!conversation?.traveler_email || isLoadingAllUsers) return null;
    return allUsers.find((u) => u.email === conversation.traveler_email);
  }, [conversation?.traveler_email, allUsers, isLoadingAllUsers]);

  const travelerName = getUserDisplayName(traveler);

  const {
    data: messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ['hostMessages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await queryDocuments('messages', []);
      // Messages should be ordered oldest to newest from API for chat display
      return response.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.reduce((acc, page) => acc + page.length, 0);
      return lastPage.length === 20 ? currentOffset : undefined;
    },
    enabled: !!conversationId,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Reverse pages and messages within pages to get newest first for initial load,
      // but ensure overall order for display is oldest to newest
      // This is a common pattern for infinite scroll from bottom
    }),
  });

  // Flat list of messages, ordered oldest to newest for display
  const allMessages = useMemo(() => messages?.pages?.flat() || [], [messages]);

  const { processedMessages, isTranslating, supportedLanguages, normalizedLang } =
    useSawaTranslation({
      messages: allMessages,
      conversation,
      currentUser,
      displayLanguage,
    });

  const allOffers = useMemo(() => {
    if (!conversation?.offers) return [];
    return conversation.offers.map((offer) => ({ ...offer, type: 'offer' }));
  }, [conversation?.offers]);

  // Combine messages and offers, sort by created_at, ensure messages have a type
  const allItems = useMemo(() => {
    const combined = [...processedMessages, ...allOffers];
    return combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [processedMessages, allOffers]);

  // Handle pagination for messages
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const totalMessages = messages?.pages?.[0]?.total || 0; // Assuming total messages count is available in the first page
  const visibleCount = allMessages.length;
  const hasMore = visibleCount < totalMessages;

  const createMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await addDocument('messages', { ...messageData, created_date: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['hostMessages', conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['hostConversations', currentUser?.email],
      });
      // Small delay to allow message to render before scrolling
      setTimeout(scrollToBottom, 100);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      showNotification({
        title: 'Failed to send message',
        message: 'Please try again.',
        type: 'error',
      });
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: async (offerData) => {
      const newOffer = await addDocument('offers', { ...{
        ...offerData,
        conversation_id: conversationId,
      }, created_date: new Date().toISOString() });
      return newOffer;
    },
    onSuccess: (newOffer) => {
      queryClient.invalidateQueries({
        queryKey: ['hostConversation', conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['hostConversations', currentUser?.email],
      });
      setShowOfferDialog(false);
      setShowRentalOfferDialog(false);
      setOfferPrice('');
      setOfferInclusions('');
      setOfferMessage('');
      setRentalPrice('');
      setRentalDetails('');
      setRentalMessage('');
      showNotification({
        title: 'Offer sent!',
        message: 'Your offer has been sent to the traveler.',
        type: 'success',
      });
      setTimeout(scrollToBottom, 100);
    },
    onError: (error) => {
      console.error('Error sending offer:', error);
      showNotification({
        title: 'Failed to send offer',
        message: 'Please try again.',
        type: 'error',
      });
    },
  });

  const acceptedOffers = useMemo(
    () => conversation?.offers?.filter((offer) => offer.status === 'accepted') || [],
    [conversation?.offers]
  );
  const hasAcceptedServiceOffer = acceptedOffers.some((offer) => offer.offer_type === 'service');
  const hasAcceptedRentalOffer = acceptedOffers.some((offer) => offer.offer_type === 'rental');

  const calculatePricing = (price) => {
    const basePrice = parseFloat(price);
    const isIndependent = currentUser?.is_independent_host;
    const SAWA_COMMISSION_RATE = isIndependent ? 0.35 : 0.28; // 35% for independent, 28% for office hosts
    const OFFICE_COMMISSION_RATE = isIndependent ? 0 : 0.07; // 7% for office hosts

    const sawaCommission = basePrice * SAWA_COMMISSION_RATE;
    const officeCommission = basePrice * OFFICE_COMMISSION_RATE;
    const totalPrice = basePrice + sawaCommission + officeCommission;

    return {
      basePrice,
      sawaCommission,
      officeCommission,
      totalPrice,
      isIndependent,
    };
  };

  const pricing = useMemo(
    () => calculatePricing(offerPrice),
    [offerPrice, currentUser?.is_independent_host]
  );

  const toggleAutoVoice = () => {
    setAutoVoice((prev) => {
      const newState = !prev;
      localStorage.setItem('sawa_auto_voice', JSON.stringify(newState));
      return newState;
    });
  };

  const acceptOfferMutation = useMutation({
    mutationFn: async ({ offerId, bookingId }) => {
      // In a real app, this would likely update the offer status to 'accepted' and maybe link to a booking
      // For this example, we'll simulate an update and notify
      await updateDocument('offers', offerId, { ...{ status: 'accepted' }, updated_date: new Date().toISOString() });
      // If there's a booking associated, we might update it or redirect
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['hostConversation', conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['hostConversations', currentUser?.email],
      });
      showNotification({
        title: 'Offer accepted!',
        message: 'You have accepted an offer.',
        type: 'success',
      });
      // Redirect to host dashboard after accepting
      setTimeout(() => {
        // window.location.href = useNavigate(() => createPageUrl(`HostDashboard?conversation_id=${conversation.id}`), { replace: true });
      }, 1000);
    },
    onError: (error) => {
      console.error('Error accepting offer:', error);
      showNotification({
        title: 'Failed to accept offer',
        message: 'Please try again.',
        type: 'error',
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (allItems.length > 0) {
      // Check allItems length for initial scroll
      if (!isFirstLoad.current) {
        scrollToBottom();
      } else {
        messagesEndRef.current?.scrollIntoView();
        isFirstLoad.current = false;
      }
    }
  }, [allItems]);

  // Auto-voice playback for new incoming messages
  useEffect(() => {
    if (!autoVoice || !processedMessages.length || !currentUser) return;

    const lastMessage = processedMessages[processedMessages.length - 1];

    if (
      lastMessage &&
      lastMessage.sender_email !== currentUser.email &&
      lastMessage.id !== lastPlayedMessageId.current
    ) {
      const textToPlay = lastMessage.displayText || lastMessage.content;
      if (textToPlay) {
        playVoice(textToPlay, normalizedLang, 'host'); // Use normalizedLang from hook
        lastPlayedMessageId.current = lastMessage.id;
      }
    }
  }, [processedMessages, autoVoice, currentUser, normalizedLang]);

  // Handle scroll to detect when user scrolls to top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !isTranslating) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isTranslating, loadMore]);

  // Real-time message listener for notifications
  useEffect(() => {
    if (!conversation?.id || !currentUser) return;

    const handleNewMessage = (data) => {
      // Ensure it's for this conversation and not sent by the current user
      if (data.conversation_id !== conversation.id) return;
      if (data.sender_email === currentUser.email) return;

      // Invalidate queries to refetch messages and update conversations list
      queryClient.invalidateQueries({
        queryKey: ['hostMessages', conversation.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['hostConversations', currentUser.email],
      });

      // Use unified notification system
      notifyNewMessage(
        data.sender_email.split('@')[0],
        data.translated_text || data.original_text || 'New message'
      );

      // Vibrate on new message (mobile experience enhancement)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    };

    // Subscribe to real-time updates for messages in this conversation
    const unsubscribe = // TODO: Firebase real-time listeners
    // base44.subscribeToEntityUpdates(
      'Message',
      conversation.id,
      handleNewMessage
    );

    // Return cleanup function to unsubscribe when component unmounts or deps change
    return () => unsubscribe();
  }, [conversation?.id, currentUser?.email, queryClient]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      showNotification({
        title: 'Only image files are allowed',
        type: 'warning',
      });
    }

    if (selectedImages.length + validFiles.length > 4) {
      showNotification({
        title: 'Maximum 4 images allowed',
        type: 'warning',
      });
      return;
    }

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages([...selectedImages, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...selectedImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim()) {
      const validation = MessageValidator.validate(value);
      if (!validation.isValid) {
        setViolations(validation.violations);
        setShowWarning(true);
      } else {
        setShowWarning(false);
        setViolations([]);
      }
    } else {
      setShowWarning(false);
      setViolations([]);
    }
  };

  const handleSendMessage = async (e, voiceTranscript = null) => {
    if (e) e.preventDefault();

    const contentToSend = voiceTranscript || newMessage;
    const imagesToSend = selectedImages;

    // Validate content or attachments exist
    if (!contentToSend.trim() && imagesToSend.length === 0) {
      showNotification({
        title: 'Cannot send an empty message.',
        type: 'warning',
      });
      return;
    }

    if (!voiceTranscript && contentToSend.trim()) {
      const validation = MessageValidator.validate(contentToSend);
      if (!validation.isValid) {
        const warningMsg = MessageValidator.getWarningMessage(validation.violations, 'en');
        showNotification({
          title: warningMsg,
          type: 'error',
        });
        return;
      }
    }

    let uploadedUrls = [];
    if (imagesToSend.length > 0) {
      setUploadingImages(true);
      try {
        for (const imageObj of imagesToSend) {
          const { file_url } = await uploadImage(imageObj.file,
          , 'uploads');
          uploadedUrls.push(file_url);
        }
      } catch (error) {
        showNotification({
          title: 'Failed to upload images',
          type: 'error',
        });
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    // Send with original_text (REQUIRED if content exists)
    createMessageMutation.mutate({
      conversation_id: conversationId,
      original_text: contentToSend.trim() || '', // Can be empty if only attachments
      is_voice_message: !!voiceTranscript,
      attachments: uploadedUrls,
      // sender_email and read_by will be handled by the 'chatRelay' function based on the current user
    });

    if (!voiceTranscript) {
      setNewMessage('');
      setShowWarning(false);
      setViolations([]);
      selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setSelectedImages([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    setTimeout(scrollToBottom, 100);
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      showNotification({
        title: 'Speech recognition not supported on this browser. Please use Chrome or Edge.',
        type: 'error',
      });
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-SA';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      showNotification({
        title: `Speech recognition error: ${event.error}`,
        type: 'error',
      });
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSendMessage(null, transcript);
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSendServiceOffer = () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      showNotification({
        title: 'Please enter a valid price.',
        type: 'warning',
      });
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const { basePrice, sawaCommission, officeCommission, totalPrice } =
      calculatePricing(offerPrice);

    createOfferMutation.mutate({
      offer_type: 'service',
      host_price: basePrice,
      sawa_commission: sawaCommission,
      office_commission: officeCommission,
      price: totalPrice,
      total_price: totalPrice,
      inclusions: offerInclusions || 'All selected services',
      message: offerMessage,
      expiry_date: expiryDate.toISOString(),
      status: 'pending',
    });
  };

  const handleSendRentalOffer = () => {
    if (!rentalPrice || parseFloat(rentalPrice) <= 0) {
      showNotification({
        title: 'Please enter a valid rental price.',
        type: 'warning',
      });
      return;
    }
    if (!rentalDetails.trim()) {
      showNotification({
        title: 'Please provide rental details.',
        type: 'warning',
      });
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const price = parseFloat(rentalPrice);

    createOfferMutation.mutate({
      offer_type: 'rental',
      host_price: price,
      sawa_commission: 0,
      office_commission: 0,
      price: price,
      total_price: price,
      inclusions: `${rentalType} Rental`,
      rental_details: rentalDetails,
      message: rentalMessage,
      expiry_date: expiryDate.toISOString(),
      status: 'pending',
    });
  };

  // Error Handling
  if (conversationError) {
    return (
      <div className='flex items-center justify-center h-full p-8'>
        <div className='text-center'>
          <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h3 className='text-xl font-bold text-gray-900 mb-2'>Failed to load conversation</h3>
          <p className='text-gray-600 mb-4'>Please try again</p>
          {onBack && (
            <Button onClick={onBack} variant='outline'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoadingConversation || isLoadingBooking || isLoadingAllUsers) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className='flex items-center justify-center h-full p-8'>
        <div className='text-center'>
          <p className='text-gray-600'>Conversation not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      offered: 'bg-purple-100 text-purple-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canSendOffers = booking && !booking.adventure_id;
  const totalAcceptedPrice = acceptedOffers.reduce((sum, offer) => sum + (offer.price || 0), 0);
  const hasAcceptedOffers = acceptedOffers.length > 0;
  const isCurrentUserAHostInThisConvo = conversation?.host_emails?.includes(currentUser.email);

  return (
    <div className='flex flex-col h-full bg-white'>
      <header className='flex-shrink-0 p-2 sm:p-4 border-b bg-white sticky top-0 z-10 shadow-sm'>
        <div className='flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            {onBack && (
              <Button
                variant='ghost'
                size='icon'
                onClick={onBack}
                className='lg:hidden flex-shrink-0'
              >
                <ArrowLeft className='w-5 h-5' />
              </Button>
            )}

            {traveler?.profile_photo ? (
              <img
                src={traveler.profile_photo}
                alt={travelerName}
                className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0'
              />
            ) : (
              <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0'>
                {travelerName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className='flex-1 min-w-0'>
              <h3 className='font-bold text-base sm:text-lg text-gray-900 truncate'>
                {travelerName}
              </h3>
              {booking && (
                <p className='text-xs sm:text-sm text-gray-500 truncate'>
                  {booking.city} • {format(new Date(booking.start_date), 'MMM d')}
                </p>
              )}
            </div>
          </div>

          {hasAcceptedOffers && (
            <div className='flex-shrink-0 ml-1'>
              <div className='bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full shadow-lg'>
                <div className='flex items-center gap-1'>
                  <CheckCircle className='w-3 h-3' />
                  <span className='font-bold text-[11px]'>${totalAcceptedPrice.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          {booking && booking.status === 'confirmed' && (
            <Button
              size='sm'
              className='bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-[11px] px-2 py-1 h-7 flex-shrink-0 ml-1'
              onClick={() =>
                showNotification({
                  title: 'Payment tracking coming soon!',
                  type: 'info',
                })
              }
            >
              Paid
            </Button>
          )}
        </div>

        {booking && (
          <div className='bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-1.5 border border-purple-100'>
            <div className='flex items-center justify-between mb-0.5'>
              <div className='flex items-center gap-1 min-w-0 flex-1'>
                <MapPin className='w-2.5 h-2.5 text-[var(--brand-primary)] flex-shrink-0' />
                <span className='font-semibold text-[11px] text-gray-900 truncate'>
                  {booking.city}
                </span>
              </div>
              <Badge
                className={`${getStatusColor(
                  booking.status
                )} text-[9px] px-1 py-0 flex-shrink-0 ml-1`}
              >
                {booking.status}
              </Badge>
            </div>

            <div className='flex flex-wrap gap-1 text-[9px] text-gray-600 mb-0.5'>
              <div className='flex items-center gap-0.5'>
                <Calendar className='w-2 h-2 flex-shrink-0' />
                <span className='truncate'>
                  {format(new Date(booking.start_date), 'MMM d')} -{' '}
                  {format(new Date(booking.end_date), 'MMM d')}
                </span>
              </div>
              <div className='flex items-center gap-0.5'>
                <Users className='w-2 h-2 flex-shrink-0' />
                <span>{booking.number_of_adults}👤</span>
              </div>
            </div>

            {/* Selected Services Section */}
            {booking.selected_services && booking.selected_services.length > 0 && (
              <div className='mb-1 bg-white/80 rounded-md p-1.5 border border-purple-200'>
                <p className='text-[9px] font-bold text-[var(--brand-primary)] mb-1 flex items-center gap-1'>
                  <Package className='w-2.5 h-2.5' />
                  Selected Services ({booking.selected_services.length})
                </p>
                <div className='space-y-0.5'>
                  {booking.selected_services.map((service, idx) => (
                    <div key={idx} className='flex items-center gap-1 text-[9px] text-gray-700'>
                      <div className='w-1 h-1 rounded-full bg-[var(--brand-primary)]' />
                      <span className='flex-1 truncate'>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasAcceptedOffers && (
              <div className='pt-1 border-t border-purple-200'>
                <p className='text-[9px] font-semibold text-gray-700 mb-0.5'>Accepted:</p>
                <div className='space-y-0.5'>
                  {acceptedOffers.map((offer, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between bg-white/80 rounded px-1.5 py-0.5'
                    >
                      <div className='flex items-center gap-1'>
                        <CheckCircle className='w-2.5 h-2.5 text-green-600 flex-shrink-0' />
                        <span className='text-[9px] text-gray-600 truncate'>
                          {offer.offer_type === 'rental'
                            ? offer.rental_details?.substring(0, 15)
                            : offer.inclusions?.substring(0, 15)}
                        </span>
                      </div>
                      <span className='text-[10px] font-bold text-green-600 ml-1'>
                        ${offer.price}
                      </span>
                    </div>
                  ))}
                </div>
                <div className='flex items-center justify-between mt-1 pt-1 border-t border-gray-200'>
                  <span className='text-[10px] font-bold text-gray-900'>Total:</span>
                  <span className='text-xs font-bold text-green-600'>
                    ${totalAcceptedPrice.toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {canSendOffers && (
          <div className='mt-1 sm:mt-2 flex gap-1'>
            <Button
              onClick={() => setShowOfferDialog(true)}
              size='sm'
              className='flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-[10px] h-6'
            >
              <DollarSign className='w-3 h-3 sm:mr-1' />
              <span className='hidden sm:inline'>Service</span>
            </Button>
            <Button
              onClick={() => setShowRentalOfferDialog(true)}
              size='sm'
              variant='outline'
              className='flex-1 border-[var(--brand-primary)] text-[var(--brand-primary)] text-[10px] h-6'
            >
              <Package className='w-3 h-3 sm:mr-1' />
              <span className='hidden sm:inline'>Rental</span>
            </Button>
          </div>
        )}

        {hasAcceptedServiceOffer && hasAcceptedRentalOffer && (
          <div className='mt-1'>
            <Badge className='w-full justify-center py-1 bg-green-50 text-green-700 border border-green-200 text-[9px]'>
              <CheckCircle className='w-3 h-3 mr-1' />
              All Offers Accepted
            </Badge>
          </div>
        )}

        <div className='p-0'>
          {booking?.aiTranslationEnabled && (
            <div className='bg-green-50 border-b border-green-200 text-xs text-green-700 px-3 py-1.5 flex items-center gap-2'>
              <Globe className='w-4 h-4' />
              <span>Smart Translation is active.</span>
            </div>
          )}

          <div className='flex items-center justify-between px-3 py-2 border-b bg-white sticky top-[68px] z-10'>
            <div className='flex flex-col'>
              <span className='text-xs text-gray-600'>🌐 Display messages in:</span>
              <select
                value={displayLanguage}
                onChange={(e) => {
                  const lang = normLang(e.target.value);
                  console.log('🌍 [Host] User changed display language to:', lang);
                  setDisplayLanguage(lang);
                  localStorage.setItem('sawa_display_lang', lang);
                }}
                className='border rounded-md text-sm px-2 py-1 focus:ring-2 focus:ring-purple-400 bg-gray-50 mt-1'
                dir={displayLanguage === 'ar' ? 'rtl' : 'ltr'}
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center gap-2'>
              <label htmlFor='autoVoiceHost' className='text-xs text-gray-700 text-right'>
                🔊 Auto Voice
              </label>
              <input
                id='autoVoiceHost'
                type='checkbox'
                checked={autoVoice}
                onChange={toggleAutoVoice}
                className='accent-purple-600 w-4 h-4'
              />
            </div>
          </div>
        </div>
      </header>

      <main
        ref={messagesContainerRef} // Attached ref to the main scrollable container
        className='flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-gray-50'
      >
        {/* Security Notice */}
        <Alert className='bg-blue-50 border-blue-200'>
          <AlertTriangle className='h-4 w-4 text-blue-600' />
          <AlertDescription className='text-xs text-blue-800'>
            🔒 For your safety, sharing personal contact information (phone numbers, emails, links)
            is prohibited. Keep all communication within the platform.
          </AlertDescription>
        </Alert>

        {/* Show load more indicator */}
        {hasMore && (
          <div className='text-center py-4'>
            <button
              onClick={loadMore}
              disabled={isTranslating}
              className='text-sm text-purple-600 hover:text-purple-700 font-medium px-4 py-2 rounded-full bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50'
            >
              {isTranslating ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin inline mr-2' />
                  Loading...
                </>
              ) : (
                `↑ Load ${Math.min(20, totalMessages - visibleCount)} older messages`
              )}
            </button>
          </div>
        )}

        {isLoadingMessages ? (
          <div className='flex justify-center items-center h-full min-h-[100px]'>
            <div className='flex flex-col items-center gap-2'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
              <p className='text-sm text-gray-500'>Loading messages...</p>
            </div>
          </div>
        ) : isTranslating && processedMessages.length === 0 ? (
          <div className='flex justify-center items-center h-full min-h-[100px]'>
            <div className='flex flex-col items-center gap-2'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
              <p className='text-sm text-gray-500'>🔄 Translating messages...</p>
            </div>
          </div>
        ) : (
          allItems.map((item) => {
            if (item.type === 'offer') {
              return (
                <OfferCard
                  key={`offer-${item.id}`}
                  offer={item}
                  currentUser={currentUser}
                  onAccept={acceptOfferMutation.mutate}
                />
              );
            }
            return (
              <MessageBubble
                key={`msg-${item.id}`}
                message={{
                  ...item,
                  content:
                    item.displayText || item.originalTextForDisplay || item.original_text || '',
                  originalTextForDisplay: item.originalTextForDisplay || item.original_text || '',
                }}
                currentUser={currentUser}
                displayLanguage={normalizedLang}
                isHostInConversation={isCurrentUserAHostInThisConvo}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Recording Indicator */}
      {isRecording && (
        <div className='fixed bottom-24 right-6 bg-red-50 border border-red-300 text-red-600 text-xs px-3 py-1 rounded-full shadow animate-pulse z-50'>
          🎙️ Recording voice... speak now
        </div>
      )}

      {autoVoice && (
        <div className='fixed bottom-20 right-5 bg-purple-50 border border-purple-200 text-purple-700 text-xs px-3 py-1 rounded-full shadow animate-20'>
          🎧 Auto Voice Active
        </div>
      )}

      {selectedImages.length > 0 && (
        <div className='flex-shrink-0 p-2 bg-gray-50 border-t'>
          <div className='flex gap-2 overflow-x-auto'>
            {selectedImages.map((imageObj, idx) => (
              <div key={idx} className='relative flex-shrink-0'>
                <img
                  src={imageObj.preview}
                  alt={`Preview ${idx + 1}`}
                  className='h-20 w-20 object-cover rounded-lg border-2 border-gray-200'
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className='flex-shrink-0 border-t bg-white sticky bottom-0 shadow-lg'>
        {showWarning && violations.length > 0 && (
          <div className='px-2 sm:px-4 pt-2'>
            <Alert className='bg-red-50 border-red-200'>
              <AlertTriangle className='h-4 w-4 text-red-600' />
              <AlertDescription className='text-xs text-red-800'>
                <strong>⚠️ Warning:</strong>{' '}
                {violations.map((v, idx) => (
                  <span key={idx}>
                    {v.message}
                    {idx < violations.length - 1 && ', '}
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSendMessage} className='flex items-end gap-1.5 sm:gap-2 p-2 sm:p-4'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            onChange={handleImageSelect}
            className='hidden'
          />
          <Button
            type='button'
            size='icon'
            variant='ghost'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImages || selectedImages.length >= 4 || isRecording}
            className='h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 rounded-full text-[var(--brand-primary)] hover:bg-[var(--brand-bg-accent-light)]'
          >
            <ImageIcon className='w-5 h-5' />
          </Button>

          <Input
            value={newMessage}
            onChange={handleMessageChange}
            placeholder='اكتب رسالة...'
            className={`flex-1 text-sm h-9 sm:h-11 rounded-full ${
              showWarning ? 'border-red-300 focus:border-red-500' : ''
            }`}
            disabled={uploadingImages || isRecording}
          />
          <Button
            type='button'
            size='icon'
            onClick={isRecording ? stopRecording : startRecording}
            className={`h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 rounded-full ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'
            }`}
            disabled={uploadingImages}
          >
            {isRecording ? <Square className='w-4 h-4' /> : <Mic className='w-4 h-4' />}
          </Button>
          <Button
            type='submit'
            size='icon'
            disabled={
              createMessageMutation.isPending ||
              uploadingImages ||
              (!newMessage.trim() && selectedImages.length === 0) ||
              showWarning ||
              isRecording
            }
            className={`h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 rounded-full ${
              showWarning || isRecording
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'
            }`}
          >
            {createMessageMutation.isPending || uploadingImages ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Send className='w-4 h-4' />
            )}
          </Button>
        </form>

        {uploadingImages && (
          <p className='text-xs text-center text-gray-500 pb-2'>Uploading images...</p>
        )}
      </footer>

      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className='sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Send Service Offer</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <Label htmlFor='offer-price'>Your Service Price (USD) *</Label>
              <Input
                id='offer-price'
                type='number'
                step='0.01'
                min='1'
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder='500'
                required
              />
              <p className='text-xs text-green-600 font-semibold mt-1'>
                {' '}
                You receive this amount (100%)
              </p>
            </div>
            {offerPrice && parseFloat(offerPrice) > 0 && (
              <div className='bg-blue-50 rounded-lg p-3 text-sm border border-blue-200'>
                <div className='space-y-1'>
                  <div className='flex justify-between bg-green-50 p-2 rounded'>
                    <span className='font-bold text-green-700'>💰 Your Earnings:</span>
                    <span className='font-bold text-green-700'>
                      ${pricing.basePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className='text-xs text-gray-500 text-center py-1'>
                    + Commissions (Added ON TOP):
                  </div>
                  <div className='flex justify-between text-xs text-gray-600'>
                    <span>+ SAWA ({pricing.isIndependent ? '35%' : '28%'}):</span>
                    <span>+${pricing.sawaCommission.toFixed(2)}</span>
                  </div>
                  {!pricing.isIndependent && (
                    <div className='flex justify-between text-xs text-gray-600'>
                      <span>+ Office (7%):</span>
                      <span>+${pricing.officeCommission.toFixed(2)}</span>
                    </div>
                  )}
                  <div className='border-t pt-1 flex justify-between font-bold'>
                    <span>= Total (Traveler Pays):</span>
                    <span className='text-blue-600'>${pricing.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <p className='text-xs text-green-600 font-semibold mt-2 bg-white p-2 rounded'>
                  You receive ${pricing.basePrice.toFixed(2)} (100% of YOUR price!)
                </p>
              </div>
            )}
            <div>
              <Label htmlFor='offer-inclusions'>What's Included</Label>
              <Input
                id='offer-inclusions'
                value={offerInclusions}
                onChange={(e) => setOfferInclusions(e.target.value)}
                placeholder='All selected services + extras'
              />
            </div>
            <div>
              <Label htmlFor='offer-message'>Message (Optional)</Label>
              <Textarea
                id='offer-message'
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder='Tell them about your offer...'
                rows={3}
              />
            </div>
            <div className='flex gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowOfferDialog(false)}
                className='flex-1'
                disabled={createOfferMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendServiceOffer}
                disabled={
                  createOfferMutation.isPending || !offerPrice || parseFloat(offerPrice) <= 0
                }
                className='flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'
              >
                {createOfferMutation.isPending ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className='w-4 h-4 mr-2' />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRentalOfferDialog} onOpenChange={setShowRentalOfferDialog}>
        <DialogContent className='sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Send Rental Offer</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <Label htmlFor='rental-type'>Rental Type *</Label>
              <Select value={rentalType} onValueChange={setRentalType}>
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Car'>Car Rental</SelectItem>
                  <SelectItem value='House'>House/Apartment</SelectItem>
                  <SelectItem value='Other'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='rental-price'>Rental Price (USD) *</Label>
              <Input
                id='rental-price'
                type='number'
                step='0.01'
                min='1'
                value={rentalPrice}
                onChange={(e) => setRentalPrice(e.target.value)}
                placeholder='300'
                required
              />
              <p className='text-xs text-gray-600 mt-1'>No commission - you receive full amount</p>
            </div>
            <div>
              <Label htmlFor='rental-details'>Details *</Label>
              <Textarea
                id='rental-details'
                value={rentalDetails}
                onChange={(e) => setRentalDetails(e.target.value)}
                placeholder='e.g., Toyota Camry 2023, automatic...'
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor='rental-message'>Message (Optional)</Label>
              <Textarea
                id='rental-message'
                value={rentalMessage}
                onChange={(e) => setRentalMessage(e.target.value)}
                placeholder='Additional info...'
                rows={2}
              />
            </div>
            <div className='flex gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowRentalOfferDialog(false)}
                className='flex-1'
                disabled={createOfferMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendRentalOffer}
                disabled={
                  createOfferMutation.isPending ||
                  !rentalPrice ||
                  parseFloat(rentalPrice) <= 0 ||
                  !rentalDetails.trim()
                }
                className='flex-1 bg-green-600 hover:bg-green-700'
              >
                {createOfferMutation.isPending ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className='w-4 h-4 mr-2' />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
