import React, { useMemo } from 'react';
import EventCard from './EventCard';
import { Loader2, Calendar, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';

export default function EventList({ city, events = [], isLoading = false, filters = {} }) {
  const { data: lastSync } = useQuery({
    queryKey: ['eventsLastSync'],
    queryFn: async () => {
      const meta = await queryDocuments('systemmetas', [['key', '==', 'events_last_sync',
      ]]);
      return meta[0]?.value || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];

    let result = [...events];

    if (filters?.category && filters.category !== 'All') {
      result = result.filter((e) => {
        if (!e.tags || !Array.isArray(e.tags)) return false;
        return e.tags.includes(filters.category);
      });
    }

    if (filters?.priceRange && Array.isArray(filters.priceRange)) {
      const [min, max] = filters.priceRange;
      result = result.filter((e) => {
        const price = e.price_from || 0;
        return price >= min && price <= max;
      });
    }

    if (filters?.featured === true) {
      result = result.filter((e) => e.is_featured === true);
    }

    return result;
  }, [events, filters]);

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='w-12 h-12 animate-spin text-[#9933CC] mb-4' />
        <p className='text-gray-600'>Loading upcoming events...</p>
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className='text-center py-12 bg-gradient-to-br from-[#F5F3FF] to-white rounded-2xl border-2 border-[#E6E6FF]'
      >
        <div className='w-16 h-16 bg-gradient-to-br from-[#9933CC] to-[#330066] rounded-full flex items-center justify-center mx-auto mb-4'>
          <Sparkles className='w-8 h-8 text-white' />
        </div>
        <h3 className='text-xl font-bold text-gray-900 mb-2'>
          {events.length === 0 ? 'Events Coming Soon' : 'No Events Match Your Filters'}
        </h3>
        <p className='text-gray-600 mb-2'>
          {events.length === 0
            ? `Our AI is discovering exciting events in ${city}`
            : 'Try adjusting your filters to see more events'}
        </p>

        {lastSync && (
          <div className='flex items-center justify-center gap-2 text-sm text-gray-500 mt-4'>
            <Clock className='w-4 h-4' />
            <span>Last updated {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}</span>
          </div>
        )}

        <div className='mt-6 p-4 bg-[#E6E6FF]/30 rounded-xl max-w-md mx-auto'>
          <p className='text-sm text-gray-600'>
            <Sparkles className='w-4 h-4 inline mr-1 text-[#9933CC]' />
            Events are updated daily by AI to bring you the best experiences
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center'>
            <Calendar className='w-5 h-5 text-white' />
          </div>
          <div>
            <h3 className='text-lg font-bold text-gray-900'>
              {filteredEvents.length} Upcoming Event
              {filteredEvents.length !== 1 ? 's' : ''}
            </h3>
            {lastSync && (
              <p className='text-xs text-gray-500 flex items-center gap-1'>
                <Clock className='w-3 h-3' />
                Updated {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/*  Compact 4-Column Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        <AnimatePresence mode='popLayout'>
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.03 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* AI Notice */}
      <div className='mt-8 p-4 bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] rounded-xl border border-[#E6CCFF]'>
        <div className='flex items-start gap-3'>
          <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#9933CC] to-[#330066] flex items-center justify-center flex-shrink-0'>
            <Sparkles className='w-5 h-5 text-white' />
          </div>
          <div>
            <h4 className='font-bold text-gray-900 mb-1 text-sm'>AI-Powered Event Discovery</h4>
            <p className='text-xs text-gray-600 leading-relaxed'>
              Our AI automatically discovers and updates events every 24 hours, ensuring you never
              miss the best experiences in {city}. All past events are automatically removed to keep
              your feed fresh and relevant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
