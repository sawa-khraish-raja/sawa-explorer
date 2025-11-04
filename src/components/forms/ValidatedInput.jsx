import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SAWA_VALIDATION } from '@/components/validation/core';
import { cn } from '@/lib/utils';

/**
 * Validated Input Component
 * Auto-validates and sanitizes user input
 */
export default function ValidatedInput({
  label,
  type = 'text',
  value,
  onChange,
  validator,
  validatorName,
  required = false,
  placeholder,
  className,
  multiline = false,
  rows = 4,
  disabled = false,
  autoSanitize = true,
  showValidation = true,
  ...props
}) {
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Get validator function
  const validatorFn = validator || (validatorName && SAWA_VALIDATION[validatorName]);

  useEffect(() => {
    if (!touched || !value) {
      setError(null);
      setIsValid(false);
      return;
    }

    if (validatorFn) {
      const valid = validatorFn(value);
      setIsValid(valid);

      if (!valid) {
        setError(getErrorMessage(validatorName || 'input'));
      } else {
        setError(null);
      }
    }
  }, [value, touched, validatorFn, validatorName]);

  const handleChange = (e) => {
    let val = e.target.value;

    // Auto-sanitize if enabled
    if (autoSanitize && typeof val === 'string') {
      val = SAWA_VALIDATION.textSafe(val);
    }

    onChange(val);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const getErrorMessage = (type) => {
    const messages = {
      email: 'Please enter a valid email address',
      name: 'Name must be 2-40 characters (letters only)',
      message: 'Message cannot be empty or too long',
      phone: 'Please enter a valid phone number',
      url: 'Please enter a valid URL',
      price: 'Please enter a valid price',
      date: 'Please enter a valid date',
      number: 'Please enter a valid number',
      input: 'Invalid input',
    };
    return messages[type] || 'Invalid input';
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className='flex items-center gap-1'>
          {label}
          {required && <span className='text-red-500'>*</span>}
        </Label>
      )}

      <div className='relative'>
        <InputComponent
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={multiline ? rows : undefined}
          className={cn(
            'transition-all',
            error && touched && 'border-red-500 focus:border-red-500',
            isValid && touched && 'border-green-500 focus:border-green-500'
          )}
          {...props}
        />

        {/* Validation icon */}
        {showValidation && touched && value && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
            {isValid ? (
              <CheckCircle2 className='w-5 h-5 text-green-500' />
            ) : error ? (
              <AlertCircle className='w-5 h-5 text-red-500' />
            ) : null}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && touched && (
        <p className='text-sm text-red-500 flex items-center gap-1'>
          <AlertCircle className='w-4 h-4' />
          {error}
        </p>
      )}
    </div>
  );
}
