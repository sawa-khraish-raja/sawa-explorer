import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SimpleDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  required = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const scrollPositionRef = useRef(0);
  const buttonRef = useRef(null);

  //  FIX #1: Prevent scroll jump on date select
  const handleDateSelect = (date) => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;

    // Update date
    onChange(date ? format(date, 'yyyy-MM-dd') : '');

    // Close popover
    setOpen(false);

    // Restore scroll position after React updates
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant',
      });

      // Remove focus to prevent auto-scroll
      if (buttonRef.current) {
        buttonRef.current.blur();
      }
    });
  };

  //  Prevent scroll on popover open/close
  useEffect(() => {
    if (!open && scrollPositionRef.current > 0) {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant',
      });
    }
  }, [open]);

  return (
    <div className='space-y-2'>
      {label && (
        <label className='text-sm font-semibold text-gray-700'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant='outline'
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-12 border-2 hover:border-purple-300 transition-colors',
              !value && 'text-gray-500'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4 flex-shrink-0' />
            {value ? format(new Date(value), 'PPP') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className='w-auto p-0'
          align='start'
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode='single'
            selected={value ? new Date(value) : undefined}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < new Date(minDate)) return true;
              if (maxDate && date > new Date(maxDate)) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
