import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Volume2, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationWelcomePrompt() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    //  Check if user already saw the prompt
    const hasSeenPrompt = localStorage.getItem('notification_sound_activated');

    //  Show prompt after 2 seconds if not seen before
    if (!hasSeenPrompt) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleActivate = async () => {
    console.log('🔔 [Welcome] User activated sound notifications');

    try {
      //  Create and play a test sound to unlock audio
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();

      //  Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      //  Load and play test sound
      const response = await fetch(
        'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'
      );
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.8;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(0);

      console.log(' [Welcome] Test sound played successfully!');

      //  Save preference
      localStorage.setItem('notification_sound_activated', 'true');

      //  Close dialog
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    } catch (error) {
      console.error(' [Welcome] Failed to activate sound:', error);
      //  Still save as activated to not show again
      localStorage.setItem('notification_sound_activated', 'true');
      setIsOpen(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ [Welcome] User skipped sound activation');
    localStorage.setItem('notification_sound_activated', 'skipped');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-md bg-gradient-to-br from-purple-50 via-white to-purple-50 border-2 border-purple-200'>
        <DialogHeader>
          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-3 mb-2'>
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className='w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center'
              >
                <Bell className='w-6 h-6 text-white' />
              </motion.div>
              <DialogTitle className='text-xl font-bold text-gray-900'>
                مرحباً في SAWA! 🎉
              </DialogTitle>
            </div>
            <button
              onClick={handleSkip}
              className='text-gray-400 hover:text-gray-600 transition-colors'
              aria-label='Close'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          <DialogDescription className='text-base text-gray-700 leading-relaxed space-y-3 pt-2'>
            <p className='font-semibold text-purple-700'>🔔 فعّل أصوات الإشعارات</p>
            <p>اضغط على الزر أدناه لتفعيل أصوات الإشعارات وتبقى دائماً على اطلاع بكل جديد!</p>

            <div className='bg-purple-100 border border-purple-200 rounded-lg p-3 mt-3'>
              <div className='flex items-start gap-2'>
                <Volume2 className='w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5' />
                <p className='text-sm text-purple-900'>
                  ستسمع صوت إشعار لطيف عند وصول رسائل جديدة، عروض، أو تحديثات مهمة
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-3 mt-4'>
          <Button
            onClick={handleActivate}
            className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-6 text-base'
          >
            <Volume2 className='w-5 h-5 mr-2' />
            تفعيل الأصوات الآن 🔔
          </Button>

          <Button
            onClick={handleSkip}
            variant='ghost'
            className='w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          >
            ربما لاحقاً
          </Button>
        </div>

        <p className='text-xs text-center text-gray-500 mt-3'>
          يمكنك تغيير هذا الإعداد لاحقاً من إعدادات الإشعارات
        </p>
      </DialogContent>
    </Dialog>
  );
}
