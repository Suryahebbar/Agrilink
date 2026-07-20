"use client";

import React from 'react';

interface ResponsiveTypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  children: React.ReactNode;
  className?: string;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  truncate?: boolean;
}

const ResponsiveTypography: React.FC<ResponsiveTypographyProps> = ({
  variant = 'body',
  children,
  className = '',
  weight = 'normal',
  color = 'text-gray-900',
  truncate = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'h1':
        return 'text-xl sm:text-2xl lg:text-3xl font-bold';
      case 'h2':
        return 'text-lg sm:text-xl lg:text-2xl font-bold';
      case 'h3':
        return 'text-base sm:text-lg lg:text-xl font-semibold';
      case 'h4':
        return 'text-sm sm:text-base lg:text-lg font-semibold';
      case 'h5':
        return 'text-sm sm:text-base font-medium';
      case 'h6':
        return 'text-xs sm:text-sm font-medium';
      case 'body':
        return 'text-sm sm:text-base';
      case 'caption':
        return 'text-xs sm:text-sm';
      default:
        return 'text-sm sm:text-base';
    }
  };

  const getWeightClasses = () => {
    switch (weight) {
      case 'light':
        return 'font-light';
      case 'normal':
        return 'font-normal';
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      default:
        return 'font-normal';
    }
  };

  const classes = [
    getVariantClasses(),
    getWeightClasses(),
    color,
    truncate && 'truncate',
    className
  ].filter(Boolean).join(' ');

  const Tag = variant.startsWith('h') ? variant : 'p';

  return <Tag className={classes}>{children}</Tag>;
};

export default ResponsiveTypography;
