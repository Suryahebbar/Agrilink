"use client";

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showArrow?: boolean;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

const Tooltip = ({
  children,
  content,
  position = 'top',
  variant = 'default',
  showArrow = true,
  delay = 0,
  className = '',
  disabled = false
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'absolute bottom-full mb-2 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'absolute top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'absolute right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'absolute left-full ml-2 top-1/2 -translate-y-1/2';
      default:
        return 'absolute bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'absolute top-full left-1/2 -translate-x-1/2 translate-y-1 w-0 h-0 border-x-8 border-x-transparent border-t-8';
      case 'bottom':
        return 'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-x-8 border-x-transparent border-b-8';
      case 'left':
        return 'absolute left-full top-1/2 -translate-y-1/2 -translate-x-1 w-0 h-0 border-y-8 border-y-transparent border-r-8';
      case 'right':
        return 'absolute right-full top-1/2 -translate-y-1/2 translate-x-1 w-0 h-0 border-y-8 border-y-transparent border-l-8';
      default:
        return 'absolute top-full left-1/2 -translate-x-1/2 translate-y-1 w-0 h-0 border-x-8 border-x-transparent border-t-8';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-[#1A9B9A] text-white';
      case 'warning':
        return 'bg-[#FF9900] text-white';
      case 'error':
        return 'bg-[#D93025] text-white';
      default:
        return 'bg-[#232F3E] text-white';
    }
  };

  const getArrowColor = () => {
    switch (variant) {
      case 'success':
        return 'border-[#1A9B9A]';
      case 'warning':
        return 'border-[#FF9900]';
      case 'error':
        return 'border-[#D93025]';
      default:
        return 'border-[#232F3E]';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="cursor-help"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`${getPositionClasses()} ${getVariantClasses()} px-3 py-1.5 rounded text-xs shadow tooltip-container animate-tooltip-in z-50 whitespace-nowrap`}
          role="tooltip"
        >
          {content}
          
          {/* Arrow */}
          {showArrow && (
            <div className={`${getArrowClasses()} ${getArrowColor()}`} />
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
