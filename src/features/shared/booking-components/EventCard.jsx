import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ExternalLink,
  Star,
} from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils';

const getCategoryIcon = (category) => {
  const icons = {
    Cultural: '🎭',
    Adventure: '🏔️',
    'Food & Dining': '🍽️',
    Music: '🎵',
    Art: '🎨',
    Workshop: '🛠️',
    Sports: '⚽',
    Nature: '🌿',
  };
  return icons[category] || '📅';
};

const getCategoryColor = (category) => {
  const colors = {
    Cultural: 'bg-purple-100 text-purple-800 border-purple-200',
    Adventure: 'bg-orange-100 text-orange-800 border-orange-200',
    'Food & Dining': 'bg-red-100 text-red-800 border-red-200',
    Music: 'bg-blue-100 text-blue-800 border-blue-200',
    Art: 'bg-pink-100 text-pink-800 border-pink-200',
    Workshop: 'bg-green-100 text-green-800 border-green-200',
    Sports: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Nature: 'bg-teal-100 text-teal-800 border-teal-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function EventCard({ event }) {
  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  const isPaid = event.price_from && event.price_from > 0;
  const category = event.tags?.[0] || 'Cultural';

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className='h-full hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-purple-200 bg-white'>
        <CardContent className='p-4'>
          {/* Header: Category + Featured */}
          <div className='flex items-center justify-between mb-3'>
            <Badge
              variant='outline'
              className={cn('text-xs font-semibold border', getCategoryColor(category))}
            >
              <span className='mr-1'>{getCategoryIcon(category)}</span>
              {category}
            </Badge>

            {event.is_featured && (
              <Badge className='bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 text-xs'>
                <Star className='w-3 h-3 mr-1 fill-current' />
                Featured
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className='font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight'>
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className='flex items-start gap-2 mb-2'>
            <Calendar className='w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5' />
            <div className='text-xs text-gray-700'>
              <p className='font-semibold'>{format(startDate, 'MMM dd, yyyy')}</p>
              <p className='text-gray-500'>
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Venue */}
          {event.venue_name && (
            <div className='flex items-start gap-2 mb-2'>
              <MapPin className='w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5' />
              <p className='text-xs text-gray-700 line-clamp-1'>{event.venue_name}</p>
            </div>
          )}

          {/* Price */}
          <div className='flex items-center gap-2 mb-3'>
            <DollarSign className='w-4 h-4 text-green-600 flex-shrink-0' />
            <p className='text-sm font-bold text-gray-900'>
              {isPaid ? (
                <>From ${event.price_from}</>
              ) : (
                <span className='text-green-600'>Free</span>
              )}
            </p>
          </div>

          {/* Description */}
          {event.summary && (
            <p className='text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed'>
              {event.summary}
            </p>
          )}

          {/* Footer: Organizer + CTA */}
          <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
            {event.organizer_name && (
              <div className='flex items-center gap-1 text-xs text-gray-500'>
                <Users className='w-3 h-3' />
                <span className='truncate'>{event.organizer_name}</span>
              </div>
            )}

            {event.source_url && (
              <Button
                size='sm'
                variant='ghost'
                className='h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                onClick={() => window.open(event.source_url, '_blank')}
              >
                Details
                <ExternalLink className='w-3 h-3 ml-1' />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
