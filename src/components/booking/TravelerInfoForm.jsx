import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/components/i18n/LanguageContext';

export default function TravelerInfoForm({
  travelerInfo,
  onTravelerInfoChange,
  errors,
  isLoggedIn,
}) {
  const { t } = useTranslation();

  // Runtime Guard (Unified Safety Layer)
  if (typeof React.createElement !== 'function') {
    console.error('⚠️ React runtime invalid in this module. Booking component stopped.');
    return <div className='text-red-500 p-3 text-sm'>Component temporarily unavailable.</div>;
  }

  const handleChange = (field, value) => {
    if (typeof onTravelerInfoChange === 'function') {
      onTravelerInfoChange(field, value);
    }
  };

  const info = travelerInfo || {};
  const formErrors = errors || {};

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold'>{t('bookingForm.your_information')}</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Input
            type='text'
            placeholder={t('bookingForm.full_name')}
            value={info.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            disabled={isLoggedIn}
            className={formErrors.fullName ? 'border-red-500' : ''}
          />
          {formErrors.fullName && (
            <p className='text-red-500 text-sm mt-1'>{formErrors.fullName}</p>
          )}
        </div>
        <div>
          <Input
            type='email'
            placeholder={t('bookingForm.email')}
            value={info.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isLoggedIn}
            className={formErrors.email ? 'border-red-500' : ''}
          />
          {formErrors.email && <p className='text-red-500 text-sm mt-1'>{formErrors.email}</p>}
        </div>
      </div>

      <div>
        <Textarea
          placeholder={t('bookingForm.notes_placeholder')}
          value={info.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
