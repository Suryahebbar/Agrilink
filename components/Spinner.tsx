"use client";

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
  label?: string;
}

const Spinner = ({
  size = 'md',
  variant = 'default',
  className = '',
  label
}: SpinnerProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4 border-2';
      case 'md':
        return 'w-6 h-6 border-3';
      case 'lg':
        return 'w-10 h-10 border-4';
      default:
        return 'w-6 h-6 border-3';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'border-t-[#1A9B9A]';
      case 'warning':
        return 'border-t-[#FF9900]';
      case 'error':
        return 'border-t-[#D93025]';
      case 'info':
        return 'border-t-[#2962FF]';
      default:
        return 'border-t-[#1A9B9A]';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${getSizeClasses()} spinner-container border-gray-300 rounded-full animate-spin ${getVariantClasses()}`}
        role="status"
        aria-label={label || 'Loading...'}
      />
      {label && (
        <span className="text-sm text-gray-600">{label}</span>
      )}
    </div>
  );
};

export default Spinner;
