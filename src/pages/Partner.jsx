import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Landmark,
  Megaphone,
  GitMerge,
  Building2,
  Hotel,
  Utensils,
  VenetianMask,
  Briefcase,
  Loader2,
  CheckCircle2,
  Send,
  Handshake,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { addDocument } from '@/utils/firestore';
import { invokeFunction } from '@/utils/functions';

import PageHero from '@/shared/components/PageHero';

const whyPartnerFeatures = [
  {
    icon: <TrendingUp className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Expand Your Reach',
    description:
      'Connect with international travelers eager to explore destinations through trusted local hosts.',
  },
  {
    icon: <Landmark className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Boost Local Economy',
    description: 'Work together to support sustainable tourism and empower local communities.',
  },
  {
    icon: <Megaphone className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Gain Brand Exposure',
    description:
      "Gain exposure through Sawa's marketing campaigns across Europe and the MENA region.",
  },
  {
    icon: <GitMerge className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Seamless Integration',
    description:
      "Whether you're a hotel, tour operator, restaurant, or cultural institution - Sawa makes it easy to share your services.",
  },
];

const whoWePartnerWithItems = [
  {
    icon: <Building2 className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Travel Agencies & Tour Operators',
    description: 'Offer curated packages with local flavor.',
  },
  {
    icon: <Hotel className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Hotels & Guesthouses',
    description: 'Welcome guests looking for authentic stays.',
  },
  {
    icon: <Utensils className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Restaurants & Cafés',
    description: 'Feature local cuisine & dining experiences.',
  },
  {
    icon: <VenetianMask className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Cultural Organizations & Events',
    description: 'Promote festivals, workshops, and experiences.',
  },
  {
    icon: <Briefcase className='w-7 h-7 text-[var(--brand-primary)]' />,
    title: 'Local Businesses',
    description: 'Create new revenue streams by connecting with travelers.',
  },
];

const howItWorksSteps = [
  { title: 'Contact Us', description: 'Reach out with your interest in a partnership.' },
  { title: 'Discuss Details', description: 'Talk through collaboration opportunities.' },
  { title: 'Agreement', description: 'Formalize partnership terms.' },
  { title: 'Launch Partnership', description: 'Begin working and growing together.' },
];

export default function Partner() {
  const [formData, setFormData] = useState({
    first_name: '',
    phone: '',
    email: '',
    organization_name: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.organization_name.trim())
      errors.organization_name = 'Organization name is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    else if (formData.message.trim().length < 20)
      errors.message = 'Message must be at least 20 characters';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitPartnerRequestMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Save to database
      const partnerRequest = await addDocument('partnerrequests', {
        ...data,
        created_date: new Date().toISOString(),
      });

      // 2. Send email to SAWA team
      await invokeFunction('sendEmail', {
        to: 'notificationsawa@gmail.com',
        subject: `🤝 New Partnership Request from ${data.organization_name}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #330066; border-radius: 12px; background: linear-gradient(135deg, #f8f7fa 0%, #E6E6FF 100%);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #330066; margin: 0; font-size: 28px;">🤝 New Partnership Request</h1>
              <p style="color: #9933CC; margin-top: 10px;">Someone wants to partner with SAWA!</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #330066; border-bottom: 2px solid #CCCCFF; padding-bottom: 10px; margin-top: 0;">Contact Information</h2>
              
              <div style="margin: 20px 0;">
                <p style="margin: 10px 0;"><strong style="color: #330066;">Name:</strong> ${data.first_name}</p>
                <p style="margin: 10px 0;"><strong style="color: #330066;">📧 Email:</strong> <a href="mailto:${data.email}" style="color: #9933CC;">${data.email}</a></p>
                <p style="margin: 10px 0;"><strong style="color: #330066;">📞 Phone:</strong> <a href="tel:${data.phone}" style="color: #9933CC;">${data.phone}</a></p>
                <p style="margin: 10px 0;"><strong style="color: #330066;">🏢 Organization:</strong> ${data.organization_name}</p>
              </div>
              
              <h3 style="color: #330066; border-bottom: 2px solid #CCCCFF; padding-bottom: 10px; margin-top: 25px;">Message</h3>
              <div style="background: #f8f7fa; padding: 15px; border-radius: 8px; border-left: 4px solid #9933CC; margin-top: 15px;">
                <p style="margin: 0; line-height: 1.6; color: #333;">${data.message}</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #CCCCFF; text-align: center;">
                <p style="color: #666; font-size: 12px; margin: 5px 0;">Request ID: ${partnerRequest.id}</p>
                <p style="color: #666; font-size: 12px; margin: 5px 0;">Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Damascus' })}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #CCCCFF;">
              <p style="color: #666; font-size: 14px; margin: 0;">This is an automated message from the SAWA Partnership System</p>
            </div>
          </div>
        `,
      });

      // 3. Send confirmation email to partner
      await invokeFunction('sendEmail', {
        to: data.email,
        subject: 'Thank you for your partnership interest - SAWA',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #330066; border-radius: 12px; background: linear-gradient(135deg, #f8f7fa 0%, #E6E6FF 100%);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #330066; margin: 0; font-size: 28px;">🎉 Thank You!</h1>
              <p style="color: #9933CC; margin-top: 10px;">We received your partnership request</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #333; line-height: 1.8; margin-top: 0;">Dear <strong>${data.first_name}</strong>,</p>
              
              <p style="color: #333; line-height: 1.8;">Thank you for your interest in partnering with <strong style="color: #330066;">SAWA</strong>! We're excited about the possibility of working with <strong>${data.organization_name}</strong>.</p>
              
              <p style="color: #333; line-height: 1.8;">Our team will review your request and get back to you within <strong>2-3 business days</strong>.</p>
              
              <div style="background: #f8f7fa; padding: 20px; border-radius: 8px; border-left: 4px solid #9933CC; margin: 25px 0;">
                <h3 style="color: #330066; margin-top: 0;">Your Request Summary</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Organization:</strong> ${data.organization_name}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${data.email}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${data.phone}</p>
              </div>
              
              <p style="color: #333; line-height: 1.8;">In the meantime, feel free to explore our platform and learn more about how SAWA connects travelers with authentic local experiences.</p>
              
              <p style="color: #333; line-height: 1.8; margin-bottom: 0;">Best regards,<br><strong style="color: #330066;">The SAWA Team</strong></p>
            </div>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #CCCCFF;">
              <p style="color: #666; font-size: 14px; margin: 0;">If you have any questions, reply to this email or visit our website</p>
            </div>
          </div>
        `,
      });

      return partnerRequest;
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        first_name: '',
        phone: '',
        email: '',
        organization_name: '',
        message: '',
      });
      toast.success('🎉 Your partnership request has been sent successfully!');

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    },
    onError: (error) => {
      toast.error(`Failed to send request: ${error.message}`);
      console.error('Partnership request error:', error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    submitPartnerRequestMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when user starts typing
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  return (
    <div className='bg-white text-gray-800'>
      {/* Hero Section - Professional */}
      <PageHero
        title='Partner with SAWA'
        subtitle='Join us in creating authentic travel experiences across the Middle East'
        backgroundImage='https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600'
        overlay='gradient'
        size='medium'
        badge={{
          icon: <Handshake className='w-4 h-4' />,
          text: 'Partnerships',
        }}
        actions={
          <>
            <Button
              onClick={() =>
                document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })
              }
              className='bg-white text-[#330066] hover:bg-gray-100 px-8 py-6 text-lg font-bold rounded-xl shadow-xl'
            >
              Become a Partner
            </Button>
            <Button
              onClick={() =>
                document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })
              }
              variant='outline'
              className='border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-bold rounded-xl'
            >
              Talk To Us
            </Button>
          </>
        }
      />

      {/* Why Partner Section */}
      <section className='py-12 sm:py-16 lg:py-20 px-4 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-4xl font-bold text-center mb-12'>Why Partner with Sawa?</h2>
          <div className='grid md:grid-cols-2 gap-x-12 gap-y-10'>
            {whyPartnerFeatures.map((item) => (
              <div key={item.title} className='flex gap-6 items-start'>
                <div className='flex-shrink-0 w-12 h-12 bg-[var(--brand-bg-accent-light)] rounded-lg flex items-center justify-center'>
                  {item.icon}
                </div>
                <div>
                  <h3 className='text-xl font-semibold mb-2'>{item.title}</h3>
                  <p className='text-gray-600'>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Partner With Section */}
      <section className='py-12 sm:py-16 lg:py-20 px-4 bg-[var(--brand-bg-secondary)]'>
        <div className='max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
          <h2 className='text-4xl font-bold mb-12'>Who We Partner With?</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center'>
            {whoWePartnerWithItems.slice(0, 3).map((item) => (
              <div
                key={item.title}
                className='bg-white p-6 rounded-lg text-left flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow'
              >
                {item.icon}
                <div>
                  <h3 className='font-semibold'>{item.title}</h3>
                  <p className='text-sm text-gray-500'>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 justify-center mt-6 max-w-4xl mx-auto'>
            {whoWePartnerWithItems.slice(3).map((item) => (
              <div
                key={item.title}
                className='bg-white p-6 rounded-lg text-left flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow'
              >
                {item.icon}
                <div>
                  <h3 className='font-semibold'>{item.title}</h3>
                  <p className='text-sm text-gray-500'>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className='py-12 sm:py-16 lg:py-20 px-4'>
        <div className='max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
          <p className='text-sm font-semibold text-[var(--brand-primary)] tracking-widest uppercase'>
            PARTNER WITH US
          </p>
          <h2 className='text-4xl font-bold my-4'>How it works?</h2>
          <p className='max-w-2xl mx-auto text-gray-600 mb-16'>
            Together, we bring destinations to life, one authentic experience at a time.
          </p>
          <div className='relative'>
            <div className='absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 hidden sm:block' />
            <div className='relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8'>
              {howItWorksSteps.map((step, index) => (
                <div key={step.title} className='text-center bg-white sm:bg-transparent p-4 sm:p-0'>
                  <div className='relative mb-4'>
                    <div className='w-8 h-8 rounded-full bg-[var(--brand-primary)] mx-auto flex items-center justify-center text-white font-bold'>
                      {index + 1}
                    </div>
                  </div>
                  <h3 className='mb-2 font-semibold text-lg'>{step.title}</h3>
                  <p className='text-sm text-gray-500'>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section
        id='contact-form'
        className='py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-[var(--brand-bg-secondary)] via-white to-[var(--brand-bg-accent-light)]'
      >
        <div className='max-w-3xl mx-auto'>
          <div className='text-center mb-12'>
            <p className='text-sm font-semibold text-[var(--brand-primary)] tracking-widest uppercase'>
              GET IN TOUCH
            </p>
            <h2 className='text-4xl font-bold my-4'>Ready To Partner?</h2>
            <p className='text-gray-600'>
              Fill out the form below and we'll get back to you within 2-3 business days
            </p>
          </div>

          <AnimatePresence mode='wait'>
            {submitted ? (
              <motion.div
                key='success'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-12 shadow-2xl border-2 border-green-200'
              >
                <div className='text-center'>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'
                  >
                    <CheckCircle2 className='w-12 h-12 text-green-600' />
                  </motion.div>
                  <h3 className='text-2xl font-bold text-gray-900 mb-3'>Thank You!</h3>
                  <p className='text-gray-600 mb-4'>
                    Your partnership request has been sent successfully.
                  </p>
                  <p className='text-sm text-gray-500'>
                    We'll review your information and contact you within 2-3 business days.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key='form'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form
                  onSubmit={handleSubmit}
                  className='bg-white rounded-2xl p-8 shadow-2xl border-2 border-[var(--brand-bg-accent)]'
                >
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <Label
                          htmlFor='first_name'
                          className='block text-sm font-semibold text-gray-700 mb-2'
                        >
                          First Name <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          id='first_name'
                          placeholder='Your name'
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className={`h-12 ${formErrors.first_name ? 'border-red-500' : ''}`}
                        />
                        {formErrors.first_name && (
                          <p className='text-red-500 text-xs mt-1'>{formErrors.first_name}</p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor='phone'
                          className='block text-sm font-semibold text-gray-700 mb-2'
                        >
                          Phone Number <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          id='phone'
                          type='tel'
                          placeholder='Your phone number'
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`h-12 ${formErrors.phone ? 'border-red-500' : ''}`}
                        />
                        {formErrors.phone && (
                          <p className='text-red-500 text-xs mt-1'>{formErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor='email'
                        className='block text-sm font-semibold text-gray-700 mb-2'
                      >
                        Email <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder='your.email@example.com'
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`h-12 ${formErrors.email ? 'border-red-500' : ''}`}
                      />
                      {formErrors.email && (
                        <p className='text-red-500 text-xs mt-1'>{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor='organization_name'
                        className='block text-sm font-semibold text-gray-700 mb-2'
                      >
                        Organization Name <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='organization_name'
                        placeholder="Your organization's name"
                        value={formData.organization_name}
                        onChange={handleInputChange}
                        className={`h-12 ${formErrors.organization_name ? 'border-red-500' : ''}`}
                      />
                      {formErrors.organization_name && (
                        <p className='text-red-500 text-xs mt-1'>{formErrors.organization_name}</p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor='message'
                        className='block text-sm font-semibold text-gray-700 mb-2'
                      >
                        Message <span className='text-red-500'>*</span>
                      </Label>
                      <Textarea
                        id='message'
                        placeholder="Tell us about your organization and why you'd like to partner with SAWA..."
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        className={`resize-none ${formErrors.message ? 'border-red-500' : ''}`}
                      />
                      {formErrors.message && (
                        <p className='text-red-500 text-xs mt-1'>{formErrors.message}</p>
                      )}
                      <p className='text-xs text-gray-500 mt-1'>Minimum 20 characters</p>
                    </div>

                    <div className='text-center pt-4'>
                      <Button
                        type='submit'
                        disabled={submitPartnerRequestMutation.isPending}
                        className='w-full h-14 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:from-[var(--brand-primary-hover)] hover:to-[var(--brand-secondary-hover)] text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all'
                      >
                        {submitPartnerRequestMutation.isPending ? (
                          <>
                            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className='w-5 h-5 mr-2' />
                            Submit Partnership Request
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
