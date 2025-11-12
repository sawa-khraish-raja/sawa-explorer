import { toast } from 'sonner';

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message);
};

export const showInfo = (message) => {
  toast.info(message);
};

export const showWarning = (message) => {
  toast.warning(message);
};

export const showNotification = (message, type = 'info') => {
  toast[type](message);
};

const PREDEFINED_MESSAGES = {
  AI_PLANNER_UNAVAILABLE: {
    en: 'AI Trip Planner is currently unavailable',
    ar: 'مخطط الرحلات بالذكاء الاصطناعي غير متاح حاليًا',
  },
  SELECT_DESTINATION: {
    en: 'Please select a destination',
    ar: 'الرجاء اختيار وجهة',
  },
  ENTER_BUDGET: {
    en: 'Please enter your budget',
    ar: 'الرجاء إدخال ميزانيتك',
  },
};

export const showPredefinedNotification = (key, type = 'info', language = 'en') => {
  const message = PREDEFINED_MESSAGES[key]?.[language] || PREDEFINED_MESSAGES[key]?.en || key;
  toast[type](message);
};
