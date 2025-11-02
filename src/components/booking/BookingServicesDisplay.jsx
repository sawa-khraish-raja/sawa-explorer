import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SAWA_SERVICES, getServiceById } from '../config/sawaServices';
import { Plane, Users, Calendar, Map, Package, Home, ShieldAlert } from 'lucide-react';

const iconMap = {
  Plane,
  Users,
  Calendar,
  Map,
  Package,
  Home,
  ShieldAlert,
};

export default function BookingServicesDisplay({
  serviceIds = [],
  language = 'en',
  showDuration = false,
  serviceDurations = {},
}) {
  if (!serviceIds || serviceIds.length === 0) {
    return (
      <p className='text-sm text-gray-500 italic'>
        {language === 'ar' ? 'لم يتم اختيار خدمات' : 'No services selected'}
      </p>
    );
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {serviceIds.map((serviceId) => {
        const service = getServiceById(serviceId);
        if (!service) return null;

        const IconComponent = iconMap[service.icon] || Package;
        const duration = serviceDurations?.[serviceId];

        return (
          <Badge
            key={serviceId}
            variant='outline'
            className='px-3 py-1.5 bg-purple-50 border-purple-200 text-purple-800 flex items-center gap-1.5 text-xs sm:text-sm'
          >
            <IconComponent className='w-3 h-3 flex-shrink-0' />
            <span className='truncate'>{language === 'ar' ? service.label_ar : service.label}</span>
            {showDuration && duration && (
              <span className='ml-1 text-purple-600 font-semibold flex-shrink-0'>
                ({duration}{' '}
                {language === 'ar'
                  ? duration === 1
                    ? 'يوم'
                    : 'أيام'
                  : duration === 1
                    ? 'day'
                    : 'days'}
                )
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
