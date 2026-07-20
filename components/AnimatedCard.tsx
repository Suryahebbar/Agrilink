"use client";

import React, { ReactNode } from 'react';
import './animations.css';

interface AnimatedCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: ReactNode;
  className?: string;
  animation?: 'fade-in' | 'slide-up' | 'scale-in';
  hover?: 'lift' | 'scale' | 'none';
  delay?: number;
  clickable?: boolean;
  onClick?: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  footer,
  className = '',
  animation = 'fade-in',
  hover = 'lift',
  delay = 0,
  clickable = false,
  onClick
}) => {
  const getAnimationClasses = () => {
    const animationMap = {
      'fade-in': 'animate-fade-in',
      'slide-up': 'animate-slide-up',
      'scale-in': 'animate-scale-in'
    };

    return animationMap[animation] || 'animate-fade-in';
  };

  const getHoverClasses = () => {
    switch (hover) {
      case 'lift':
        return 'hover-lift';
      case 'scale':
        return 'hover-scale';
      case 'none':
        return '';
      default:
        return 'hover-lift';
    }
  };

  const getDelayClass = () => {
    if (delay <= 0) return '';
    const delayMs = Math.min(Math.round(delay / 50) * 50, 1000);
    return `animation-delay-${delayMs}`;
  };

  const cardClasses = [
    'bg-white rounded-lg border border-gray-200 shadow-sm',
    getAnimationClasses(),
    getHoverClasses(),
    clickable && 'cursor-pointer',
    'transition-all duration-200',
    getDelayClass(),
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={clickable ? onClick : undefined}
    >
      {/* Header */}
      {(title || icon) && (
        <div className="flex items-start space-x-3 p-6 pb-4">
          {icon && (
            <div className="flex-shrink-0 text-gray-400">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-4 text-gray-700">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default AnimatedCard;
