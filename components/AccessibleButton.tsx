"use client";

import React, { ReactNode, forwardRef } from 'react';
import './accessibility.css';

interface AccessibleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      onClick,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      ariaLabel,
      ariaDescribedBy,
      ariaPressed,
      ariaExpanded,
      ariaControls,
      type = 'button',
      className = ''
    },
    ref
  ) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'bg-[#1A9B9A] text-white hover:bg-[#178A89] focus:ring-[#1A9B9A]';
        case 'secondary':
          return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
        case 'outline':
          return 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-[#1A9B9A]';
        case 'ghost':
          return 'text-gray-700 hover:bg-gray-100 focus:ring-[#1A9B9A]';
        case 'icon':
          return 'text-gray-700 hover:bg-gray-100 focus:ring-[#1A9B9A] p-2';
        default:
          return 'bg-[#1A9B9A] text-white hover:bg-[#178A89] focus:ring-[#1A9B9A]';
      }
    };

    const getSizeClasses = () => {
      if (variant === 'icon') {
        switch (size) {
          case 'sm':
            return 'w-8 h-8 text-sm';
          case 'md':
            return 'w-10 h-10 text-base';
          case 'lg':
            return 'w-12 h-12 text-lg';
          default:
            return 'w-10 h-10 text-base';
        }
      }

      switch (size) {
        case 'sm':
          return 'px-3 py-1.5 text-xs min-h-[36px]';
        case 'md':
          return 'px-4 py-2 text-sm min-h-[44px]';
        case 'lg':
          return 'px-6 py-3 text-base min-h-[48px]';
        default:
          return 'px-4 py-2 text-sm min-h-[44px]';
      }
    };

    const buttonClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-md',
      'transition-colors',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      getVariantClasses(),
      getSizeClasses(),
      fullWidth && 'w-full',
      variant === 'icon' && 'accessible-icon-button',
      variant !== 'icon' && 'accessible-button',
      className
    ].filter(Boolean).join(' ');

    const renderContent = () => {
      if (loading) {
        return (
          <>
            <div className="loading-spinner" aria-hidden="true"></div>
            <span className="sr-only">Loading</span>
            {children}
          </>
        );
      }

      return children;
    };

    const ariaAttributes: Record<string, string | boolean | undefined> = {};
    
    if (ariaLabel) ariaAttributes['aria-label'] = ariaLabel;
    if (ariaDescribedBy) ariaAttributes['aria-describedby'] = ariaDescribedBy;
    if (ariaPressed !== undefined) ariaAttributes['aria-pressed'] = ariaPressed;
    if (ariaExpanded !== undefined) ariaAttributes['aria-expanded'] = ariaExpanded;
    if (ariaControls) ariaAttributes['aria-controls'] = ariaControls;
    if (loading) ariaAttributes['aria-busy'] = 'true';

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || loading}
        className={buttonClasses}
        type={type}
        {...ariaAttributes}
      >
        {renderContent()}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
