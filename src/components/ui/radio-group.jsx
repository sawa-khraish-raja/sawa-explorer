import * as React from 'react';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef(
  ({ className, children, value, onValueChange, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('grid gap-2', className)} role='radiogroup' {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              checked: child.props.value === value,
              onChange: () => onValueChange?.(child.props.value),
            });
          }
          return child;
        })}
      </div>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef(
  ({ className, value, checked, onChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type='button'
        role='radio'
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {checked && (
          <div className='flex items-center justify-center'>
            <div className='h-2.5 w-2.5 rounded-full bg-current' />
          </div>
        )}
      </button>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
