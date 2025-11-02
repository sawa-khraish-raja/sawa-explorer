import React from 'react';
import { Compass, ShieldCheck, Leaf, HeartHandshake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '../i18n/LanguageContext';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Compass className='w-8 h-8 text-[#9933CC]' />,
    titleKey: 'features.authentic',
    descKey: 'features.authentic_desc',
  },
  {
    icon: <ShieldCheck className='w-8 h-8 text-[#9933CC]' />,
    titleKey: 'features.verified',
    descKey: 'features.verified_desc',
  },
  {
    icon: <Leaf className='w-8 h-8 text-[#9933CC]' />,
    titleKey: 'features.sustainable',
    descKey: 'features.sustainable_desc',
  },
  {
    icon: <HeartHandshake className='w-8 h-8 text-[#9933CC]' />,
    titleKey: 'features.personalized',
    descKey: 'features.personalized_desc',
  },
];

export default function WhyChooseSawa() {
  const { t } = useTranslation();

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8'>
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className='group h-full border-2 border-transparent hover:border-[#9933CC] transition-all duration-300 bg-white hover:shadow-xl'>
            <CardContent className='p-8 text-center'>
              {/* Icon - Booking.com trust style */}
              <div className='mx-auto w-20 h-20 bg-gradient-to-br from-purple-50 to-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:shadow-lg'>
                {feature.icon}
              </div>

              {/* Content - clean and clear */}
              <h3 className='text-xl font-bold text-gray-900 mb-3'>{t(feature.titleKey)}</h3>
              <p className='text-gray-600 leading-relaxed'>{t(feature.descKey)}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
