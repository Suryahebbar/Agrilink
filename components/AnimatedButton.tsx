"use client";

import React, { ReactNode } from 'react';
import './animations.css';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  animation?: 'lift' | 'scale' | 'fade' | 'none';
  className?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  animation = 'lift',
  className = ''
}) => {
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
      default:
        return 'bg-[#1A9B9A] text-white hover:bg-[#178A89] focus:ring-[#1A9B9A]';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs sm:text-sm min-h-[32px]';
      case 'md':
        return 'px-4 py-2 text-sm sm:text-base min-h-[40px]';
      case 'lg':
        return 'px-6 py-3 text-base sm:text-lg min-h-[48px]';
      default:
        return 'px-4 py-2 text-sm sm:text-base min-h-[40px]';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'lift':
        return 'hover-lift';
      case 'scale':
        return 'hover-scale';
      case 'fade':
        return 'hover-fade';
      case 'none':
        return '';
      default:
        return 'hover-lift';
    }
  };

  const buttonClasses = [
    'inline-flex items-center justify-center',
    'font-medium',
    'rounded-md',
    'transition-all',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    getVariantClasses(),
    getSizeClasses(),
    getAnimationClasses(),
    fullWidth && 'w-full',
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          <span className="flex-shrink-0">{icon}</span>
          <span className="ml-2">{children}</span>
        </>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          <span className="mr-2">{children}</span>
          <span className="flex-shrink-0">{icon}</span>
        </>
      );
    }

    return children;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      type="button"
    >
      {renderContent()}
    </button>
  );
};

export default AnimatedButton;
