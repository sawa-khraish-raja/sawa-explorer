import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Archive,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AdminForumModeration() {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch pending posts
  const { data: pendingPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['adminForumPosts', 'pending'],
    queryFn: async () => {
      return await base44.entities.ForumPost.filter({ status: 'pending_review' }, '-created_date');
    },
  });

  // Fetch pending comments
  const { data: pendingComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['adminForumComments', 'pending'],
    queryFn: async () => {
      return await base44.entities.ForumComment.filter({ status: 'pending_review' }, '-created_date');
    },
  });

  // Approve post mutation
  const approvePostMutation = useMutation({
    mutationFn: async (postId) => {
      await base44.entities.ForumPost.update(postId, { status: 'published' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminForumPosts']);
      toast.success('✅ Post approved!');
    },
  });

  // Reject post mutation
  const rejectPostMutation = useMutation({
    mutationFn: async ({ postId, notes }) => {
      await base44.entities.ForumPost.update(postId, {
        status: 'rejected',
        admin_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminForumPosts']);
      setShowRejectDialog(false);
      setAdminNotes('');
      toast.success('Post rejected');
    },
  });

  // Approve comment mutation
  const approveCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.ForumComment.update(commentId, { status: 'published' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminForumComments']);
      toast.success('✅ Comment approved!');
    },
  });

  // Reject comment mutation
  const rejectCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.ForumComment.update(commentId, { status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminForumComments']);
      toast.success('Comment rejected');
    },
  });

  const handleRejectPost = (post) => {
    setSelectedPost(post);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!selectedPost) return;
    rejectPostMutation.mutate({
      postId: selectedPost.id,
      notes: adminNotes
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forum Moderation</h1>
          <p className="text-gray-600 mt-1">Review and moderate community posts and comments</p>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Posts ({pendingPosts.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({pendingComments.length})
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : pendingPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-gray-600">No pending posts to review</p>
                </CardContent>
              </Card>
            ) : (
              pendingPosts.map((post) => (
                <Card key={post.id} className="border-2 border-purple-100">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>By {post.author_first_name}</span>
                          <Badge>{post.category}</Badge>
                          <span>{format(new Date(post.created_date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-3">{post.content_html}</p>
                    
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {post.attachments.slice(0, 4).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Attachment"
                            className="w-full h-24 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => approvePostMutation.mutate(post.id)}
                        disabled={approvePostMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectPost(post)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            {commentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : pendingComments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-gray-600">No pending comments to review</p>
                </CardContent>
              </Card>
            ) : (
              pendingComments.map((comment) => (
                <Card key={comment.id} className="border-2 border-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {comment.author_profile_photo ? (
                        <img
                          src={comment.author_profile_photo}
                          alt={comment.author_first_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                          {comment.author_first_name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{comment.author_first_name}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.created_date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveCommentMutation.mutate(comment.id)}
                        disabled={approveCommentMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectCommentMutation.mutate(comment.id)}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (optional)
            </label>
            <Textarea
              placeholder="Reason for rejection..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectPostMutation.isPending}
            >
              {rejectPostMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}