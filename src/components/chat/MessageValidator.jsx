const violationPatterns = {
  // Regex for phone numbers (various formats, looks for 7+ digits)
  phone: /(?:(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?(\d{3})[-. ]*(\d{4})(?: *x(\d+))?)/g,
  // Basic email regex
  email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
  // Regex for URLs
  link: /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g,
};

const violationMessages = {
  phone: {
    en: 'Sharing phone numbers is not allowed.',
    ar: 'مشاركة أرقام الهواتف غير مسموح بها.',
  },
  email: {
    en: 'Sharing email addresses is not allowed.',
    ar: 'مشاركة عناوين البريد الإلكتروني غير مسموح بها.',
  },
  link: {
    en: 'Sharing links is not allowed.',
    ar: 'مشاركة الروابط غير مسموح بها.',
  },
};

export class MessageValidator {
  static validate(message) {
    if (typeof message !== 'string' || !message) {
      return { isValid: true, violations: [] };
    }

    const violations = [];

    // Test for phone numbers
    if (violationPatterns.phone.test(message)) {
      const phoneMatches = message.match(violationPatterns.phone) || [];
      if (phoneMatches.some((match) => match.replace(/[^0-9]/g, '').length >= 7)) {
        violations.push({
          type: 'phone',
          message: violationMessages.phone.en,
          messageAr: violationMessages.phone.ar,
        });
      }
    }

    // Test for emails
    if (violationPatterns.email.test(message)) {
      violations.push({
        type: 'email',
        message: violationMessages.email.en,
        messageAr: violationMessages.email.ar,
      });
    }

    // Test for links
    if (violationPatterns.link.test(message)) {
      violations.push({
        type: 'link',
        message: violationMessages.link.en,
        messageAr: violationMessages.link.ar,
      });
    }

    return {
      isValid: violations.length === 0,
      // Deduplicate violations by type
      violations: [...new Map(violations.map((item) => [item['type'], item])).values()],
    };
  }

  static getWarningMessage(violations, language = 'en') {
    if (!violations || violations.length === 0) return '';

    const messages = violations.map((v) => (language === 'ar' ? v.messageAr : v.message));

    if (language === 'ar') {
      return `⚠️ تحذير: ${messages.join(' ')} للسلامة، يرجى إبقاء جميع الاتصالات داخل المنصة.`;
    }
    return `⚠️ Warning: ${messages.join(' ')} For your safety, please keep all communication on the platform.`;
  }
}
