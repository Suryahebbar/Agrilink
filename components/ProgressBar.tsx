"use client";

import React from 'react';

interface ProgressBarProps {
  value?: number; // 0-100 for determinate
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
  indeterminate?: boolean;
}

const ProgressBar = ({
  value = 0,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  className = '',
  indeterminate = false
}: ProgressBarProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'md':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'progress-fill-success';
      case 'warning':
        return 'progress-fill-warning';
      case 'error':
        return 'progress-fill-error';
      case 'info':
        return 'progress-fill-info';
      default:
        return 'progress-fill';
    }
  };

  const getWidthClass = () => {
    if (indeterminate) return 'progress-indeterminate';
    const clampedValue = Math.min(100, Math.max(0, value));
    const roundedValue = Math.round(clampedValue / 10) * 10; // Round to nearest 10
    return `progress-width-${roundedValue}`;
  };

  const displayLabel = label || `${Math.round(value)}%`;
  const clampedValue = Math.min(100, Math.max(0, value));
  const ariaValue = Math.round(clampedValue);

  interface ProgressProps {
  className: string;
  role: "progressbar";
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-label": string;
  "aria-valuenow"?: number;
}

  const progressProps: ProgressProps = {
    className: `h-full rounded-full ${getVariantClasses()} ${getWidthClass()}`,
    role: "progressbar" as const,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": label || `Progress: ${ariaValue}%`
  };

  if (!indeterminate) {
    progressProps["aria-valuenow"] = ariaValue;
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>{displayLabel}</span>
          {!label && <span>{Math.round(value)}%</span>}
        </div>
      )}
      
      <div className={`w-full ${getSizeClasses()} progress-container overflow-hidden rounded-full`}>
        <div {...progressProps} />
      </div>
    </div>
  );
};

export default ProgressBar;
