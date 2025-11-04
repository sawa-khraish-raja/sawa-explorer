import { isAIFeatureEnabled, AI_ALLOWED_CONTEXTS } from '../config/aiFlags';
import { isFeatureEnabled } from '../config/featureFlags';
import { normLang } from '../i18n/i18nLang';

//  Client-side translation cache
class TranslationCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  getKey(text, toLang) {
    return `${text.substring(0, 100)}_${normLang(toLang)}`;
  }

  get(text, toLang) {
    if (!isFeatureEnabled('translationCacheEnabled')) return null;
    const key = this.getKey(text, toLang);
    return this.cache.get(key);
  }

  set(text, toLang, translation) {
    if (!isFeatureEnabled('translationCacheEnabled')) return;
    const key = this.getKey(text, toLang);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, translation);
  }

  clear() {
    this.cache.clear();
  }
}

const translationCache = new TranslationCache(50);

//  Debounce helper
let translationQueue = [];
let translationTimer = null;

function debounceTranslation(fn, delay = 100) {
  return (...args) => {
    return new Promise((resolve) => {
      translationQueue.push({ fn, args, resolve });

      if (translationTimer) clearTimeout(translationTimer);

      translationTimer = setTimeout(async () => {
        const queue = [...translationQueue];
        translationQueue = [];

        for (const item of queue) {
          try {
            const result = await item.fn(...item.args);
            item.resolve(result);
          } catch (error) {
            console.error('[Translation] Debounced error:', error);
            item.resolve(item.args[0]); // Return original text on error
          }
        }
      }, delay);
    });
  };
}

/**
 * Translates a single message
 * @param {string} text The text to translate.
 * @param {string} toLang Target language code.
 * @returns {Promise<string>} Translated text.
 */
async function translateMessageRaw(text, toLang) {
  if (!text?.trim()) {
    return text;
  }

  if (!isFeatureEnabled('aiTranslateEnabled')) {
    console.log('[Translation] Feature disabled, returning original');
    return text;
  }

  const targetLang = normLang(toLang);

  // Check cache
  const cached = translationCache.get(text, targetLang);
  if (cached) {
    console.log(`[Translation] Cache hit for ${targetLang}`);
    return cached;
  }

  try {
    const response = await translateText({
      text,
      from: 'auto',
      to: targetLang,
    });

    if (response.data?.ok && response.data?.translated) {
      const translated = response.data.translated.trim();
      translationCache.set(text, targetLang, translated);
      return translated;
    }

    return text; // Fallback
  } catch (error) {
    console.error('[Translation] Error:', error.message);
    return text; // Fallback
  }
}

export const translateMessage = debounceTranslation(translateMessageRaw, 100);

/**
 *  ترجمة الرسائل - للشات فقط
 * Parallel batch translation
 * @param {Array} messages Array of message objects.
 * @param {string} targetLang Target language.
 * @returns {Promise<Array>} Translated messages.
 */
export async function batchTranslateMessages(messages, targetLang) {
  //  التحقق من تفعيل الترجمة
  if (!isAIFeatureEnabled('CHAT_TRANSLATION')) {
    console.log('[Translation] Disabled by feature flag');
    return messages.map((m) => ({
      ...m,
      displayText: m.original_text || m.content || m.translated_text || '',
      originalText: m.original_text,
      showOriginal: false,
    }));
  }

  const normalized = normLang(targetLang || 'ar');

  if (!messages?.length) {
    return [];
  }

  const batchSize = 5;
  const batches = [];

  for (let i = 0; i < messages.length; i += batchSize) {
    batches.push(messages.slice(i, i + batchSize));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      return Promise.all(
        batch.map(async (message) => {
          try {
            const originalText =
              message.original_text || message.content || message.translated_text || '';

            if (!originalText.trim()) {
              return {
                ...message,
                displayText: '',
                originalText: '',
                showOriginal: false,
                isTranslating: false,
              };
            }

            //  إرسال Context مع الترجمة
            const { data } = await translateText({
              text: originalText,
              from: 'auto',
              to: normalized,
              context: AI_ALLOWED_CONTEXTS.CHAT, //  تحديد Context
            });

            if (data?.ok && data?.translated) {
              return {
                ...message,
                displayText: data.translated,
                originalText: originalText,
                showOriginal: false,
                isTranslating: false,
              };
            }

            return {
              ...message,
              displayText: originalText,
              originalText: originalText,
              showOriginal: false,
              isTranslating: false,
            };
          } catch (error) {
            console.error('[Translation] Error:', error);
            const originalText = message.original_text || message.content || '';
            return {
              ...message,
              displayText: originalText,
              originalText: originalText,
              showOriginal: false,
              isTranslating: false,
            };
          }
        })
      );
    })
  );

  return results.flat();
}

export function clearTranslationCache() {
  translationCache.clear();
}
