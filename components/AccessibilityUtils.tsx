"use client";

import React, { useEffect, useRef, useState } from 'react';

// Screen Reader Announcements
export const useAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('');
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = (message: string) => {
    setAnnouncement(message);
    
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  };

  const AnnounceComponent = () => (
    <div
      ref={announcerRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );

  return { announce, AnnounceComponent };
};

// Focus Management
export const useFocusManagement = (isOpen: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else if (!isOpen) {
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const trapFocus = (e: KeyboardEvent) => {
    if (!containerRef.current || e.key !== 'Tab') return;

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  return { containerRef, trapFocus };
};

// Keyboard Navigation Hook
export const useKeyboardNavigation = (
  items: Array<{ id: string; disabled?: boolean }>,
  activeId: string | null,
  onSelect: (id: string) => void,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) => {
  const getValidItems = () => items.filter(item => !item.disabled);
  const currentIndex = getValidItems().findIndex(item => item.id === activeId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const validItems = getValidItems();
    if (validItems.length === 0) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : validItems.length - 1;
        break;
      case orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < validItems.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = validItems.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeId) {
          onSelect(activeId);
        }
        return;
      default:
        return;
    }

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < validItems.length) {
      onSelect(validItems[newIndex].id);
    }
  };

  return { handleKeyDown };
};

// Reduced Motion Detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Skip Link Component
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className = ''
}) => (
  <a
    href={href}
    className={`skip-to-content ${className}`}
  >
    {children}
  </a>
);

// Screen Reader Only Text Component
interface SrOnlyProps {
  children: React.ReactNode;
}

export const SrOnly: React.FC<SrOnlyProps> = ({ children }) => (
  <span className="sr-only">
    {children}
  </span>
);

// Accessible Icon Button Component
interface AccessibleIconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  ariaPressed?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AccessibleIconButton: React.FC<AccessibleIconButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  ariaPressed,
  disabled = false,
  className = ''
}) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed ? 'true' as const : 'false' as const}
    disabled={disabled}
    className={`accessible-icon-button ${className}`}
  >
    <span aria-hidden="true">
      {icon}
    </span>
  </button>
);

// Focus Visible Hook
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isFocusVisible;
};

// Accessible Link Component
interface AccessibleLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const AccessibleLink: React.FC<AccessibleLinkProps> = ({
  href,
  children,
  external = false,
  ariaLabel,
  className = ''
}) => (
  <a
    href={href}
    className={`accessible-link ${className}`}
    aria-label={ariaLabel}
    {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
  >
    {children}
    {external && (
      <SrOnly> (opens in new window)</SrOnly>
    )}
  </a>
);

// Error Boundary with Screen Reader Support
interface AccessibilityErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AccessibilityErrorBoundary extends React.Component<
  React.PropsWithChildren<object>,
  AccessibilityErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AccessibilityErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('Accessibility Error:', error, errorInfo);
    
    // Announce error to screen readers
    const announcement = `An error occurred: ${error.message}`;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-bg border border-red-300 rounded-lg p-6" role="alert">
          <h2 className="error-text text-lg font-semibold mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-700 mb-4">
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="accessible-button"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const accessibilityUtilsExports = {
  useAnnouncer,
  useFocusManagement,
  useKeyboardNavigation,
  useReducedMotion,
  SkipLink,
  SrOnly,
  AccessibleIconButton,
  useFocusVisible,
  AccessibleLink,
  AccessibilityErrorBoundary
};

export default accessibilityUtilsExports;
