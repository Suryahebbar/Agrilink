"use client";

import React from 'react';
import './animations.css';

interface AnimatedLoadingProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
  type = 'spinner',
  size = 'md',
  className = '',
  text
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  const renderSpinner = () => (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-[#1A9B9A] ${getSizeClasses()} ${className}`}></div>
  );

  const renderSkeleton = () => {
    const skeletonHeight = {
      sm: 'h-4',
      md: 'h-6',
      lg: 'h-8'
    };

    return (
      <div className={`loading-skeleton rounded ${skeletonHeight[size]} ${className}`}></div>
    );
  };

  const renderDots = () => {
    const dotSize = {
      sm: 'w-1 h-1',
      md: 'w-2 h-2',
      lg: 'w-3 h-3'
    };

    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${dotSize[size]} bg-[#1A9B9A] rounded-full animate-bounce-gentle`}></div>
        <div className={`${dotSize[size]} bg-[#1A9B9A] rounded-full animate-bounce-gentle animation-delay-100`}></div>
        <div className={`${dotSize[size]} bg-[#1A9B9A] rounded-full animate-bounce-gentle animation-delay-200`}></div>
      </div>
    );
  };

  const renderProgress = () => {
    const progressHeight = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };

    return (
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${progressHeight[size]} ${className}`}>
        <div className="progress-indeterminate h-full bg-[#1A9B9A] origin-left"></div>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'skeleton':
        return renderSkeleton();
      case 'dots':
        return renderDots();
      case 'progress':
        return renderProgress();
      default:
        return renderSpinner();
    }
  };

  if (text) {
    return (
      <div className="flex items-center space-x-2">
        {renderContent()}
        <span className="text-sm text-gray-600">{text}</span>
      </div>
    );
  }

  return renderContent();
};

export default AnimatedLoading;
