import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  //  Hide in Messages page
  const shouldHide = location.pathname.startsWith('/Messages');

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/*  Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none'
            onClick={() => setIsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className='absolute inset-0 lg:inset-auto lg:bottom-24 lg:right-6 lg:w-96 lg:h-[600px] bg-white lg:rounded-2xl lg:shadow-2xl overflow-hidden'
            >
              <ChatPanel onClose={() => setIsOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  Launcher Button - Right Side & Bigger on Mobile */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className='fixed bottom-6 right-4 sm:right-6 z-[9998] w-16 h-16 sm:w-14 sm:h-14 bg-gradient-to-br from-[#330066] to-[#9933CC] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200'
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label='مساعد SAWA الذكي'
      >
        {isOpen ? (
          <X className='w-7 h-7 sm:w-6 sm:h-6 text-white' />
        ) : (
          <>
            <div className='relative'>
              <img
                src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg'
                alt='SAWA AI'
                className='w-8 h-8 sm:w-7 sm:h-7 rounded-full'
              />
              {unreadCount > 0 && (
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
                  <span className='text-white text-xs font-bold'>{unreadCount}</span>
                </div>
              )}
            </div>
          </>
        )}
      </motion.button>

      {/*  Pulsing Ring Animation */}
      {!isOpen && (
        <div className='fixed bottom-6 right-4 sm:right-6 z-[9997] w-16 h-16 sm:w-14 sm:h-14 pointer-events-none'>
          <div className='absolute inset-0 rounded-full bg-[#9933CC] animate-ping opacity-20' />
        </div>
      )}
    </>
  );
}
