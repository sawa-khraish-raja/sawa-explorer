import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Bell,
  Users,
  MessageSquare,
  Gift,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { getAllDocuments } from '@/utils/firestore';
import { invokeFunction } from '@/utils/functions';
import { UseAppContext } from '@/shared/context/AppContext';
import AdminLayout from '@/features/admin/components/AdminLayout';

export default function AdminBroadcast() {
  const { user } = UseAppContext();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [notificationType, setNotificationType] = useState('message_received');
  const [showPreview, setShowPreview] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersCount'],
    queryFn: () => getAllDocuments('users'),
    staleTime: 2 * 60 * 1000,
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async () => {
      if (!title || !message) {
        throw new Error('Title and message are required');
      }

      const response = await invokeFunction('sendBroadcastNotification', {
        title,
        message,
        link: link || '/Home',
      });

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(` Broadcast sent to ${data.count} users!`, {
        duration: 5000,
        description: 'All users will receive the notification',
      });
      setTitle('');
      setMessage('');
      setLink('');
      setShowPreview(false);
    },
    onError: (error) => {
      toast.error('Failed to send broadcast', {
        description: error.message,
      });
    },
  });

  const notificationTemplates = [
    {
      type: 'welcome',
      icon: Sparkles,
      title: 'Welcome to SAWA! 🎉',
      message:
        'Start your journey by exploring amazing destinations and connecting with local hosts.',
      link: '/Home',
      color: 'from-purple-500 to-pink-500',
    },
    {
      type: 'offer',
      icon: Gift,
      title: '🎁 Special Offer Inside!',
      message: 'Limited time offer: Get 20% off on your first booking! Use code SAWA20',
      link: '/Destinations',
      color: 'from-orange-500 to-red-500',
    },
    {
      type: 'update',
      icon: Info,
      title: '✨ New Features Available',
      message: 'Check out our latest features including AI trip planner and instant booking.',
      link: '/Home',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      type: 'community',
      icon: Users,
      title: '🌍 Join Our Community',
      message: 'Connect with travelers and hosts in our new community forum!',
      link: '/ForumHome',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const handleTemplateSelect = (template) => {
    setTitle(template.title);
    setMessage(template.message);
    setLink(template.link);
    setNotificationType('message_received');
    toast.success('Template loaded! Customize it as needed.');
  };

  const handleSendBroadcast = () => {
    setShowPreview(false);
    sendBroadcastMutation.mutate();
  };

  return (
    <AdminLayout currentPage='broadcast'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-gradient-to-r from-[#330066] via-[#9933CC] to-[#330066] rounded-2xl p-6 text-white shadow-2xl'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
              <Bell className='w-6 h-6' />
            </div>
            <div>
              <h1 className='text-3xl font-bold'>Broadcast Notifications</h1>
              <p className='text-sm text-purple-100'>Send announcements to all users</p>
            </div>
          </div>
          <div className='mt-4 flex items-center gap-2 text-sm'>
            <Users className='w-4 h-4' />
            <span className='font-semibold'>{allUsers.length} active users</span>
            <span className='text-purple-200'>will receive this notification</span>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Form */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Quick Templates */}
            <Card className='border-2 border-gray-100'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-purple-600' />
                  Quick Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {notificationTemplates.map((template, idx) => {
                    const Icon = template.icon;
                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTemplateSelect(template)}
                        className='relative overflow-hidden p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all text-left group'
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                        />
                        <div className='relative'>
                          <div className='flex items-center gap-2 mb-2'>
                            <Icon className='w-5 h-5 text-purple-600' />
                            <span className='font-semibold text-sm text-gray-900'>
                              {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                            </span>
                          </div>
                          <p className='text-xs text-gray-600 line-clamp-2'>{template.message}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Create Notification */}
            <Card className='border-2 border-gray-100'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <MessageSquare className='w-5 h-5 text-purple-600' />
                  Create Notification
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='title' className='text-sm font-semibold'>
                    Notification Title *
                  </Label>
                  <Input
                    id='title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g., Welcome to SAWA! 🎉'
                    className='mt-1.5'
                    maxLength={100}
                  />
                  <p className='text-xs text-gray-500 mt-1'>{title.length}/100 characters</p>
                </div>

                <div>
                  <Label htmlFor='message' className='text-sm font-semibold'>
                    Message *
                  </Label>
                  <Textarea
                    id='message'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder='Write your message here...'
                    rows={5}
                    className='mt-1.5'
                    maxLength={500}
                  />
                  <p className='text-xs text-gray-500 mt-1'>{message.length}/500 characters</p>
                </div>

                <div>
                  <Label htmlFor='link' className='text-sm font-semibold'>
                    Link (Optional)
                  </Label>
                  <Input
                    id='link'
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder='/Home, /Destinations, /Adventures, etc.'
                    className='mt-1.5'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Where should users go when they click? Leave empty for no redirect.
                  </p>
                </div>

                <div className='flex gap-3 pt-4'>
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant='outline'
                    disabled={!title || !message}
                    className='flex-1'
                  >
                    Preview
                  </Button>
                  <Button
                    onClick={handleSendBroadcast}
                    disabled={!title || !message || sendBroadcastMutation.isPending}
                    className='flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                  >
                    {sendBroadcastMutation.isPending ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className='w-4 h-4 mr-2' />
                        Send to All Users
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Tips */}
          <div className='space-y-6'>
            {/* Live Preview */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className='border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white'>
                    <CardHeader>
                      <CardTitle className='text-sm flex items-center gap-2'>
                        <Bell className='w-4 h-4 text-purple-600' />
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='bg-white rounded-xl p-4 shadow-md border border-gray-200'>
                        <div className='flex items-start gap-3'>
                          <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0'>
                            <Bell className='w-5 h-5 text-white' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h4 className='font-bold text-sm text-gray-900 mb-1'>
                              {title || 'Title'}
                            </h4>
                            <p className='text-xs text-gray-600 leading-relaxed'>
                              {message || 'Message'}
                            </p>
                            {link && (
                              <div className='mt-2'>
                                <Badge variant='outline' className='text-xs'>
                                  → {link}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips */}
            <Card className='border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white'>
              <CardHeader>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <Info className='w-4 h-4 text-blue-600' />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-xs text-gray-600'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
                    <span>Keep titles short and engaging (under 50 chars)</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
                    <span>Use emojis to make notifications more appealing</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
                    <span>Include a clear call-to-action</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
                    <span>Test with preview before sending</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <AlertCircle className='w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0' />
                    <span>Avoid sending too many notifications (max 2-3/week)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className='border-2 border-gray-100'>
              <CardHeader>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <Users className='w-4 h-4 text-purple-600' />
                  Reach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center'>
                  <div className='text-4xl font-bold text-purple-600 mb-1'>{allUsers.length}</div>
                  <p className='text-xs text-gray-600'>Active Users</p>
                  <div className='mt-4 pt-4 border-t border-gray-200'>
                    <p className='text-xs text-gray-500'>
                      All registered users will receive this notification instantly
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
