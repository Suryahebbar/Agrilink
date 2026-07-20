"use client";

import React from 'react';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const CircularProgress = ({
  value,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showLabel = true,
  label,
  className = ''
}: CircularProgressProps) => {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  const getStrokeColor = () => {
    switch (variant) {
      case 'success':
        return '#1A9B9A';
      case 'warning':
        return '#FF9900';
      case 'error':
        return '#D93025';
      case 'info':
        return '#2962FF';
      default:
        return '#1A9B9A';
    }
  };

  const displayLabel = label || `${Math.round(normalizedValue)}%`;
  const ariaValue = Math.round(normalizedValue);

  const svgProps = {
    width: size,
    height: size,
    className: "transform -rotate-90",
    role: "progressbar" as const,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": label || `Progress: ${ariaValue}%`,
    "aria-valuenow": ariaValue
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="relative">
        <svg {...svgProps}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-900">
              {displayLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;
