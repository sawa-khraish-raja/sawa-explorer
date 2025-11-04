import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';


export default function CityGallery({ images = [], cityName }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openLightbox = (index) => {
    setSelectedIndex(index);
    setSelectedImage(images[index]);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const goToNext = () => {
    const nextIndex = (selectedIndex + 1) % images.length;
    setSelectedIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const goToPrevious = () => {
    const prevIndex = (selectedIndex - 1 + images.length) % images.length;
    setSelectedIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

  const handleKeyDown = (e) => {
    if (!selectedImage) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrevious();
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  };

  useEffect(() => {
    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, selectedIndex]);

  return (
    <>
      {/* Gallery Grid - Extra Small Images */}
      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 sm:gap-1.5'>
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className='relative aspect-video overflow-hidden rounded-md group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300'
            onClick={() => openLightbox(idx)}
          >
            <img
              src={img}
              alt={`${cityName || 'Gallery'} ${idx + 1}`}
              className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
              loading='lazy'
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";
              }}
            />

            {/* Overlay - Simplified */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
              <div className='absolute bottom-1 right-1'>
                <div className='w-5 h-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center'>
                  <ZoomIn className='w-3 h-3 text-white' />
                </div>
              </div>
            </div>

            {/* Shine Effect */}
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none' />
          </motion.div>
        ))}
      </div>

      {/* Lightbox - Full Size Images */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center'
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full'
              onClick={closeLightbox}
            >
              <X className='w-6 h-6' />
            </Button>

            {/* Image Counter */}
            <div className='absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium'>
              {selectedIndex + 1} / {images.length}
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full'
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                >
                  <ChevronLeft className='w-8 h-8' />
                </Button>

                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full'
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                >
                  <ChevronRight className='w-8 h-8' />
                </Button>
              </>
            )}

            {/* Main Image */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className='relative max-w-[90vw] max-h-[90vh] flex items-center justify-center'
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt={`${cityName || 'Gallery'} ${selectedIndex + 1}`}
                className='max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl'
              />
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full'>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === selectedIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
