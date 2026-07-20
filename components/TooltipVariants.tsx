"use client";

import React from 'react';
import Tooltip from './Tooltip';

// Success Tooltip
export const SuccessTooltip = ({ 
  children, 
  content, 
  ...props 
}: Omit<Parameters<typeof Tooltip>[0], 'variant'>) => (
  <Tooltip {...props} variant="success" content={content}>
    {children}
  </Tooltip>
);

// Warning Tooltip
export const WarningTooltip = ({ 
  children, 
  content, 
  ...props 
}: Omit<Parameters<typeof Tooltip>[0], 'variant'>) => (
  <Tooltip {...props} variant="warning" content={content}>
    {children}
  </Tooltip>
);

// Error Tooltip
export const ErrorTooltip = ({ 
  children, 
  content, 
  ...props 
}: Omit<Parameters<typeof Tooltip>[0], 'variant'>) => (
  <Tooltip {...props} variant="error" content={content}>
    {children}
  </Tooltip>
);

// Dashboard Metric Tooltip (for analytics)
export const MetricTooltip = ({ 
  children, 
  content, 
  maxWidth = 'max-w-xs',
  ...props 
}: Omit<Parameters<typeof Tooltip>[0], 'variant' | 'className'> & {
  maxWidth?: string;
}) => (
  <Tooltip 
    {...props} 
    variant="default" 
    content={content}
    className={`${maxWidth}`}
  >
    {children}
  </Tooltip>
);

// Icon Tooltip (for icons and small elements)
export const IconTooltip = ({ 
  children, 
  content,
  ...props 
}: Parameters<typeof Tooltip>[0]) => (
  <Tooltip 
    {...props}
    content={content}
    showArrow={true}
  >
    {children}
  </Tooltip>
);

// Form Field Tooltip (for form inputs)
export const FormTooltip = ({ 
  children, 
  content,
  ...props 
}: Parameters<typeof Tooltip>[0]) => (
  <Tooltip 
    {...props}
    content={content}
    delay={300}
  >
    {children}
  </Tooltip>
);

const TooltipComponents = {
  Tooltip,
  SuccessTooltip,
  WarningTooltip,
  ErrorTooltip,
  MetricTooltip,
  IconTooltip,
  FormTooltip
};

export default TooltipComponents;
