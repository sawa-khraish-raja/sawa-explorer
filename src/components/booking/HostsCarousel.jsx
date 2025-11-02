/**
 * 🎯 Hosts Carousel Component
 * ===========================
 * Beautiful carousel for displaying city hosts
 */

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HostsCarousel({ hosts }) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'Host';
    return fullName.split(' ')[0];
  };

  return (
    <div className='relative'>
      {/* Scroll Buttons */}
      <Button
        onClick={() => scroll('left')}
        variant='outline'
        size='icon'
        className='absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-white'
      >
        <ChevronLeft className='w-5 h-5' />
      </Button>

      <Button
        onClick={() => scroll('right')}
        variant='outline'
        size='icon'
        className='absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-white'
      >
        <ChevronRight className='w-5 h-5' />
      </Button>

      {/* Hosts Carousel */}
      <div
        ref={scrollContainerRef}
        className='flex gap-6 overflow-x-auto scrollbar-hide px-12 py-4'
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {hosts.map((host) => (
          <div
            key={host.id}
            onClick={() =>
              navigate(createPageUrl(`HostProfile?email=${encodeURIComponent(host.email)}`))
            }
            className='flex-shrink-0 w-32 cursor-pointer group'
          >
            <div className='relative mb-3'>
              <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-2xl transition-all duration-300 ring-2 ring-purple-200 group-hover:ring-4 group-hover:ring-purple-400 group-hover:scale-105'>
                {host.profile_photo ? (
                  <img
                    src={host.profile_photo}
                    alt={host.display_name || host.full_name}
                    className='w-full h-full object-cover'
                    loading='lazy'
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center'>
                    <User className='w-12 h-12 text-white' />
                  </div>
                )}
              </div>
            </div>

            <div className='text-center'>
              <h3 className='font-bold text-gray-900 group-hover:text-purple-600 transition-colors'>
                {getFirstName(host.display_name || host.full_name)}
              </h3>
              {host.rating && (
                <p className='text-xs text-gray-500 mt-1'>⭐ {host.rating.toFixed(1)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
