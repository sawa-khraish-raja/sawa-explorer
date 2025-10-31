import { toast } from 'sonner';

// ✅ Predefined notification messages
const NOTIFICATION_MESSAGES = {
  en: {
    BOOKING_CREATED: {
      title: '✅ Booking Submitted',
      message: 'Your booking request has been submitted successfully. Hosts will start sending offers soon!'
    },
    OFFER_RECEIVED: {
      title: '🎉 New Offer Received',
      message: 'A host has sent you an offer! Check your bookings to review it.'
    },
    OFFER_ACCEPTED: {
      title: '✨ Offer Accepted',
      message: 'Your offer has been accepted! The booking is now confirmed.'
    },
    BOOKING_CONFIRMED: {
      title: '🎊 Booking Confirmed',
      message: 'Your booking has been confirmed! Get ready for your trip.'
    },
    BOOKING_CANCELLED: {
      title: '❌ Booking Cancelled',
      message: 'Your booking has been cancelled.'
    },
    MESSAGE_RECEIVED: {
      title: '💬 New Message',
      message: 'You have received a new message.'
    },
    SELECT_DESTINATION: {
      title: '📍 Select Destination',
      message: 'Please select a destination to continue'
    },
    ENTER_BUDGET: {
      title: '💰 Enter Budget',
      message: 'Please enter your budget to continue'
    },
    AI_PLANNER_UNAVAILABLE: {
      title: '🚫 AI Planner Unavailable',
      message: 'AI Trip Planner is currently unavailable. Please try again later.'
    },
    PLAN_GENERATED: {
      title: '🎉 Trip Plan Ready',
      message: 'Your personalized trip plan has been generated successfully!'
    }
  },
  ar: {
    BOOKING_CREATED: {
      title: '✅ تم إرسال الحجز',
      message: 'تم إرسال طلب الحجز بنجاح. سيبدأ المضيفون بإرسال العروض قريباً!'
    },
    OFFER_RECEIVED: {
      title: '🎉 عرض جديد',
      message: 'مضيف أرسل لك عرض! تحقق من حجوزاتك لمراجعته.'
    },
    OFFER_ACCEPTED: {
      title: '✨ تم قبول العرض',
      message: 'تم قبول عرضك! الحجز مؤكد الآن.'
    },
    BOOKING_CONFIRMED: {
      title: '🎊 تأكيد الحجز',
      message: 'تم تأكيد حجزك! استعد لرحلتك.'
    },
    BOOKING_CANCELLED: {
      title: '❌ إلغاء الحجز',
      message: 'تم إلغاء حجزك.'
    },
    MESSAGE_RECEIVED: {
      title: '💬 رسالة جديدة',
      message: 'لديك رسالة جديدة.'
    },
    SELECT_DESTINATION: {
      title: '📍 اختر الوجهة',
      message: 'الرجاء اختيار وجهة للمتابعة'
    },
    ENTER_BUDGET: {
      title: '💰 أدخل الميزانية',
      message: 'الرجاء إدخال ميزانيتك للمتابعة'
    },
    AI_PLANNER_UNAVAILABLE: {
      title: '🚫 المخطط غير متاح',
      message: 'مخطط الرحلات بالذكاء الاصطناعي غير متاح حالياً. حاول مرة أخرى لاحقاً.'
    },
    PLAN_GENERATED: {
      title: '🎉 خطة الرحلة جاهزة',
      message: 'تم إنشاء خطة رحلتك المخصصة بنجاح!'
    }
  }
};

export const showPredefinedNotification = (type, level = 'info', language = 'en') => {
  const lang = language === 'ar' ? 'ar' : 'en';
  const notification = NOTIFICATION_MESSAGES[lang][type];
  
  if (!notification) {
    console.warn(`⚠️ Unknown notification type: ${type}`);
    return;
  }

  const toastFn = level === 'error' ? toast.error : 
                  level === 'warning' ? toast.warning :
                  level === 'success' ? toast.success : toast.info;

  toastFn(notification.message, {
    description: notification.title,
    duration: 4000,
  });
};

export const showSuccess = (title, message) => {
  toast.success(message || title, {
    description: message ? title : undefined,
    duration: 4000,
  });
};

export const showError = (title, message) => {
  toast.error(message || title, {
    description: message ? title : undefined,
    duration: 5000,
  });
};

export const showWarning = (title, message) => {
  toast.warning(message || title, {
    description: message ? title : undefined,
    duration: 4000,
  });
};

export const showInfo = (title, message) => {
  toast.info(message || title, {
    description: message ? title : undefined,
    duration: 3000,
  });
};

export const showLoading = (message = 'Loading...') => {
  return toast.loading(message);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};