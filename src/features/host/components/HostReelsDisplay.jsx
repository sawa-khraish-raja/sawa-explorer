import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Eye, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { cn } from '@/shared/utils';
import { getAllDocuments, queryDocuments, updateDocument } from '@/utils/firestore';

import { UseAppContext } from "@/shared/context/AppContext";
import { NotificationHelpers } from '@/features/shared/notifications/notificationHelpers';

export default function HostReelsDisplay({ hostEmail }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [likeAnimation, setLikeAnimation] = useState(null);

  // Load current user
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await UseAppContext().user;
        console.log(' User loaded:', user?.email);
        setCurrentUser(user);
      } catch (error) {
        console.log(' No user logged in');
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    }
    loadUser();
  }, []);

  const { data: reels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ['publicHostReels', hostEmail],
    queryFn: async () => {
      const allReels = await queryDocuments('host_reels', [
        {
          host_email: hostEmail,
          is_active: true,
        },
        '-created_date',
      ]);
      return allReels;
    },
    enabled: !!hostEmail,
    staleTime: 0,
    refetchInterval: 5000,
  });

  const likeReelMutation = useMutation({
    mutationFn: async (reelId) => {
      // Check if user is logged in
      if (!currentUser) {
        console.log(' User not logged in, redirecting...');
        toast.error('Please login to like reels', { duration: 2000 });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        throw new Error('Not logged in');
      }

      // Get fresh reel data
      const allReels = await getAllDocuments('hostreels');
      const reel = allReels.find((r) => r.id === reelId);

      if (!reel) {
        console.error(' Reel not found:', reelId);
        throw new Error('Reel not found');
      }

      const likedBy = Array.isArray(reel.liked_by) ? reel.liked_by : [];
      const hasLiked = likedBy.includes(currentUser.email);

      // Always add like (don't toggle, just like)
      if (hasLiked) {
        return { hasLiked: true, isNewLike: false };
      }

      const newLikedBy = [...likedBy, currentUser.email];
      const newLikesCount = (reel.likes_count || 0) + 1;

      console.log('Updating to:', {
        likes_count: newLikesCount,
        liked_by_length: newLikedBy.length,
      });

      await updateDocument('hostreels', reelId, {
        ...{
          likes_count: newLikesCount,
          liked_by: newLikedBy,
        },
        updated_date: new Date().toISOString(),
      });

      console.log(' Like added successfully');

      //  Send anonymous notification to host
      if (currentUser.email !== reel.host_email) {
        try {
          await NotificationHelpers.onReelLiked(reelId, reel.host_email);
        } catch (notifError) {}
      } else {
        console.log(' User is the host, skipping notification');
      }

      return { hasLiked: true, isNewLike: true };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publicHostReels'] });
      if (data?.isNewLike) {
        toast.success('❤️ Liked!', { duration: 800 });
      }
    },
    onError: (error) => {
      if (error.message !== 'Not logged in') {
        console.error(' Like error:', error);
        toast.error('Failed to like. Please try again.');
      }
    },
  });

  if (isLoadingReels || isLoadingUser) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
      </div>
    );
  }

  if (reels.length === 0) {
    return null;
  }

  return (
    <div className='bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6'>
      <h3 className='font-bold text-lg sm:text-xl text-gray-900 mb-4 flex items-center gap-2'>
        <Play className='w-5 h-5 text-purple-600' />
        Reels
      </h3>

      {/* Instagram-Style Grid */}
      <div className='grid grid-cols-3 gap-1 sm:gap-2'>
        {reels.map((reel) => {
          const likedBy = Array.isArray(reel.liked_by) ? reel.liked_by : [];
          const hasLiked = currentUser && likedBy.includes(currentUser.email);

          return (
            <ReelCard
              key={reel.id}
              reel={reel}
              hasLiked={hasLiked}
              onLike={() => likeReelMutation.mutate(reel.id)}
              isLiking={likeAnimation === reel.id}
              setLikeAnimation={setLikeAnimation}
            />
          );
        })}
      </div>
    </div>
  );
}

//  Separate Reel Card Component with Double Tap
function ReelCard({ reel, hasLiked, onLike, isLiking, setLikeAnimation }) {
  const [tapCount, setTapCount] = useState(0);
  const tapTimeout = useRef(null);

  const handleDoubleTap = () => {
    setTapCount((prev) => prev + 1);

    // Clear previous timeout
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
    }

    // Check if it's a double tap
    if (tapCount === 1) {
      console.log('💗 Double tap detected!');

      // Show like animation
      setLikeAnimation(reel.id);
      setTimeout(() => setLikeAnimation(null), 1000);

      // Trigger like
      onLike();

      // Reset tap count
      setTapCount(0);
    } else {
      // Wait for second tap
      tapTimeout.current = setTimeout(() => {
        setTapCount(0);
      }, 300);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className='relative aspect-[9/16] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group bg-gray-100'
      onClick={handleDoubleTap}
    >
      {/* Media */}
      {reel.media_type === 'video' ? (
        <>
          <video
            src={reel.media_url}
            className='w-full h-full object-cover pointer-events-none'
            muted
            loop
            playsInline
          />
          <div className='absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none'>
            <Play className='w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg' fill='white' />
          </div>
        </>
      ) : (
        <img src={reel.media_url} alt={reel.caption} className='w-full h-full object-cover' />
      )}

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {isLiking && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className='absolute inset-0 flex items-center justify-center pointer-events-none z-20'
          >
            <Heart className='w-24 h-24 text-white fill-white drop-shadow-2xl' />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overlay */}
      <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2 sm:p-3 pointer-events-none'>
        <div className='flex items-center justify-between text-white text-xs sm:text-sm'>
          <span className='flex items-center gap-1'>
            <Heart
              className={cn(
                'w-3 h-3 sm:w-4 sm:h-4',
                hasLiked ? 'fill-red-500 text-red-500' : 'fill-none'
              )}
            />
            {reel.likes_count || 0}
          </span>
          <span className='flex items-center gap-1'>
            <Eye className='w-3 h-3 sm:w-4 sm:h-4' />
            {reel.views_count || 0}
          </span>
        </div>
      </div>

      {/* Double Tap Hint */}
      <div className='absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
        Double tap to like
      </div>
    </motion.div>
  );
}
