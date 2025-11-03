import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAdventurePosts() {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['allAdventurePosts'],
    queryFn: () => getAllDocuments('adventureposts'),
  });

  const pendingPosts = posts.filter((p) => p.status === 'pending');
  const approvedPosts = posts.filter((p) => p.status === 'approved');
  const rejectedPosts = posts.filter((p) => p.status === 'rejected');

  const moderationMutation = useMutation({
    mutationFn: async ({ postId, status, notes }) => {
      await updateDocument('adventureposts', postId, { ...{
        status,
        admin_notes: notes,
      }, updated_date: new Date().toISOString() });

      // Notify host
      const post = posts.find((p) => p.id === postId);
      if (post) {
        await addDocument('notifications', { ...{
          recipient_email: post.host_email,
          recipient_type: 'host',
          type: status === 'approved' ? 'post_approved' : 'post_rejected',
          title: status === 'approved' ? ' Story Approved!' : ' Story Rejected',
          message:
            status === 'approved'
              ? `Your story "${post.title}" is now live!`
              : `Your story "${post.title}" was not approved. ${notes || ''}`,
          link: `/HostAdventures`,
        }, created_date: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAdventurePosts'] });
      setShowDialog(false);
      setSelectedPost(null);
      setAdminNotes('');
      toast.success(action === 'approved' ? 'Post approved!' : 'Post rejected');
    },
  });

  const handleAction = (post, actionType) => {
    setSelectedPost(post);
    setAction(actionType);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (action === 'rejected' && !adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    moderationMutation.mutate({
      postId: selectedPost.id,
      status: action,
      notes: adminNotes,
    });
  };

  const PostCard = ({ post }) => (
    <Card className='overflow-hidden'>
      <div className='relative aspect-square'>
        {post.media_urls &&
          post.media_urls[0] &&
          (post.media_urls[0].type === 'video' ? (
            <video
              src={post.media_urls[0].url}
              className='w-full h-full object-cover'
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={post.media_urls[0].url}
              alt={post.title}
              className='w-full h-full object-cover'
            />
          ))}
        {post.media_urls && post.media_urls.length > 1 && (
          <Badge className='absolute top-2 right-2 bg-white/90 text-gray-900'>
            +{post.media_urls.length - 1}
          </Badge>
        )}
      </div>

      <CardContent className='p-4'>
        <h3 className='font-bold text-lg mb-2'>{post.title}</h3>
        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{post.caption}</p>

        <div className='flex items-center justify-between text-xs text-gray-500 mb-3'>
          <span>Host: {post.host_first_name}</span>
          <span>{post.city}</span>
          <span>{post.category}</span>
        </div>

        {post.status === 'pending' && (
          <div className='flex gap-2'>
            <Button
              onClick={() => handleAction(post, 'approved')}
              size='sm'
              className='flex-1 bg-green-600 hover:bg-green-700'
            >
              <Check className='w-4 h-4 mr-1' />
              Approve
            </Button>
            <Button
              onClick={() => handleAction(post, 'rejected')}
              size='sm'
              variant='destructive'
              className='flex-1'
            >
              <X className='w-4 h-4 mr-1' />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout currentPage='adventureposts'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Adventure Posts Moderation</h1>
          <p className='text-gray-600 mt-2'>Review and approve host-submitted stories</p>
        </div>

        <Tabs defaultValue='pending'>
          <TabsList>
            <TabsTrigger value='pending'>Pending ({pendingPosts.length})</TabsTrigger>
            <TabsTrigger value='approved'>Approved ({approvedPosts.length})</TabsTrigger>
            <TabsTrigger value='rejected'>Rejected ({rejectedPosts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value='pending' className='mt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {pendingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value='approved' className='mt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {approvedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value='rejected' className='mt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {rejectedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Moderation Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{action === 'approved' ? 'Approve Post' : 'Reject Post'}</DialogTitle>
            </DialogHeader>

            {selectedPost && (
              <div className='space-y-4'>
                <div>
                  <p className='font-semibold'>{selectedPost.title}</p>
                  <p className='text-sm text-gray-600'>{selectedPost.caption}</p>
                </div>

                {action === 'rejected' && (
                  <div>
                    <label className='text-sm font-medium'>Reason for rejection *</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder='Explain why this post cannot be approved...'
                      rows={4}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant='outline' onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={moderationMutation.isPending}
                className={action === 'approved' ? 'bg-green-600' : 'bg-red-600'}
              >
                {moderationMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
