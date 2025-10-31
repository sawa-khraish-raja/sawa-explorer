import React from 'react';
import { Users, Baby, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GuestSelector({ adults, children, onAdultsChange, onChildrenChange, language }) {
  return (
    <div className="space-y-4">
      {/* Adults */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-gray-900">
              {language === 'ar' ? 'البالغون' : 'Adults'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {language === 'ar' ? 'العمر 13+' : 'Age 13+'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onAdultsChange(Math.max(1, adults - 1))}
            disabled={adults <= 1}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2"
          >
            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <span className="text-base sm:text-lg font-bold text-gray-900 min-w-[28px] sm:min-w-[32px] text-center">
            {adults}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onAdultsChange(Math.min(20, adults + 1))}
            disabled={adults >= 20}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Children */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-gray-900">
              {language === 'ar' ? 'الأطفال' : 'Children'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {language === 'ar' ? 'العمر 2-12' : 'Age 2-12'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onChildrenChange(Math.max(0, children - 1))}
            disabled={children <= 0}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2"
          >
            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <span className="text-base sm:text-lg font-bold text-gray-900 min-w-[28px] sm:min-w-[32px] text-center">
            {children}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onChildrenChange(Math.min(10, children + 1))}
            disabled={children >= 10}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl py-2.5 sm:py-3 px-4">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <span className="text-sm sm:text-base font-semibold text-gray-900">
            {language === 'ar' ? 'إجمالي الضيوف:' : 'Total Guests:'} {adults + children}
          </span>
        </div>
      </div>
    </div>
  );
}