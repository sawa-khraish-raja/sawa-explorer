import { useState, useEffect, useCallback } from 'react';

import { normLang } from '@/components/i18n/i18nVoice';

import { batchTranslateMessages } from './translationHelper';

/**
 * Unified translation hook for all SAWA chat types
 * With lazy loading + parallel translation for speed
 *
 * @param {Array} messages - Raw messages from the database
 * @param {string} displayLanguage - Current display language
 * @param {string} bookingId - Optional booking ID for context
 * @param {string} city - Optional city for context
 * @returns {Object} { processedMessages, isTranslating, loadMore, hasMore }
 */
export function useSawaTranslation(messages, displayLanguage, bookingId = null, city = null) {
  const [processedMessages, setProcessedMessages] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20); // Show last 20 initially

  //  Normalize display language
  const normalizedLang = normLang(displayLanguage || 'ar');

  //  Parallel translate visible messages
  const translateVisibleMessages = useCallback(async (lang, sourceMessages, count) => {
    if (!sourceMessages?.length) {
      setProcessedMessages([]);
      return;
    }

    // Get last N messages (most recent)
    const visibleMessages = sourceMessages.slice(-count);

    console.log(
      `⚡ [useSawaTranslation] Translating ${visibleMessages.length}/${sourceMessages.length} messages to ${lang} (PARALLEL)`
    );
    setIsTranslating(true);

    try {
      //  USE PARALLEL BATCH TRANSLATION (5 at a time)
      const translated = await batchTranslateMessages(visibleMessages, lang);

      setProcessedMessages(translated);
      console.log(` [useSawaTranslation] Translation complete in parallel mode`);
    } catch (error) {
      console.error('[useSawaTranslation] Translation error:', error);

      // Fallback: show original texts
      const fallbackMessages = visibleMessages.map((m) => ({
        ...m,
        displayText: m.original_text || m.content || m.translated_text || '',
        originalText: m.original_text,
        showOriginal: false,
      }));
      setProcessedMessages(fallbackMessages);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  //  Auto-translate when messages or language changes
  useEffect(() => {
    if (messages?.length > 0) {
      translateVisibleMessages(normalizedLang, messages, visibleCount);
    } else {
      setProcessedMessages([]);
    }
  }, [messages, normalizedLang, visibleCount, translateVisibleMessages]);

  //  Save language preference
  useEffect(() => {
    if (normalizedLang) {
      localStorage.setItem('sawa_display_lang', normalizedLang);
      console.log(` Translation active for ${normalizedLang.toUpperCase()}`);
    }
  }, [normalizedLang]);

  //  Load more messages
  const loadMore = useCallback(() => {
    if (visibleCount < messages.length) {
      setVisibleCount((prev) => Math.min(prev + 20, messages.length));
    }
  }, [visibleCount, messages.length]);

  const hasMore = messages.length > visibleCount;

  return {
    processedMessages,
    isTranslating,
    normalizedLang,
    loadMore,
    hasMore,
    totalMessages: messages.length,
    visibleCount,
  };
}
