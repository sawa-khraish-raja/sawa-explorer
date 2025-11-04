import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, Loader2, MessageSquare, Briefcase, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllDocuments } from '@/utils/firestore';

import AdminLayout from '../components/admin/AdminLayout';



export default function AdminMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('services');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['allConversations'],
    queryFn: () => getAllDocuments('conversations', '-last_message_timestamp'),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => getAllDocuments('messages', '-created_date', 500),
  });

  //  Separate service and adventure conversations
  const serviceConversations = conversations.filter(
    (c) => c.conversation_type === 'service' || !c.conversation_type
  );
  const adventureConversations = conversations.filter((c) => c.conversation_type === 'adventure');

  const filteredServiceConversations = serviceConversations.filter(
    (convo) =>
      convo.traveler_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      convo.host_emails?.some((email) => email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAdventureConversations = adventureConversations.filter(
    (convo) =>
      convo.traveler_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      convo.host_emails?.some((email) => email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className='flex justify-center items-center h-96'>
          <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
        </div>
      </AdminLayout>
    );
  }

  const totalServiceMessages = messages.filter((m) => {
    const convo = conversations.find((c) => c.id === m.conversation_id);
    return convo && (convo.conversation_type === 'service' || !convo.conversation_type);
  }).length;

  const totalAdventureMessages = messages.filter((m) => {
    const convo = conversations.find((c) => c.id === m.conversation_id);
    return convo && convo.conversation_type === 'adventure';
  }).length;

  return (
    <AdminLayout>
      <div className='space-y-4 sm:space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Messages Overview</h1>
          <p className='text-gray-500 mt-1'>
            {conversations.length} conversations • {messages.length} messages
          </p>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
          <Input
            placeholder='Search by traveler or host email...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        {/*  Tabs for Services vs Adventures */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='bg-white shadow-md'>
            <TabsTrigger value='services' className='flex items-center gap-2'>
              <Briefcase className='w-4 h-4' />
              Service Messages ({serviceConversations.length})
            </TabsTrigger>
            <TabsTrigger value='adventures' className='flex items-center gap-2'>
              <Sparkles className='w-4 h-4' />
              Adventure Messages ({adventureConversations.length})
            </TabsTrigger>
          </TabsList>

          {/* Service Messages Tab */}
          <TabsContent value='services' className='space-y-4'>
            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Service Conversations</p>
                  <p className='text-2xl font-bold text-gray-900'>{serviceConversations.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Total Messages</p>
                  <p className='text-2xl font-bold text-blue-600'>{totalServiceMessages}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Avg per Convo</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    {serviceConversations.length > 0
                      ? Math.round(totalServiceMessages / serviceConversations.length)
                      : 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Service Conversations List */}
            <Card>
              <CardContent className='p-0'>
                <div className='divide-y'>
                  {filteredServiceConversations.map((convo) => (
                    <div key={convo.id} className='p-4 hover:bg-gray-50 transition-colors'>
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <MessageSquare className='w-4 h-4 text-blue-600' />
                            <p className='font-semibold text-gray-900'>{convo.traveler_email}</p>
                          </div>
                          <p className='text-sm text-gray-600'>
                            Host: {convo.host_emails?.[0] || 'Not assigned'}
                          </p>
                        </div>
                        <Badge variant='outline' className='text-xs'>
                          Service
                        </Badge>
                      </div>
                      {convo.last_message_preview && (
                        <p className='text-sm text-gray-500 line-clamp-1 mb-2'>
                          {convo.last_message_preview}
                        </p>
                      )}
                      {convo.last_message_timestamp && (
                        <p className='text-xs text-gray-400'>
                          {format(new Date(convo.last_message_timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adventure Messages Tab */}
          <TabsContent value='adventures' className='space-y-4'>
            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Adventure Conversations</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {adventureConversations.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Total Messages</p>
                  <p className='text-2xl font-bold text-purple-600'>{totalAdventureMessages}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <p className='text-sm text-gray-600'>Avg per Convo</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {adventureConversations.length > 0
                      ? Math.round(totalAdventureMessages / adventureConversations.length)
                      : 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Adventure Conversations List */}
            <Card>
              <CardContent className='p-0'>
                <div className='divide-y'>
                  {filteredAdventureConversations.map((convo) => (
                    <div key={convo.id} className='p-4 hover:bg-purple-50 transition-colors'>
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <Sparkles className='w-4 h-4 text-purple-600' />
                            <p className='font-semibold text-gray-900'>{convo.traveler_email}</p>
                          </div>
                          <p className='text-sm text-gray-600'>
                            Host: {convo.host_emails?.[0] || 'Not assigned'}
                          </p>
                          {convo.initiated_by && (
                            <p className='text-xs text-purple-600 mt-1'>
                              Started by: {convo.initiated_by}
                            </p>
                          )}
                        </div>
                        <Badge className='bg-purple-100 text-purple-800 text-xs'>Adventure</Badge>
                      </div>
                      {convo.last_message_preview && (
                        <p className='text-sm text-gray-500 line-clamp-1 mb-2'>
                          {convo.last_message_preview}
                        </p>
                      )}
                      {convo.last_message_timestamp && (
                        <p className='text-xs text-gray-400'>
                          {format(new Date(convo.last_message_timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
