import React from 'react';
import { Package } from 'lucide-react';
import { SAWA_SERVICES } from '../config/sawaServices';
import { useTranslation } from '../i18n/LanguageContext';
import ServiceCard from '../common/ServiceCard';

export default function ServicesSection() {
  const { language } = useTranslation();

  return (
    <div className='w-full max-w-7xl mx-auto px-4 sm:px-6' id='services-section'>
      {/* Header */}
      <div className='text-center mb-8 sm:mb-10'>
        <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] px-4 py-2 rounded-full mb-4 border border-[#E6CCFF]'>
          <Package className='w-4 h-4 text-[#9933CC]' />
          <span className='text-[#330066] font-semibold text-sm'>
            {language === 'ar' ? 'خدماتنا' : 'Our Services'}
          </span>
        </div>

        <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3'>
          {language === 'ar' ? 'الخدمات التي نقدمها' : 'Services We Offer'}
        </h2>

        <p className='text-sm sm:text-base text-gray-600 max-w-2xl mx-auto'>
          {language === 'ar'
            ? 'كل ما تحتاجه لرحلة لا تُنسى'
            : 'Everything you need for an unforgettable journey'}
        </p>
      </div>

      {/* Services Grid - NO ANIMATIONS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'>
        {SAWA_SERVICES.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={false}
            onToggle={() => {}}
            showBadge={false}
            index={0}
          />
        ))}
      </div>
    </div>
  );
}
