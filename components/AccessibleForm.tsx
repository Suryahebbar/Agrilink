"use client";

import React, { ReactNode, forwardRef } from 'react';
import './accessibility.css';

// ID generator for accessibility
let fieldIdCounter = 0;
let checkboxIdCounter = 0;

interface AccessibleFormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  hint,
  error,
  required = false,
  disabled = false,
  children,
  className = '',
  id
}) => {
  const fieldId = id || `field-${fieldIdCounter++}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label 
          htmlFor={fieldId}
          className={`block text-sm font-medium text-gray-700 mb-2 ${
            required ? 'form-label-required' : ''
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement<{
          id?: string;
          className?: string;
          disabled?: boolean;
          'aria-describedby'?: string;
          'aria-required'?: boolean;
          'aria-invalid'?: string;
        }>, {
          id: fieldId,
          'aria-describedby': describedBy,
          'aria-required': required,
          'aria-invalid': error ? 'true' as const : 'false' as const,
          disabled,
          className: [
            (children as React.ReactElement<{
              id?: string;
              className?: string;
              disabled?: boolean;
              'aria-describedby'?: string;
              'aria-required'?: boolean;
              'aria-invalid'?: string;
            }>).props.className || '',
            error && 'error-border',
            disabled && 'opacity-50 cursor-not-allowed'
          ].filter(Boolean).join(' ')
        })}
      </div>
      
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="mt-1 text-xs error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleInputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      type = 'text',
      value,
      onChange,
      placeholder,
      disabled = false,
      required = false,
      maxLength,
      minLength,
      pattern,
      autoComplete,
      className = '',
      ariaLabel,
      ariaDescribedBy
    },
    ref
  ) => {
    const inputClasses = [
      'w-full',
      'px-3',
      'py-2',
      'border',
      'border-gray-300',
      'rounded-md',
      'shadow-sm',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-[#1A9B9A]',
      'focus:border-transparent',
      'disabled:bg-gray-100',
      'disabled:cursor-not-allowed',
      className
    ].filter(Boolean).join(' ');

    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        autoComplete={autoComplete}
        className={inputClasses}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  id?: string;
  value?: string;
}

export const AccessibleCheckbox: React.FC<AccessibleCheckboxProps> = ({
  checked = false,
  onChange,
  disabled = false,
  required = false,
  label,
  hint,
  error,
  className = '',
  id,
  value
}) => {
  const checkboxId = id || `checkbox-${checkboxIdCounter++}`;
  const hintId = hint ? `${checkboxId}-hint` : undefined;
  const errorId = error ? `${checkboxId}-error` : undefined;
  
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-field ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            required={required}
            value={value}
            className="h-4 w-4 text-[#1A9B9A] focus:ring-[#1A9B9A] border-gray-300 rounded"
            aria-describedby={describedBy}
            aria-invalid={error ? 'true' as const : 'false' as const}
          />
        </div>
        
        {label && (
          <div className="ml-3 text-sm">
            <label 
              htmlFor={checkboxId}
              className={`font-medium text-gray-700 ${
                required ? 'form-label-required' : ''
              }`}
            >
              {label}
            </label>
            
            {hint && !error && (
              <p id={hintId} className="text-gray-500">
                {hint}
              </p>
            )}
            
            {error && (
              <p id={errorId} className="error-text" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface AccessibleSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      required = false,
      placeholder,
      options,
      className = '',
      ariaLabel,
      ariaDescribedBy
    },
    ref
  ) => {
    const selectClasses = [
      'w-full',
      'px-3',
      'py-2',
      'border',
      'border-gray-300',
      'rounded-md',
      'shadow-sm',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-[#1A9B9A]',
      'focus:border-transparent',
      'disabled:bg-gray-100',
      'disabled:cursor-not-allowed',
      className
    ].filter(Boolean).join(' ');

    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        className={selectClasses}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

const accessibleFormExports = {
  AccessibleFormField,
  AccessibleInput,
  AccessibleCheckbox,
  AccessibleSelect
};

export default accessibleFormExports;
