import React from 'react';
import ServiceCard from '../common/ServiceCard';
import {
  SAWA_SERVICES,
  getConflictingServices,
  isFlexibleDurationService,
} from '../config/sawaServices';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ServiceSelector({
  selectedServices,
  onServicesChange,
  serviceDurations = {},
  onServiceDurationChange,
  language = 'en',
}) {
  const handleServiceToggle = (serviceId) => {
    const isCurrentlySelected = selectedServices.includes(serviceId);

    if (isCurrentlySelected) {
      // Remove service
      const newSelected = selectedServices.filter((id) => id !== serviceId);
      onServicesChange(newSelected);

      // Remove duration if flexible service
      if (isFlexibleDurationService(serviceId)) {
        const newDurations = { ...serviceDurations };
        delete newDurations[serviceId];
        onServiceDurationChange(newDurations);
      }
    } else {
      // Add service
      const conflicting = getConflictingServices(serviceId);
      const newSelected = selectedServices.filter((id) => !conflicting.includes(id));
      onServicesChange([...newSelected, serviceId]);

      // Set default duration for flexible service
      if (isFlexibleDurationService(serviceId)) {
        onServiceDurationChange({
          ...serviceDurations,
          [serviceId]: 7,
        });
      }
    }
  };

  const handleDurationChange = (serviceId, value) => {
    const numValue = parseInt(value) || 1;
    const clampedValue = Math.max(1, Math.min(14, numValue));
    onServiceDurationChange({
      ...serviceDurations,
      [serviceId]: clampedValue,
    });
  };

  return (
    <div className='space-y-6'>
      {/* Services Grid - Mobile Optimized */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
        {SAWA_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          const conflicting = getConflictingServices(service.id);
          const hasConflict = conflicting.some((id) => selectedServices.includes(id));

          return (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={isSelected}
              onToggle={() => handleServiceToggle(service.id)}
              disabled={hasConflict && !isSelected}
              showBadge={false}
            />
          );
        })}
      </div>

      {/* Duration Inputs - Only for flexible services */}
      {selectedServices.some((id) => isFlexibleDurationService(id)) && (
        <div className='bg-gradient-to-br from-[#F5F3FF] to-white rounded-xl border-2 border-[#E6E6FF] p-4 sm:p-5 space-y-4'>
          <h4 className='font-semibold text-gray-900 text-sm sm:text-base'>Trip Duration</h4>

          {selectedServices
            .filter((id) => isFlexibleDurationService(id))
            .map((serviceId) => {
              const service = SAWA_SERVICES.find((s) => s.id === serviceId);
              if (!service) return null;

              return (
                <div key={serviceId} className='space-y-2'>
                  <Label
                    htmlFor={`duration-${serviceId}`}
                    className='text-sm font-medium text-gray-700'
                  >
                    {service.label} - Number of Days
                  </Label>
                  <div className='flex items-center gap-3'>
                    <Input
                      id={`duration-${serviceId}`}
                      type='number'
                      min='1'
                      max='14'
                      value={serviceDurations[serviceId] || 7}
                      onChange={(e) => handleDurationChange(serviceId, e.target.value)}
                      className='w-24 h-10 text-center font-semibold border-2 border-[#E6E6FF] focus:border-[#9933CC]'
                    />
                    <span className='text-sm text-gray-600'>days (1-14)</span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    Your host will design a {serviceDurations[serviceId] || 7}-day personalized
                    itinerary
                  </p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
