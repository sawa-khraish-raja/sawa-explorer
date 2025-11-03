import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocument, updateDocument, queryDocuments, addDocument } from '@/utils/firestore';
import { useAppContext } from '../components/context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getUserDisplayName } from '@/components/utils/userHelpers';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function ForumPostDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const [newComment, setNewComment] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch post
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['forumPost', postId],
    queryFn: async () => {
      const fetchedPost = await getDocument('forum_posts', postId);

      // Increment view count
      await updateDocument('forum_posts', postId, {
        views_count: (fetchedPost.views_count || 0) + 1,
      });

      return fetchedPost;
    },
    enabled: !!postId,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['forumComments', postId],
    queryFn: async () => {
      const allComments = await queryDocuments('forum_comments', [
        ['post_id', '==', postId],
        ['status', '==', 'published'],
      ], {
        orderBy: { field: 'created_date', direction: 'desc' }
      });
      return allComments;
    },
    enabled: !!postId,
  });

  // Fetch adventure details if this is an adventure post
  const { data: adventure } = useQuery({
    queryKey: ['adventure', post?.adventure_entity_id],
    queryFn: () => getDocument('adventures', post.adventure_entity_id),
    enabled: !!post?.is_adventure_listing && !!post?.adventure_entity_id,
  });

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const likes = post.likes_by || [];
      const hasLiked = likes.includes(user.email);

      const updatedLikes = hasLiked
        ? likes.filter((email) => email !== user.email)
        : [...likes, user.email];

      await updateDocument('forum_posts', postId, {
        likes_by: updatedLikes,
        updated_date: new Date().toISOString(),
      });

      return { hasLiked: !hasLiked };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['forumPost', postId]);
      toast.success(data.hasLiked ? '❤️ Liked!' : 'Unliked');
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const newCommentData = {
        post_id: postId,
        author_email: user.email,
        author_first_name: getUserDisplayName(user),
        author_profile_photo: user.profile_photo,
        content: commentData.content,
        status: 'pending_review',
        created_date: new Date().toISOString(),
      };

      await addDocument('forum_comments', newCommentData);

      // Update comments count
      await updateDocument('forum_posts', postId, {
        comments_count: (post.comments_count || 0) + 1,
        updated_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forumComments', postId]);
      queryClient.invalidateQueries(['forumPost', postId]);
      setNewComment('');
      toast.success(' Comment submitted for review!');
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    addCommentMutation.mutate({ content: newComment });
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  if (postLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='w-12 h-12 animate-spin text-[#9933CC]' />
      </div>
    );
  }

  if (!post) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-12 text-center'>
        <h2 className='text-2xl font-bold text-gray-900 mb-4'>Post not found</h2>
        <Button onClick={() => navigate(createPageUrl('ForumHome'))}>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Forum
        </Button>
      </div>
    );
  }

  const hasLiked = user && (post.likes_by || []).includes(user.email);
  const likesCount = (post.likes_by || []).length;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Back Button */}
        <div className='mb-6'>
          <Link
            to={createPageUrl('ForumHome')}
            className='inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Forum
          </Link>
        </div>

        {/* Post Content */}
        <Card className='mb-6 border-2 border-purple-100'>
          <CardContent className='p-6'>
            {/* Author Info */}
            <div className='flex items-center gap-3 mb-4'>
              {post.author_profile_photo ? (
                <img
                  src={post.author_profile_photo}
                  alt={post.author_first_name}
                  className='w-12 h-12 rounded-full object-cover border-2 border-purple-200'
                />
              ) : (
                <div className='w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold'>
                  {post.author_first_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className='font-bold text-gray-900'>{post.author_first_name}</h3>
                <p className='text-xs text-gray-500'>
                  {format(new Date(post.created_date), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
            </div>

            {/* Category & Tags */}
            <div className='flex flex-wrap gap-2 mb-4'>
              <Badge className='bg-purple-100 text-purple-800'>
                <Tag className='w-3 h-3 mr-1' />
                {post.category}
              </Badge>
              {post.tags &&
                post.tags.map((tag, idx) => (
                  <Badge key={idx} variant='outline' className='text-gray-600'>
                    #{tag}
                  </Badge>
                ))}
            </div>

            {/* Title */}
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>{post.title}</h1>

            {/* Content */}
            <div className='prose prose-lg max-w-none mb-6'>
              <ReactMarkdown>{post.content_html}</ReactMarkdown>
            </div>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
                {post.attachments.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    className='w-full h-48 object-cover rounded-lg'
                  />
                ))}
              </div>
            )}

            {/* Adventure Card (if this is an adventure post) */}
            {post.is_adventure_listing && adventure && (
              <Card className='bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 mb-6'>
                <CardContent className='p-6'>
                  <div className='flex items-center gap-2 mb-4'>
                    <MapPin className='w-5 h-5 text-purple-600' />
                    <h3 className='text-xl font-bold text-gray-900'>Bookable Adventure</h3>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                    <div className='flex items-center gap-2 text-gray-700'>
                      <Calendar className='w-4 h-4 text-purple-600' />
                      <div>
                        <p className='text-xs text-gray-500'>Date</p>
                        <p className='font-semibold'>{format(new Date(adventure.date), 'MMM d')}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 text-gray-700'>
                      <Clock className='w-4 h-4 text-purple-600' />
                      <div>
                        <p className='text-xs text-gray-500'>Duration</p>
                        <p className='font-semibold'>{adventure.duration_hours}h</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 text-gray-700'>
                      <Users className='w-4 h-4 text-purple-600' />
                      <div>
                        <p className='text-xs text-gray-500'>Spots</p>
                        <p className='font-semibold'>
                          {adventure.current_participants || 0}/{adventure.max_participants}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 text-gray-700'>
                      <DollarSign className='w-4 h-4 text-green-600' />
                      <div>
                        <p className='text-xs text-gray-500'>Price</p>
                        <p className='font-semibold text-green-600'>
                          ${adventure.traveler_total_price || adventure.host_price}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      navigate(
                        createPageUrl(
                          `CreateAdventureBooking?adventure_id=${adventure.id}&guests=1`
                        )
                      )
                    }
                    className='w-full bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white h-12'
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Stats & Actions */}
            <div className='flex items-center justify-between pt-6 border-t border-gray-200'>
              <div className='flex items-center gap-4 text-gray-600'>
                <span className='flex items-center gap-1'>
                  <Heart className='w-4 h-4' />
                  {likesCount}
                </span>
                <span className='flex items-center gap-1'>
                  <MessageCircle className='w-4 h-4' />
                  {post.comments_count || 0}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant={hasLiked ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className={hasLiked ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
                  {hasLiked ? 'Liked' : 'Like'}
                </Button>

                <Button variant='outline' size='sm' onClick={handleShare}>
                  <Share2 className='w-4 h-4 mr-1' />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className='border-2 border-purple-100'>
          <CardContent className='p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
              <MessageCircle className='w-5 h-5 text-purple-600' />
              Comments ({comments.length})
            </h3>

            {/* Add Comment */}
            {user ? (
              <div className='mb-8 bg-gray-50 rounded-xl p-4'>
                <Textarea
                  placeholder='Write your comment...'
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className='mb-3'
                  rows={3}
                />
                <div className='flex justify-end'>
                  <Button
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending}
                    className='bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white'
                  >
                    {addCommentMutation.isPending ? (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : (
                      <MessageCircle className='w-4 h-4 mr-2' />
                    )}
                    Post Comment
                  </Button>
                </div>
              </div>
            ) : (
              <div className='mb-8 text-center py-8 bg-gray-50 rounded-xl'>
                <p className='text-gray-600 mb-4'>Log in to add a comment</p>
                <Button onClick={() => navigate('/login')}>
                  Log In
                </Button>
              </div>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
              </div>
            ) : comments.length === 0 ? (
              <div className='text-center py-12 text-gray-500'>
                <MessageCircle className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {comments.map((comment) => (
                  <div key={comment.id} className='bg-white rounded-lg p-4 border border-gray-200'>
                    <div className='flex items-start gap-3'>
                      {comment.author_profile_photo ? (
                        <img
                          src={comment.author_profile_photo}
                          alt={comment.author_first_name}
                          className='w-10 h-10 rounded-full object-cover border-2 border-purple-200'
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold'>
                          {comment.author_first_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-1'>
                          <h4 className='font-bold text-gray-900'>{comment.author_first_name}</h4>
                          <span className='text-xs text-gray-500'>
                            {format(new Date(comment.created_date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className='text-gray-700'>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
