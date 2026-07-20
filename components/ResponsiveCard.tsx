"use client";

import React, { ReactNode } from 'react';

interface ResponsiveCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
  padding?: {
    default?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  footer,
  className = '',
  padding = { default: 'p-4', sm: 'p-6' },
  hover = false,
  clickable = false,
  onClick
}) => {
  const paddingClasses = [
    padding.default,
    padding.sm && `sm:${padding.sm}`,
    padding.md && `md:${padding.md}`,
    padding.lg && `lg:${padding.lg}`
  ].filter(Boolean).join(' ');

  const cardClasses = [
    'bg-white rounded-lg border border-gray-200 shadow-sm',
    hover && 'hover:shadow-md hover:border-gray-300 transition-shadow duration-200',
    clickable && 'cursor-pointer',
    paddingClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={clickable ? onClick : undefined}>
      {/* Header */}
      {(title || icon) && (
        <div className="flex items-start space-x-3 mb-4">
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
      <div className="text-gray-700">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ResponsiveCard;
