import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, DollarSign, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { createPageUrl } from '@/utils';


export default function AdventureCard({ post }) {
  const navigate = useNavigate();
  const adventure = post.adventure_summary;

  if (!adventure) return null;

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(createPageUrl(`ForumPostDetail?id=${post.id}`));
  };

  const handleBookNow = (e) => {
    e.stopPropagation();
    navigate(
      createPageUrl(`CreateAdventureBooking?adventure_id=${post.adventure_entity_id}&guests=1`)
    );
  };

  const spotsLeft = adventure.max_participants - (adventure.current_participants || 0);
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;

  return (
    <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.3 }}>
      <Card className='overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-[#E6E6FF] hover:border-[#9933CC]'>
        {/* Cover Image */}
        <div className='relative h-56 overflow-hidden'>
          <img
            src={
              adventure.image_url ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'
            }
            alt={adventure.title}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent' />

          {/* Category Badge */}
          <Badge className='absolute top-4 left-4 bg-white/95 text-[#330066] backdrop-blur-sm shadow-lg'>
            <MapPin className='w-3 h-3 mr-1' />
            {adventure.city}
          </Badge>

          {/* Availability Badge */}
          {isFull ? (
            <Badge className='absolute top-4 right-4 bg-red-500 text-white shadow-lg'>
              Fully Booked
            </Badge>
          ) : (
            isAlmostFull && (
              <Badge className='absolute top-4 right-4 bg-orange-500 text-white shadow-lg animate-pulse'>
                Only {spotsLeft} spots left!
              </Badge>
            )
          )}

          {/* Price Tag */}
          <div className='absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg'>
            <div className='flex items-center gap-1.5'>
              <DollarSign className='w-4 h-4 text-green-600' />
              <span className='text-lg font-bold text-gray-900'>
                {adventure.traveler_total_price || adventure.host_price}
              </span>
            </div>
          </div>
        </div>

        <CardContent className='p-6'>
          {/* Title */}
          <h3 className='text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#7B2CBF] transition-colors'>
            {adventure.title}
          </h3>

          {/* Details Grid */}
          <div className='grid grid-cols-2 gap-3 mb-4'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar className='w-4 h-4 text-[#7B2CBF]' />
              <span className='font-medium'>{format(new Date(adventure.date), 'MMM d')}</span>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Clock className='w-4 h-4 text-[#7B2CBF]' />
              <span className='font-medium'>{adventure.duration_hours || 4}h</span>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Users className='w-4 h-4 text-[#7B2CBF]' />
              <span className='font-medium'>
                {adventure.current_participants || 0}/{adventure.max_participants}
              </span>
            </div>

            {adventure.category && (
              <Badge variant='outline' className='text-xs justify-self-end'>
                {adventure.category}
              </Badge>
            )}
          </div>

          {/* Host Info */}
          <div className='flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-100'>
            {post.author_profile_photo ? (
              <img
                src={post.author_profile_photo}
                alt={post.author_first_name}
                className='w-9 h-9 rounded-full object-cover border-2 border-[#E6E6FF]'
              />
            ) : (
              <div className='w-9 h-9 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#9933CC] flex items-center justify-center text-white text-sm font-bold'>
                {post.author_first_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className='text-sm font-semibold text-gray-700'>
                Hosted by {post.author_first_name}
              </p>
              <div className='flex items-center gap-1 text-xs text-gray-500'>
                <Star className='w-3 h-3 fill-yellow-400 text-yellow-400' />
                <span>4.9 · 127 reviews</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleViewDetails}
              className='flex-1 border-2 border-[#9933CC] text-[#9933CC] hover:bg-[#9933CC] hover:text-white'
            >
              View Details
            </Button>
            <Button
              onClick={handleBookNow}
              disabled={isFull}
              className='flex-1 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isFull ? 'Fully Booked' : 'Book Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
