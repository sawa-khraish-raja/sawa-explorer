import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';

import { queryDocuments } from '@/utils/firestore';

const variants = {
  enter: {
    opacity: 0,
    scale: 1.01,
    filter: 'blur(4px)',
  },
  center: {
    zIndex: 2,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: {
    zIndex: 1,
    opacity: 0,
    scale: 0.99,
    filter: 'blur(4px)',
  },
};

export default function PageHeroVideo({ pageType = 'home', cityName = null }) {
  const [page, setPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState({});
  const [videosReady, setVideosReady] = useState({});
  const videoRefs = useRef({});
  const timerRef = useRef(null);

  //  OPTIMIZED: Much longer cache times - 30 min stale, 60 min cache
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['heroSlides', pageType, cityName],
    queryFn: async () => {
      let allSlides;

      if (pageType === 'city' && cityName) {
        allSlides = await queryDocuments(
          'hero_slides',
          [
            ['page_type', '==', 'city'],
            ['city_name', '==', cityName],
            ['is_active', '==', true],
          ],
          {
            orderBy: { field: 'order', direction: 'asc' },
          }
        );
      } else {
        allSlides = await queryDocuments(
          'hero_slides',
          [
            ['page_type', '==', pageType],
            ['is_active', '==', true],
          ],
          {
            orderBy: { field: 'order', direction: 'asc' },
          }
        );
      }

      const validSlides = allSlides.filter((s) => s.video_url);
      const sortedSlides = validSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
      console.log(
        `🎬 Loaded ${pageType}${cityName ? ` (${cityName})` : ''} hero slides:`,
        sortedSlides.length
      );
      return sortedSlides;
    },
    staleTime: 30 * 60 * 1000, //  30 minutes - won't refetch
    cacheTime: 60 * 60 * 1000, //  1 hour - stays in memory
    refetchOnMount: false, //  Don't refetch on remount
    refetchOnWindowFocus: false, //  Don't refetch on focus
    refetchOnReconnect: false, //  Don't refetch on reconnect
  });

  //  Memoize current slide to prevent re-renders
  const currentSlide = useMemo(() => slides[page], [slides, page]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  //  Preload videos in background
  useEffect(() => {
    if (slides.length === 0) return;

    slides.forEach((slide, index) => {
      if (slide.video_url && !videosLoaded[index]) {
        const video = document.createElement('video');
        video.src = slide.video_url;
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.load();

        video.onloadeddata = () => {
          setVideosLoaded((prev) => ({ ...prev, [index]: true }));
        };

        video.oncanplaythrough = () => {
          setVideosReady((prev) => ({ ...prev, [index]: true }));
          console.log(` ${pageType}${cityName ? ` (${cityName})` : ''} video ${index} ready`);
        };
      }
    });
  }, [slides, videosLoaded, pageType, cityName]);

  //  Auto-advance timer
  useEffect(() => {
    if (isPaused || slides.length === 0) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const displayDuration = (currentSlide?.display_duration || 6) * 1000;
    const nextIndex = (page + 1) % slides.length;
    const nextVideoReady = videosReady[nextIndex];

    timerRef.current = setTimeout(() => {
      if (nextVideoReady) {
        setPage(nextIndex);
      } else {
        setTimeout(() => {
          setPage(nextIndex);
        }, 2000);
      }
    }, displayDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused, slides, page, videosReady, currentSlide]);

  //  Preload next video
  useEffect(() => {
    if (slides.length > 1) {
      const nextIndex = (page + 1) % slides.length;
      if (videoRefs.current[nextIndex]) {
        videoRefs.current[nextIndex].load();
      }
    }
  }, [page, slides]);

  if (isLoading || slides.length === 0) {
    return null;
  }

  if (!currentSlide || !currentSlide.video_url) {
    return null;
  }

  const isVideoReady = videosReady[page];

  return (
    <div
      className='absolute inset-0'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/*  Poster Image */}
      {currentSlide?.poster_image && (
        <motion.div
          className='absolute inset-0 z-[1]'
          initial={{ opacity: 1 }}
          animate={{ opacity: isVideoReady ? 0 : 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <img
            src={currentSlide.poster_image}
            alt=''
            className='w-full h-full object-cover'
            loading='eager'
            fetchPriority='high'
          />
        </motion.div>
      )}

      {/*  Fallback gradient */}
      {!currentSlide?.poster_image && (
        <div className='absolute inset-0 z-[1] bg-gradient-to-br from-[#330066] via-[#7B2CBF] to-[#9933CC]' />
      )}

      <AnimatePresence initial={false} mode='sync'>
        <motion.video
          key={`video-${page}`}
          ref={(el) => {
            if (el) {
              videoRefs.current[page] = el;
              if (videosReady[page]) {
                el.play().catch(() => {});
              }
            }
          }}
          src={currentSlide.video_url}
          variants={variants}
          initial='enter'
          animate='center'
          exit='exit'
          transition={{
            opacity: { duration: 4, ease: [0.4, 0.0, 0.2, 1] },
            scale: { duration: 4, ease: [0.4, 0.0, 0.2, 1] },
            filter: { duration: 4, ease: [0.4, 0.0, 0.2, 1] },
          }}
          style={{
            willChange: 'opacity, transform',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className='absolute inset-0 w-full h-full object-cover'
          autoPlay
          loop
          muted
          playsInline
          preload='auto'
          onLoadedData={() => {
            setVideosLoaded((prev) => ({ ...prev, [page]: true }));
          }}
          onCanPlay={() => {
            if (videoRefs.current[page]) {
              videoRefs.current[page].play().catch(() => {});
            }
          }}
          onCanPlayThrough={() => {
            setVideosReady((prev) => ({ ...prev, [page]: true }));
          }}
          onError={() => {
            console.warn(' Video failed:', currentSlide.video_url);
            setTimeout(() => {
              if (slides.length > 1) {
                setPage((prev) => (prev + 1) % slides.length);
              }
            }, 1000);
          }}
        />
      </AnimatePresence>

      {/*  Overlay Gradients */}
      <div className='absolute inset-0 z-[10] pointer-events-none'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#330066]/15 via-transparent to-[#9933CC]/15' />
        <div
          className='absolute inset-0'
          style={{
            background:
              'radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(0,0,0,0.3) 100%)',
          }}
        />
        <div className='absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/60 via-black/30 to-transparent' />
        <div className='absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black/20 via-transparent to-transparent' />
        <div className='absolute inset-0 bg-gradient-to-br from-[#9933CC]/5 to-[#330066]/5 mix-blend-overlay' />
      </div>

      {/*  Bottom Fade */}
      <div className='absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-white/40 to-transparent z-[11] pointer-events-none' />
    </div>
  );
}
