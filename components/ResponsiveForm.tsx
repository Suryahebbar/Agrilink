"use client";

import React, { ReactNode } from 'react';

interface ResponsiveFormProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  layout?: 'stacked' | 'inline' | 'grid';
  gridCols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  onSubmit,
  className = '',
  layout = 'stacked',
  gridCols = { default: 1, sm: 2 }
}) => {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'stacked':
        return 'space-y-4';
      case 'inline':
        return 'flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0 space-y-4';
      case 'grid':
        const gridClasses = [
          gridCols.default && `grid-cols-${gridCols.default}`,
          gridCols.sm && `sm:grid-cols-${gridCols.sm}`,
          gridCols.md && `md:grid-cols-${gridCols.md}`,
          gridCols.lg && `lg:grid-cols-${gridCols.lg}`
        ].filter(Boolean).join(' ');
        return `grid ${gridClasses} gap-4`;
      default:
        return 'space-y-4';
    }
  };

  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      <div className={getLayoutClasses()}>
        {children}
      </div>
    </form>
  );
};

interface ResponsiveFormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const ResponsiveFormField: React.FC<ResponsiveFormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  children,
  className = ''
}) => {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default ResponsiveForm;
