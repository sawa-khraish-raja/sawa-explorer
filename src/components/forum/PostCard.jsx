import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  Sparkles,
  Video,
  MapPin,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { queryDocuments } from '@/utils/firestore';

export default function PostCard({ post }) {
  const navigate = useNavigate();

  // Check if author is a host
  const { data: authorUser } = useQuery({
    queryKey: ['user', post.author_email],
    queryFn: async () => {
      const users = await queryDocuments('users', [
        ['email', '==', post.author_email],
      ]);
      return users[0] || null;
    },
    staleTime: 300000, // 5 minutes
  });

  const isHostPost = authorUser?.host_approved;
  const isVideoPost = post.post_type === 'video_reel';
  const isAdventurePost = post.is_adventure_listing && post.adventure_summary;

  const handleClick = () => {
    navigate(createPageUrl(`ForumPostDetail?id=${post.id}`));
  };

  const handleBookAdventure = (e) => {
    e.stopPropagation();
    if (post.adventure_entity_id) {
      navigate(createPageUrl(`AdventureDetails?id=${post.adventure_entity_id}`));
    }
  };

  const likesCount = (post.likes_by || []).length;
  const commentsCount = post.comments_count || 0;
  const viewsCount = post.views_count || 0;

  // Extract first image or video from attachments
  const coverMedia =
    post.attachments && post.attachments.length > 0
      ? post.attachments[0]
      : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        className='overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#9933CC]/20'
        onClick={handleClick}
      >
        {/* Cover Image/Video */}
        <div className='relative h-48 overflow-hidden bg-gradient-to-br from-[#E6E6FF] to-[#CCCCFF]'>
          {isVideoPost ? (
            <video
              src={coverMedia}
              className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
              muted
              loop
            />
          ) : (
            <img
              src={coverMedia}
              alt={post.title}
              className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
            />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />

          {/* Badges */}
          <div className='absolute top-3 left-3 flex gap-2'>
            <Badge className='bg-white/90 text-[#330066] backdrop-blur-sm'>{post.category}</Badge>
            {isVideoPost && (
              <Badge className='bg-purple-600 text-white flex items-center gap-1'>
                <Video className='w-3 h-3' />
                Video
              </Badge>
            )}
            {isAdventurePost && (
              <Badge className='bg-gradient-to-r from-[#330066] to-[#9933CC] text-white flex items-center gap-1'>
                <MapPin className='w-3 h-3' />
                Adventure
              </Badge>
            )}
          </div>

          {/* Date */}
          <div className='absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs'>
            <Calendar className='w-3.5 h-3.5' />
            {format(new Date(post.created_date), 'MMM d, yyyy')}
          </div>
        </div>

        <CardContent className='p-5'>
          {/* Title */}
          <h3 className='text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#7B2CBF] transition-colors'>
            {post.title}
          </h3>

          {/* Content Preview */}
          {!isVideoPost && (
            <p className='text-sm text-gray-600 line-clamp-3 mb-4'>
              {post.content_html.replace(/<[^>]*>/g, '')}
            </p>
          )}

          {/*  Adventure Info if linked */}
          {isAdventurePost && post.adventure_summary && (
            <div className='bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] rounded-lg p-3 mb-4 border border-[#E6E6FF]'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-[#9933CC]' />
                  <span className='text-sm font-semibold text-gray-900'>
                    {post.adventure_summary.city}
                  </span>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-[#9933CC]'>
                    ${post.adventure_summary.traveler_total_price}
                  </div>
                  <div className='text-[10px] text-gray-500'>per person</div>
                </div>
              </div>
              <div className='flex items-center gap-4 text-xs text-gray-600'>
                <div className='flex items-center gap-1'>
                  <Calendar className='w-3 h-3' />
                  {format(new Date(post.adventure_summary.date), 'MMM d')}
                </div>
                <div className='flex items-center gap-1'>
                  <Users className='w-3 h-3' />
                  {post.adventure_summary.current_participants || 0}/
                  {post.adventure_summary.max_participants}
                </div>
              </div>
              <Button
                onClick={handleBookAdventure}
                className='w-full mt-3 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white h-9'
              >
                Book This Adventure
              </Button>
            </div>
          )}

          {/* Author */}
          <div className='flex items-center gap-2.5 mb-4'>
            {post.author_profile_photo ? (
              <img
                src={post.author_profile_photo}
                alt={post.author_first_name}
                className='w-8 h-8 rounded-full object-cover border-2 border-[#E6E6FF]'
              />
            ) : (
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#9933CC] flex items-center justify-center text-white text-xs font-bold'>
                {post.author_first_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className='flex items-center gap-2 flex-1'>
              <span className='text-sm font-semibold text-gray-700'>{post.author_first_name}</span>
              {isHostPost && (
                <Badge className='bg-gradient-to-r from-[#330066] to-[#9933CC] text-white text-[10px] px-2 py-0.5 flex items-center gap-1'>
                  <Sparkles className='w-2.5 h-2.5' />
                  Host
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {post.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant='outline' className='text-[10px] text-gray-600'>
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className='px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1.5'>
              <Heart className='w-4 h-4' />
              <span className='font-medium'>{likesCount}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <MessageCircle className='w-4 h-4' />
              <span className='font-medium'>{commentsCount}</span>
            </div>
          </div>
          <div className='flex items-center gap-1.5 text-gray-500'>
            <Eye className='w-4 h-4' />
            <span className='text-xs'>{viewsCount}</span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
