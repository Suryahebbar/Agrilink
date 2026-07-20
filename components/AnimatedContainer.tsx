"use client";

import React, { ReactNode, useEffect, useState } from 'react';

interface AnimatedContainerProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'scale-in';
  duration?: 'fast' | 'medium' | 'slow';
  delay?: number;
  trigger?: 'mount' | 'hover' | 'visible';
  className?: string;
  onAnimationComplete?: () => void;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fade-in',
  duration = 'medium',
  delay = 0,
  trigger = 'mount',
  className = '',
  onAnimationComplete
}) => {
  const [isVisible, setIsVisible] = useState(trigger === 'mount');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (trigger === 'mount') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        onAnimationComplete?.();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay, trigger, onAnimationComplete]);

  useEffect(() => {
    if (trigger === 'visible') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                setIsVisible(true);
                onAnimationComplete?.();
              }, delay);
            }
          });
        },
        { threshold: 0.1 }
      );

      const element = document.getElementById('animated-container');
      if (element) {
        observer.observe(element);
      }

      return () => observer.disconnect();
    }
  }, [delay, trigger, onAnimationComplete]);

  const getAnimationClasses = () => {
    const shouldAnimate = trigger === 'hover' ? isHovered : isVisible;
    
    if (!shouldAnimate) return 'opacity-0';
    
    const animationMap = {
      'fade-in': 'animate-fade-in',
      'slide-up': 'animate-slide-up',
      'slide-down': 'animate-slide-down',
      'scale-in': 'animate-scale-in'
    };

    const durationMap = {
      'fast': 'animate-duration-fast',
      'medium': 'animate-duration-medium',
      'slow': 'animate-duration-slow'
    };

    return [
      animationMap[animation],
      durationMap[duration],
      'opacity-100'
    ].join(' ');
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsHovered(false);
    }
  };

  return (
    <div
      id="animated-container"
      className={`${getAnimationClasses()} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer;
