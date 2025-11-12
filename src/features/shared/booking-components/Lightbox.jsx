import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect } from 'react';


export default function Lightbox({ photos, currentIndex, onClose, onNavigate }) {
  const handlePrev = useCallback(() => {
    if (!photos || photos.length === 0) return;
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  }, [photos, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (!photos || photos.length === 0) return;
    onNavigate((currentIndex + 1) % photos.length);
  }, [photos, currentIndex, onNavigate]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [handlePrev, handleNext, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!photos || photos.length === 0) return null;

  return (
    <div
      className='fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <button className='absolute top-4 right-4 text-white text-3xl z-10' onClick={onClose}>
        &times;
      </button>
      <div className='relative max-w-full max-h-full' onClick={(e) => e.stopPropagation()}>
        <img
          src={photos[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className='max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg'
        />
        {photos.length > 1 && (
          <>
            <button
              className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full'
              onClick={handlePrev}
            >
              <ChevronLeft className='w-6 h-6' />
            </button>
            <button
              className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full'
              onClick={handleNext}
            >
              <ChevronRight className='w-6 h-6' />
            </button>
          </>
        )}
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
