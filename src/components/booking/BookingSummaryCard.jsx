import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, Package, FileText, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import BookingServicesDisplay from './BookingServicesDisplay';


export default function BookingSummaryCard({
  city,
  startDate,
  endDate,
  adults,
  children,
  selectedServices,
  serviceDurations,
  notes,
  language,
  tripDuration,
}) {
  const hasData = startDate || endDate || adults > 0 || selectedServices.length > 0;

  if (!hasData) {
    return (
      <Card className='bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-gray-200'>
        <CardHeader>
          <CardTitle className='text-lg font-bold text-gray-900'>
            {language === 'ar' ? 'ملخص الحجز' : 'Booking Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-gray-500 text-center py-8'>
            {language === 'ar' ? 'املأ النموذج لرؤية الملخص' : 'Fill the form to see summary'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className='bg-gradient-to-br from-purple-50 to-white shadow-lg border-2 border-purple-200 sticky top-24'>
        <CardHeader className='bg-gradient-to-r from-purple-600 to-purple-900 text-white rounded-t-xl'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <Package className='w-5 h-5' />
            {language === 'ar' ? 'ملخص الحجز' : 'Booking Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          {/* City */}
          <div className='flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200'>
            <MapPin className='w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-xs text-gray-500 font-medium'>
                {language === 'ar' ? 'الوجهة' : 'Destination'}
              </p>
              <p className='text-sm font-bold text-gray-900'>{city}</p>
            </div>
          </div>

          {/* Dates */}
          {(startDate || endDate) && (
            <div className='flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200'>
              <Calendar className='w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-xs text-gray-500 font-medium mb-1'>
                  {language === 'ar' ? 'التواريخ' : 'Dates'}
                </p>
                {startDate && (
                  <p className='text-sm text-gray-900'>
                    <span className='font-semibold'>{language === 'ar' ? 'من:' : 'From:'}</span>{' '}
                    {format(new Date(startDate), 'MMM dd, yyyy')}
                  </p>
                )}
                {endDate && (
                  <p className='text-sm text-gray-900'>
                    <span className='font-semibold'>{language === 'ar' ? 'إلى:' : 'To:'}</span>{' '}
                    {format(new Date(endDate), 'MMM dd, yyyy')}
                  </p>
                )}
                {tripDuration > 0 && (
                  <Badge className='mt-2 bg-purple-100 text-purple-800'>
                    <Clock className='w-3 h-3 mr-1' />
                    {tripDuration}{' '}
                    {language === 'ar'
                      ? tripDuration === 1
                        ? 'يوم'
                        : 'أيام'
                      : tripDuration === 1
                        ? 'day'
                        : 'days'}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Guests */}
          {(adults > 0 || children > 0) && (
            <div className='flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200'>
              <Users className='w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-xs text-gray-500 font-medium mb-1'>
                  {language === 'ar' ? 'الضيوف' : 'Guests'}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {adults > 0 && (
                    <Badge variant='outline' className='text-xs'>
                      {adults}{' '}
                      {language === 'ar'
                        ? adults === 1
                          ? 'بالغ'
                          : 'بالغين'
                        : adults === 1
                          ? 'Adult'
                          : 'Adults'}
                    </Badge>
                  )}
                  {children > 0 && (
                    <Badge variant='outline' className='text-xs'>
                      {children}{' '}
                      {language === 'ar'
                        ? children === 1
                          ? 'طفل'
                          : 'أطفال'
                        : children === 1
                          ? 'Child'
                          : 'Children'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Services */}
          {selectedServices.length > 0 && (
            <div className='flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200'>
              <Package className='w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-xs text-gray-500 font-medium mb-2'>
                  {language === 'ar' ? 'الخدمات' : 'Services'}
                </p>
                <BookingServicesDisplay
                  serviceIds={selectedServices}
                  language={language}
                  showDuration
                  serviceDurations={serviceDurations}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className='flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200'>
              <FileText className='w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-xs text-gray-500 font-medium mb-1'>
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </p>
                <p className='text-sm text-gray-700 line-clamp-3'>{notes}</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className='p-3 bg-purple-50 rounded-lg border border-purple-200'>
            <p className='text-xs text-purple-900'>
              {language === 'ar'
                ? '✨ سيتم إرسال طلبك إلى المضيفين المعتمدين وسيتواصلون معك بالعروض قريباً'
                : '✨ Your request will be sent to verified hosts who will contact you with offers soon'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
