import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BeforeAfterDemo({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // ✅ Only show in development
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // ✅ Sync scroll between both sides (BEFORE any returns)
  useEffect(() => {
    if (!isDemoMode || !isDev) return;

    const handleScroll = (e) => {
      const other = e.target === leftRef.current ? rightRef.current : leftRef.current;
      if (other) {
        other.scrollTop = e.target.scrollTop;
        other.scrollLeft = e.target.scrollLeft;
      }
    };

    const left = leftRef.current;
    const right = rightRef.current;

    if (left && right) {
      left.addEventListener('scroll', handleScroll);
      right.addEventListener('scroll', handleScroll);

      return () => {
        left.removeEventListener('scroll', handleScroll);
        right.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isDemoMode, isDev]);

  // ✅ Early returns AFTER all hooks
  if (!isDev) return children;

  if (!isDemoMode) {
    return (
      <>
        {children}
        <Button
          onClick={() => setIsDemoMode(true)}
          className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-2xl rounded-full px-6 py-3 flex items-center gap-2 animate-pulse"
        >
          <Maximize2 className="w-5 h-5" />
          <span className="font-bold">View Layout Comparison</span>
        </Button>
      </>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[9998] bg-black ${isFullscreen ? '' : 'p-4'}`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-900 to-indigo-900 flex items-center justify-between px-6 z-50">
          <h2 className="text-white text-lg font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Maximize2 className="w-5 h-5" />
            </div>
            SAWA Layout Comparison Tool
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => setIsDemoMode(false)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4 mr-1" />
              Exit Demo
            </Button>
          </div>
        </div>

        {/* Split View Container */}
        <div className="flex h-full pt-16">
          {/* LEFT: Original Layout */}
          <div className="relative w-1/2 border-r-4 border-purple-500">
            <div className="absolute top-2 left-2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
              BEFORE (Original)
            </div>
            <div
              ref={leftRef}
              className="h-full overflow-auto bg-white"
              style={{
                filter: 'grayscale(0.3) brightness(0.95)',
              }}
            >
              <div className="pointer-events-none select-none">
                {children}
              </div>
            </div>
          </div>

          {/* RIGHT: Optimized Layout */}
          <div className="relative w-1/2">
            <div className="absolute top-2 right-2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
              AFTER (Optimized)
            </div>
            <div
              ref={rightRef}
              className="h-full overflow-auto bg-white"
            >
              <div className="pointer-events-none select-none">
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-2xl">
          <p className="text-sm font-medium text-gray-700">
            Scroll to compare layouts • <span className="text-purple-600 font-bold">Read-only mode</span>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}