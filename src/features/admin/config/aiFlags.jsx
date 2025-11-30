/**
 * ⚙️ AI Feature Flags - مركزي
 *
 * هذا الملف يتحكم بكل استخدامات الذكاء الاصطناعي في المنصة
 *
 *  المسموح:
 * - المحادثات (ترجمة + تحويل صوت لنص)
 * - Sawa Assistant (المساعد الذكي)
 * - AI Trip Planner (مخطط الرحلات)
 *
 *  ممنوع:
 * - أي AI في نظام الحجز
 * - أي تصحيحات تلقائية خارج الشات
 * - أي ترجمات خارج الشات
 */

export const AI_FLAGS = {
  //  المسموح - المحادثات فقط
  CHAT_TRANSLATION: true, // الترجمة الفورية داخل الشات
  CHAT_SPEECH_TO_TEXT: true, // تحويل الصوت لنص داخل الشات
  CHAT_TEXT_TO_SPEECH: true, // تحويل النص لصوت داخل الشات

  //  المسموح - المساعد و Trip Planner
  SAWA_ASSISTANT: false, // المساعد الذكي
  AI_TRIP_PLANNER: true, // مخطط الرحلات

  //  ممنوع - كل ما عدا ذلك
  BOOKING_AI_VALIDATION: false, // تعطيل "AI Validation: Issues found"
  BOOKING_AI_AUTO_CORRECTION: false, // تعطيل "AI applied some corrections"
  BOOKING_AI_TRANSLATOR: false, // تعطيل /functions/bookingTranslator
  BOOKING_AI_PRICE_ESTIMATE: false, // تعطيل تقديرات الأسعار الذكية
  BOOKING_AI_SUGGESTIONS: false, // تعطيل الاقتراحات الذكية
  GLOBAL_AI_AUTOFIX: false, // تعطيل التصحيح التلقائي العام
  OFFER_AI_ANALYSIS: false, // تعطيل تحليل العروض بالـ AI
};

/**
 * Hook للتحقق من تفعيل ميزة AI معينة
 */
export const useAIFlag = (flagName) => {
  return AI_FLAGS[flagName] || false;
};

/**
 * دالة للتحقق من تفعيل ميزة AI (للاستخدام خارج React)
 */
export const isAIFeatureEnabled = (flagName) => {
  return AI_FLAGS[flagName] || false;
};

/**
 * Context المسموح فيه استخدام AI
 */
export const AI_ALLOWED_CONTEXTS = {
  CHAT: 'chat',
  ASSISTANT: 'assistant',
  TRIP_PLANNER: 'trip_planner',
};

/**
 * التحقق من صلاحية Context لاستخدام AI
 */
export const isAIContextAllowed = (context) => {
  return Object.values(AI_ALLOWED_CONTEXTS).includes(context);
};
