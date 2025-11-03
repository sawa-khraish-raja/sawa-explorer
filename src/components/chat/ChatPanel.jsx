import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import { useQuery } from '@tanstack/react-query';
import { X, Send, Loader2, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { assistantChat, messageTranslator, translateText, confirmBooking, deleteAccount, notifyHostsOfNewBooking, createPaymentIntent, verifySignature } from '@/utils/functions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
];

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('ar');
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await useAppContext().user;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    const savedLang = localStorage.getItem('chat_language') || 'ar';
    setLanguage(savedLang);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await assistantChat( {
        messages: [...messages, userMessage],
        language,
        userEmail: user?.email,
      });

      if (response.data?.ok && response.data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.reply,
          },
        ]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('chat_language', lang);
    toast.success(`Language changed to ${SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.name}`);
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const isRTL = language === 'ar' || language === 'he';

  return (
    <div className='h-full flex flex-col bg-white' dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#9933CC] to-[#7B2CBF]'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center'>
            <span className='text-2xl'>🤖</span>
          </div>
          <div>
            <h3 className='font-bold text-white'>SAWA Assistant</h3>
            <p className='text-xs text-white/80'>Powered by AI</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='text-white hover:bg-white/20 gap-2'>
                <Globe className='w-4 h-4' />
                <span className='hidden sm:inline'>{currentLang?.flag}</span>
                <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(lang.code === language && 'bg-purple-50 font-semibold')}
                >
                  <span className='mr-2'>{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='text-white hover:bg-white/20'
          >
            <X className='w-5 h-5' />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            <p className='text-lg mb-2'>👋 {language === 'ar' ? 'مرحباً!' : 'Hello!'}</p>
            <p className='text-sm'>
              {language === 'ar' ? 'كيف يمكنني مساعدتك اليوم؟' : 'How can I help you today?'}
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2',
                msg.role === 'user' ? 'bg-[#9933CC] text-white' : 'bg-gray-100 text-gray-900'
              )}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown className='prose prose-sm max-w-none'>{msg.content}</ReactMarkdown>
              ) : (
                <p className='text-slate-50 text-sm'>{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className='flex items-center gap-2 text-gray-500'>
            <Loader2 className='w-4 h-4 animate-spin' />
            <span className='text-sm'>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className='p-4 border-t bg-gray-50'>
        <div className='flex gap-2'>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
            disabled={isLoading}
            className='flex-1'
          />

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className='bg-[#9933CC] hover:bg-[#7B2CBF]'
          >
            {isLoading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Send className='w-4 h-4' />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
