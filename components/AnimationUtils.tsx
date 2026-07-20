"use client";

import React, { ReactNode } from 'react';

// Animation Hook for managing animation states
export const useAnimation = (
  trigger: 'mount' | 'hover' | 'visible' = 'mount',
  duration: number = 180
) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(trigger === 'mount');

  React.useEffect(() => {
    if (trigger === 'mount') {
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), duration);
  };

  return {
    isAnimating,
    isVisible,
    startAnimation,
    setIsVisible
  };
};

// Stagger Animation Hook
export const useStaggerAnimation = (
  itemCount: number,
  staggerDelay: number = 100
) => {
  const [visibleItems, setVisibleItems] = React.useState<number[]>([]);

  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, i * staggerDelay);
      timers.push(timer);
    }

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [itemCount, staggerDelay]);

  return visibleItems;
};

// Animation Presets
export const ANIMATION_PRESETS = {
  // Fast animations (120ms)
  FAST: {
    duration: 'animate-duration-fast',
    className: 'transition-all'
  },
  
  // Medium animations (180ms) - Default
  MEDIUM: {
    duration: 'animate-duration-medium',
    className: 'transition-all'
  },
  
  // Slow animations (250ms)
  SLOW: {
    duration: 'animate-duration-slow',
    className: 'transition-all'
  }
};

// Animation Variants
export const ANIMATION_VARIANTS = {
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  SLIDE_UP: 'animate-slide-up',
  SLIDE_DOWN: 'animate-slide-down',
  SLIDE_LEFT: 'animate-slide-left',
  SLIDE_RIGHT: 'animate-slide-right',
  SCALE_IN: 'animate-scale-in',
  SCALE_OUT: 'animate-scale-out',
  SPIN: 'animate-spin',
  PULSE: 'animate-pulse-gentle',
  BOUNCE: 'animate-bounce-gentle',
  SHAKE: 'animate-shake-gentle'
};

// Hover Effects
export const HOVER_EFFECTS = {
  LIFT: 'hover-lift',
  SCALE: 'hover-scale',
  FADE: 'hover-fade'
};

// Component for staggered animations
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  animation?: string;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 100,
  animation = 'animate-fade-in',
  className = ''
}) => {
  const visibleItems = useStaggerAnimation(React.Children.count(children), staggerDelay);

  const getDelayClass = (index: number, baseDelay: number) => {
    const delayMs = Math.min(index * baseDelay, 1000);
    const roundedDelay = Math.round(delayMs / 50) * 50;
    return `animation-delay-${roundedDelay}`;
  };

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={visibleItems.includes(index) ? `${animation} opacity-100 ${getDelayClass(index, staggerDelay)}` : 'opacity-0'}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Intersection Observer Hook for scroll-triggered animations
export const useIntersectionObserver = (
  elementRef: React.RefObject<HTMLDivElement | null>,
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
};

// Scroll-triggered animation component
interface ScrollAnimatedProps {
  children: ReactNode;
  animation?: string;
  className?: string;
  threshold?: number;
}

export const ScrollAnimated: React.FC<ScrollAnimatedProps> = ({
  children,
  animation = 'animate-fade-in',
  className = '',
  threshold = 0.1
}) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(elementRef, { threshold });

  return (
    <div
      ref={elementRef}
      className={`${isIntersecting ? `${animation} opacity-100` : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
};

// Utility function to check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Animation delay utility
export const getAnimationDelay = (index: number, baseDelay: number = 100) => {
  return { animationDelay: `${index * baseDelay}ms` };
};

// Animation duration utility
export const getAnimationDuration = (duration: 'fast' | 'medium' | 'slow') => {
  const durations = {
    fast: 120,
    medium: 180,
    slow: 250
  };
  return { animationDuration: `${durations[duration]}ms` };
};

const animationExports = {
  useAnimation,
  useStaggerAnimation,
  useIntersectionObserver,
  StaggerContainer,
  ScrollAnimated,
  ANIMATION_PRESETS,
  ANIMATION_VARIANTS,
  HOVER_EFFECTS,
  prefersReducedMotion,
  getAnimationDelay,
  getAnimationDuration
};

export default animationExports;
