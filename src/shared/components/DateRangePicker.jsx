import { format, addDays, startOfWeek } from 'date-fns';
import { useState, useEffect } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/utils';

const presets = [
  {
    label: 'Next 7 days',
    getRange: () => ({ from: new Date(), to: addDays(new Date(), 6) }),
  },
  {
    label: 'Next 14 days',
    getRange: () => ({ from: new Date(), to: addDays(new Date(), 13) }),
  },
  {
    label: 'This weekend',
    getRange: () => {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 5 });
      return { from: start, to: addDays(start, 2) };
    },
  },
  {
    label: 'Next weekend',
    getRange: () => {
      const today = new Date();
      const nextWeek = addDays(today, 7);
      const start = startOfWeek(nextWeek, { weekStartsOn: 5 });
      return { from: start, to: addDays(start, 2) };
    },
  },
];

export default function DateRangePicker({
  className,
  date,
  onDateChange,
  showFlexDateToggle = false,
  isFlexDate,
  onFlexDateChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(date);
  const [activeInput, setActiveInput] = useState('from');

  // When the popover opens, sync the draft state with the external prop
  useEffect(() => {
    if (isOpen) {
      setDraftDate(date);
    }
  }, [isOpen, date]);

  //  Lock body scroll when picker is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelect = (range) => {
    if (range?.from && !range.to) {
      setDraftDate({ from: range.from, to: undefined });
      setActiveInput('to');
    } else if (range?.from && range.to) {
      if (range.from > range.to) {
        setDraftDate({ from: range.from, to: undefined });
        setActiveInput('to');
      } else {
        setDraftDate(range);
      }
    } else {
      setDraftDate(range);
    }
  };

  const handleApply = () => {
    onDateChange(draftDate);
    setIsOpen(false);
  };

  const handlePreset = (preset) => {
    setDraftDate(preset.getRange());
  };

  const handleClear = () => {
    onDateChange({ from: null, to: null });
    setDraftDate({ from: null, to: null });
    setIsOpen(false);
  };

  const currentDisplayDate = isOpen ? draftDate : date;

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className='flex items-center justify-center border rounded-lg h-14 md:h-12'>
            <button
              onClick={() => setActiveInput('from')}
              className={cn(
                'flex-1 text-left px-4 py-2 h-full w-full',
                activeInput === 'from' && isOpen && 'bg-muted'
              )}
            >
              <div className='text-xs text-muted-foreground'>Start date</div>
              <div className='font-semibold text-sm'>
                {currentDisplayDate?.from ? (
                  format(currentDisplayDate.from, 'LLL dd, y')
                ) : (
                  <span className='font-normal text-muted-foreground'>&nbsp;</span>
                )}
              </div>
            </button>
            <div className='h-full border-l' />
            <button
              onClick={() => setActiveInput('to')}
              className={cn(
                'flex-1 text-left px-4 py-2 h-full w-full',
                activeInput === 'to' && isOpen && 'bg-muted'
              )}
            >
              <div className='text-xs text-muted-foreground'>End date</div>
              <div className='font-semibold text-sm'>
                {currentDisplayDate?.to ? (
                  format(currentDisplayDate.to, 'LLL dd, y')
                ) : (
                  <span className='font-normal text-muted-foreground'>&nbsp;</span>
                )}
              </div>
            </button>
          </div>
        </PopoverTrigger>

        {/*  Mobile: Fixed full-screen overlay */}
        <PopoverContent
          className={cn(
            'p-0 bg-white',
            // Mobile: Fixed full-screen
            'md:w-auto md:relative',
            'fixed inset-0 md:inset-auto',
            'z-[100] md:z-50',
            'flex flex-col',
            'max-h-screen md:max-h-[600px]'
          )}
          align='start'
          sideOffset={5}
        >
          {/*  Mobile Header */}
          <div className='md:hidden sticky top-0 bg-white border-b z-10 p-4 flex items-center justify-between'>
            <h3 className='font-semibold text-lg'>Select Dates</h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsOpen(false)}
              className='text-gray-600'
            >
              Close
            </Button>
          </div>

          {/*  Scrollable Content */}
          <div className='flex-1 overflow-y-auto'>
            <div className='flex flex-col md:flex-row'>
              {/* Left Panel - Quick Select */}
              <div className='p-4 border-b md:border-b-0 md:border-r flex flex-col gap-4 bg-gray-50 md:bg-white'>
                <p className='font-semibold text-sm'>Quick Select</p>
                <div className='grid grid-cols-2 md:grid-cols-1 gap-2'>
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant='outline'
                      size='sm'
                      onClick={() => handlePreset(preset)}
                      className='justify-start'
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                {showFlexDateToggle && onFlexDateChange && (
                  <div className='flex items-center space-x-2 pt-4 border-t'>
                    <Switch
                      id='flex-date-toggle'
                      checked={isFlexDate}
                      onCheckedChange={onFlexDateChange}
                    />
                    <Label htmlFor='flex-date-toggle' className='text-sm'>
                      Flexible dates (±3 days)
                    </Label>
                  </div>
                )}
              </div>

              {/* Right Panel - Calendar */}
              <div className='flex-1'>
                <div className='p-3 border-b text-center text-sm font-semibold bg-gray-50 md:bg-white sticky top-0 md:static z-10'>
                  {draftDate?.from ? (
                    <>
                      {format(draftDate.from, 'PPP')}
                      {draftDate.to && ` - ${format(draftDate.to, 'PPP')}`}
                    </>
                  ) : (
                    'Select your dates'
                  )}
                </div>

                {/*  Desktop: 2 months */}
                <Calendar
                  initialFocus
                  mode='range'
                  defaultMonth={draftDate?.from}
                  selected={draftDate}
                  onSelect={handleSelect}
                  numberOfMonths={2}
                  disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                  className='hidden md:block'
                />

                {/*  Mobile: 1 month, optimized size */}
                <Calendar
                  initialFocus
                  mode='range'
                  defaultMonth={draftDate?.from}
                  selected={draftDate}
                  onSelect={handleSelect}
                  numberOfMonths={1}
                  disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                  className='md:hidden p-3'
                />
              </div>
            </div>
          </div>

          {/*  Sticky Bottom Actions */}
          <div className='sticky bottom-0 bg-white border-t p-3 flex justify-end gap-2 shadow-lg md:shadow-none z-10'>
            <Button variant='ghost' onClick={handleClear}>
              Clear
            </Button>
            <Button
              onClick={handleApply}
              className='bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white'
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
