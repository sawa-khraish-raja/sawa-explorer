import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import {
  MessageSquare,
  Loader2,
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


import { normLang } from '@/components/i18n/i18nVoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import { getAllDocuments, queryDocuments, getDocument } from '@/utils/firestore';

import MessageBubble from '../components/chat/MessageBubble';
import { useSawaTranslation } from '../components/chat/useSawaTranslation';

export default function OfficeMessages() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [displayLanguage, setDisplayLanguage] = useState(() =>
    normLang(localStorage.getItem('sawa_display_lang') || 'ar')
  );

  const { data: office } = useQuery({
    queryKey: ['office', user?.email],
    queryFn: async () => {
      const allOffices = await getAllDocuments('offices');
      return (allOffices || []).find(
        (o) =>
          typeof o.email === 'string' &&
          typeof user.email === 'string' &&
          o.email.toLowerCase().trim() === user.email.toLowerCase().trim()
      );
    },
    enabled: !!user?.email,
  });

  const { data: hosts = [] } = useQuery({
    queryKey: ['officeHosts', office?.name],
    queryFn: async () => {
      const allRequests = await getAllDocuments('hostrequests');
      const approvedRequests = (allRequests || []).filter(
        (r) => r.office_name === office.name && r.status === 'approved'
      );
      return approvedRequests.map((req) => ({
        id: req.id,
        email: req.host_email,
        full_name: req.host_full_name,
      }));
    },
    enabled: !!office?.name,
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['officeConversations', hosts.map((h) => h.email).join(',')],
    queryFn: async () => {
      if (!hosts.length) return [];
      const hostEmails = hosts.map((h) => h.email);
      const allConvos = await getAllDocuments('conversations', '-last_message_timestamp');
      return (allConvos || []).filter(
        (c) =>
          Array.isArray(c.host_emails) && c.host_emails.some((email) => hostEmails.includes(email))
      );
    },
    enabled: hosts.length > 0,
  });

  const { data: conversationMessages = [] } = useQuery({
    queryKey: ['conversationMessages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      return queryDocuments(
        'messages',
        [['conversation_id', '==', selectedConversation.id]],
        'created_date'
      );
    },
    enabled: !!selectedConversation?.id,
  });

  //  USE UNIFIED TRANSLATION HOOK for conversation messages
  const { processedMessages, isTranslating, normalizedLang } = useSawaTranslation(
    conversationMessages,
    displayLanguage
  );

  const { data: conversationBooking } = useQuery({
    queryKey: ['conversationBooking', selectedConversation?.booking_id],
    queryFn: async () => {
      if (!selectedConversation?.booking_id) return null;
      return getDocument('bookings', selectedConversation.booking_id);
    },
    enabled: !!selectedConversation?.booking_id,
  });

  const { data: conversationOffers = [] } = useQuery({
    queryKey: ['conversationOffers', selectedConversation?.booking_id],
    queryFn: async () => {
      if (!selectedConversation?.booking_id) return [];
      return queryDocuments('offers', [['booking_id', '==', selectedConversation.booking_id,
      ]]);
    },
    enabled: !!selectedConversation?.booking_id,
  });

  const unreadMessages = (conversations || []).filter(
    (c) =>
      Array.isArray(c.unread_by_hosts) &&
      c.unread_by_hosts.some((email) => (hosts || []).map((h) => h.email).includes(email))
  ).length;

  const handleViewConversation = (convo) => {
    setSelectedConversation(convo);
    setShowConversationDialog(true);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-6 flex items-center gap-4'>
          <Button
            variant='outline'
            onClick={() => navigate(createPageUrl('OfficeDashboard'))}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            Back
          </Button>
          <h1 className='text-3xl font-bold text-gray-900'>Messages ({conversations.length})</h1>
          {unreadMessages > 0 && (
            <Badge className='bg-red-500 text-white'>{unreadMessages} unread</Badge>
          )}
        </div>

        {conversations.length === 0 ? (
          <Card className='text-center py-16'>
            <CardContent>
              <MessageSquare className='w-16 h-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>No Conversations Yet</h3>
              <p className='text-gray-600'>
                Conversations will appear when travelers contact your hosts
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            {conversations.map((convo) => {
              const hostEmails = convo.host_emails || [];
              const conversationHosts = hosts.filter((h) => hostEmails.includes(h.email));
              const isUnread =
                Array.isArray(convo.unread_by_hosts) &&
                convo.unread_by_hosts.some((email) =>
                  (hosts || []).map((h) => h.email).includes(email)
                );

              return (
                <Card
                  key={convo.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleViewConversation(convo)}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <p className='font-semibold text-gray-900 truncate'>
                            {convo.traveler_email}
                          </p>
                          {isUnread && (
                            <Badge className='bg-blue-500 text-white text-xs'>New</Badge>
                          )}
                        </div>
                        {conversationHosts.length > 0 && (
                          <p className='text-xs text-gray-500 mb-1'>
                            Your Host:{' '}
                            {(conversationHosts || []).map((h) => h.full_name).join(', ')}
                          </p>
                        )}
                        <p
                          className={`text-sm truncate ${
                            isUnread ? 'font-medium text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {convo.last_message_preview || 'No messages yet'}
                        </p>
                        {convo.last_message_timestamp && (
                          <p className='text-xs text-gray-400 mt-1'>
                            {formatDistanceToNow(new Date(convo.last_message_timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                      <Eye className='w-5 h-5 text-blue-600 flex-shrink-0' />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversation Details Dialog */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <MessageSquare className='w-5 h-5 text-blue-600' />
              Conversation Details
            </DialogTitle>
          </DialogHeader>

          {selectedConversation && (
            <div className='flex-1 overflow-y-auto space-y-6 p-1'>
              {/* Participants */}
              <Card className='bg-gradient-to-r from-purple-50 to-blue-50'>
                <CardContent className='p-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Traveler</p>
                      <p className='font-semibold text-gray-900'>
                        {selectedConversation.traveler_email}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Your Host(s)</p>
                      <p className='font-semibold text-gray-900'>
                        {(hosts || [])
                          .filter(
                            (h) =>
                              Array.isArray(selectedConversation.host_emails) &&
                              selectedConversation.host_emails.includes(h.email)
                          )
                          .map((h) => h.full_name)
                          .join(', ') || 'None'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Info */}
              {conversationBooking && (
                <Card>
                  <CardContent className='p-4'>
                    <h3 className='font-bold text-gray-900 mb-3 flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      Booking Details
                    </h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='flex items-center gap-2'>
                        <MapPin className='w-4 h-4 text-gray-500' />
                        <span className='text-sm text-gray-700'>{conversationBooking.city}</span>
                      </div>
                      <div>
                        <Badge
                          className={
                            conversationBooking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : conversationBooking.status === 'pending'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                          }
                        >
                          {conversationBooking.status}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4 text-gray-500' />
                        <span className='text-sm text-gray-700'>
                          {format(new Date(conversationBooking.start_date), 'MMM d')} -{' '}
                          {format(new Date(conversationBooking.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {conversationBooking.total_price && (
                        <div>
                          <span className='text-sm font-semibold text-green-600'>
                            ${conversationBooking.total_price}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Offers */}
              {conversationOffers.length > 0 && (
                <Card>
                  <CardContent className='p-4'>
                    <h3 className='font-bold text-gray-900 mb-3 flex items-center gap-2'>
                      <DollarSign className='w-4 h-4' />
                      Offers ({conversationOffers.length})
                    </h3>
                    <div className='space-y-3'>
                      {conversationOffers.map((offer) => {
                        const offerHost = (hosts || []).find((h) => h.email === offer.host_email);
                        return (
                          <div
                            key={offer.id}
                            className='p-3 bg-purple-50 rounded-lg border border-purple-100'
                          >
                            <div className='flex items-center justify-between mb-2'>
                              <span className='font-semibold text-gray-900'>
                                $
                                {offer.price?.toFixed(2) || offer.total_price?.toFixed(2) || '0.00'}
                              </span>
                              <Badge
                                className={
                                  offer.status === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : offer.status === 'pending'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                }
                              >
                                {offer.status}
                              </Badge>
                            </div>
                            <p className='text-sm text-gray-600'>
                              From: {offerHost?.full_name || offer.host_email}
                            </p>
                            {offer.inclusions && (
                              <p className='text-sm text-gray-600 mt-1'>
                                <strong>Includes:</strong> {offer.inclusions}
                              </p>
                            )}
                            {offer.message && (
                              <p className='text-sm text-gray-700 mt-2 italic'>"{offer.message}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Messages */}
              <Card>
                <CardContent className='p-4'>
                  <h3 className='font-bold text-gray-900 mb-4 flex items-center gap-2'>
                    <MessageSquare className='w-4 h-4' />
                    Messages ({processedMessages.length})
                  </h3>

                  {/* Language Selector */}
                  <div className='mb-4'>
                    <select
                      value={displayLanguage}
                      onChange={(e) => setDisplayLanguage(normLang(e.target.value))}
                      className='border rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-purple-400'
                    >
                      <option value='en'>English</option>
                      <option value='ar'>العربية</option>
                      <option value='nl'>Nederlands</option>
                      <option value='de'>Deutsch</option>
                      <option value='fr'>Français</option>
                      <option value='es'>Español</option>
                      <option value='it'>Italiano</option>
                      <option value='sv'>Svenska</option>
                      <option value='da'>Dansk</option>
                      <option value='tr'>Türkçe</option>
                    </select>
                  </div>

                  {isTranslating ? (
                    <div className='flex justify-center py-8'>
                      <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
                    </div>
                  ) : processedMessages.length === 0 ? (
                    <div className='text-center py-8 text-gray-500'>
                      <MessageSquare className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className='space-y-4 max-h-96 overflow-y-auto pr-2'>
                      {processedMessages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={{
                            ...msg,
                            content: msg.displayText,
                            originalTextForDisplay: msg.originalText,
                          }}
                          currentUser={{
                            email: selectedConversation.traveler_email,
                          }}
                          displayLanguage={normalizedLang}
                          isHostInConversation={false}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
