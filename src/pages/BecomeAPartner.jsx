import { useMutation } from '@tanstack/react-query';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import CountrySelector from '@/components/common/CountrySelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


const translations = {
  en: {
    title: 'Become a Partner',
    subtitle: 'Join the SAWA network and help travelers discover authentic experiences.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    company: 'Company / Organization',
    companyPlaceholder: 'Enter your company name (optional)',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    phone: 'Phone Number',
    phonePlaceholder: 'Enter your phone number (optional)',
    country: 'Country',
    message: 'Message or Collaboration Details',
    messagePlaceholder:
      'Tell us about your business and how you would like to partner with SAWA...',
    submit: 'Submit Application',
    submitting: 'Sending...',
    successTitle: 'Thank you for your interest!',
    successMessage: 'Our team will contact you soon.',
    errorMessage: 'Failed to send your application. Please try again.',
    fullNameRequired: 'Full name is required.',
    emailRequired: 'Email address is required.',
    emailInvalid: 'Please enter a valid email address.',
    countryRequired: 'Country is required.',
    messageRequired: 'Please tell us about your collaboration interest.',
    countryPlaceholder: 'Select a country...',
    countrySearchPlaceholder: 'Search country...',
    countryNoResults: 'No country found.',
  },
  ar: {
    title: 'كن شريكًا',
    subtitle: 'انضم إلى شبكة SAWA وساعد المسافرين على اكتشاف تجارب أصيلة.',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'أدخل اسمك الكامل',
    company: 'الشركة / المؤسسة',
    companyPlaceholder: 'أدخل اسم شركتك (اختياري)',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    phone: 'رقم الهاتف',
    phonePlaceholder: 'أدخل رقم هاتفك (اختياري)',
    country: 'الدولة',
    message: 'رسالة أو تفاصيل التعاون',
    messagePlaceholder: 'أخبرنا عن عملك وكيف ترغب في الشراكة مع SAWA...',
    submit: 'إرسال الطلب',
    submitting: 'جاري الإرسال...',
    successTitle: 'شكرًا لاهتمامك!',
    successMessage: 'سيتواصل معك فريقنا قريبًا.',
    errorMessage: 'فشل إرسال طلبك. يرجى المحاولة مرة أخرى.',
    fullNameRequired: 'الاسم الكامل مطلوب.',
    emailRequired: 'البريد الإلكتروني مطلوب.',
    emailInvalid: 'الرجاء إدخال بريد إلكتروني صالح.',
    countryRequired: 'الدولة مطلوبة.',
    messageRequired: 'الرجاء إخبارنا عن اهتمامك بالتعاون.',
    countryPlaceholder: 'اختر دولة...',
    countrySearchPlaceholder: 'ابحث عن دولة...',
    countryNoResults: 'لم يتم العثور على نتائج.',
  },
};

export default function BecomeAPartner({ language = 'en' }) {
  const [formData, setFormData] = useState({
    full_name: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const t = translations[language];

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      const emailBody = `New Partner Application Received

Full Name: ${data.full_name}
Company/Organization: ${data.company || 'N/A'}
Email: ${data.email}
Phone: ${data.phone || 'N/A'}
Country: ${data.country}

Message:
${data.message}

---
This application was submitted via the SAWA Become a Partner form.`;

      return sendEmail({
        to: 'sawa.khraish.raja@gmail.com',
        subject: `New Partner Application - ${data.full_name}`,
        body: emailBody,
      });
    },
    onSuccess: () => {
      setShowSuccess(true);
      setFormData({
        full_name: '',
        company: '',
        email: '',
        phone: '',
        country: '',
        message: '',
      });
      setErrors({});
      toast.success(t.successTitle);
    },
    onError: (error) => {
      console.error('Error sending email:', error);
      toast.error(t.errorMessage);
    },
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t.fullNameRequired;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.emailInvalid;
    }

    if (!formData.country) {
      newErrors.country = t.countryRequired;
    }

    if (!formData.message.trim()) {
      newErrors.message = t.messageRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      sendEmailMutation.mutate(formData);
    }
  };

  if (showSuccess) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <CheckCircle2 className='w-10 h-10 text-green-600' />
          </div>
          <h2 className='text-3xl font-bold text-gray-900 mb-3'>{t.successTitle}</h2>
          <p className='text-lg text-gray-600 mb-8'>{t.successMessage}</p>
          <Button
            onClick={() => setShowSuccess(false)}
            className='bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8 py-6'
          >
            Submit Another Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-2xl mx-auto'>
        <div className='text-center mb-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-[var(--brand-primary)] rounded-2xl mb-6'>
            <Sparkles className='w-8 h-8 text-white' />
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>{t.title}</h1>
          <p className='text-lg text-gray-600'>{t.subtitle}</p>
        </div>

        <div className='bg-white rounded-3xl shadow-xl p-8 md:p-12'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='full_name' className='text-base font-semibold text-gray-800'>
                {t.fullName} *
              </Label>
              <Input
                id='full_name'
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder={t.fullNamePlaceholder}
                className='h-12 text-base'
              />
              {errors.full_name && <p className='text-sm text-red-500'>{errors.full_name}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='company' className='text-base font-semibold text-gray-800'>
                {t.company}
              </Label>
              <Input
                id='company'
                value={formData.company}
                onChange={handleInputChange}
                placeholder={t.companyPlaceholder}
                className='h-12 text-base'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-base font-semibold text-gray-800'>
                {t.email} *
              </Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t.emailPlaceholder}
                className='h-12 text-base'
              />
              {errors.email && <p className='text-sm text-red-500'>{errors.email}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone' className='text-base font-semibold text-gray-800'>
                {t.phone}
              </Label>
              <Input
                id='phone'
                type='tel'
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t.phonePlaceholder}
                className='h-12 text-base'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='country' className='text-base font-semibold text-gray-800'>
                {t.country} *
              </Label>
              <CountrySelector
                value={formData.country}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, country: val }));
                  if (errors.country) {
                    setErrors((prev) => ({ ...prev, country: null }));
                  }
                }}
                language={language}
                translations={translations}
              />
              {errors.country && <p className='text-sm text-red-500'>{errors.country}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='message' className='text-base font-semibold text-gray-800'>
                {t.message} *
              </Label>
              <Textarea
                id='message'
                value={formData.message}
                onChange={handleInputChange}
                placeholder={t.messagePlaceholder}
                rows={6}
                className='text-base resize-none'
              />
              {errors.message && <p className='text-sm text-red-500'>{errors.message}</p>}
            </div>

            <Button
              type='submit'
              disabled={sendEmailMutation.isPending}
              className='w-full h-14 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-lg font-semibold'
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
