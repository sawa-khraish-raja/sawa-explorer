import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export const TooltipProvider = ({ children }) => children;

export const Tooltip = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        isVisible, 
        setIsVisible 
      });
    }
    return child;
  });
};

export const TooltipTrigger = ({ children, isVisible, setIsVisible, asChild, ...props }) => {
  const childElement = asChild ? children : <div>{children}</div>;
  
  return React.cloneElement(childElement, {
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => setIsVisible(false),
    onFocus: () => setIsVisible(true),
    onBlur: () => setIsVisible(false),
    ...props
  });
};

export const TooltipContent = ({ children, isVisible, side = 'top', className, ...props }) => {
  if (!isVisible) return null;
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  return (
    <div
      className={cn(
        'absolute z-50 px-3 py-1.5 text-xs text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none',
        'animate-in fade-in-0 zoom-in-95',
        positionClasses[side],
        className
      )}
      {...props}
    >
      {children}
      <div 
        className={cn(
          'absolute w-2 h-2 bg-gray-900 transform rotate-45',
          side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
          side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
          side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
          side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
        )}
      />
    </div>
  );
};