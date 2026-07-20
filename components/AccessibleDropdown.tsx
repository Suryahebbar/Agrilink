"use client";

import React, { ReactNode, useRef, useEffect } from 'react';
import './accessibility.css';

// ID generator for accessibility
let dropdownIdCounter = 0;

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
}

interface AccessibleDropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
  dropdownClassName?: string;
  closeOnSelect?: boolean;
  ariaLabel?: string;
}

const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  trigger,
  items,
  placement = 'bottom-left',
  className = '',
  dropdownClassName = '',
  closeOnSelect = true,
  ariaLabel
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownId = `dropdown-${dropdownIdCounter++}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !dropdownRef.current) return;

      const menuItems = Array.from(
        dropdownRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')
      ) as HTMLElement[];
      
      const currentIndex = menuItems.findIndex((item) => item === document.activeElement);

      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          newIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = menuItems.length - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.click();
          }
          return;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        menuItems[newIndex].focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getPlacementClasses = () => {
    switch (placement) {
      case 'bottom-left':
        return 'top-full left-0 mt-1';
      case 'bottom-right':
        return 'top-full right-0 mt-1';
      case 'top-left':
        return 'bottom-full left-0 mb-1';
      case 'top-right':
        return 'bottom-full right-0 mb-1';
      default:
        return 'top-full left-0 mt-1';
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;

    item.onClick?.();
    
    if (item.href) {
      const link = document.createElement('a');
      link.href = item.href;
      link.click();
    }

    if (closeOnSelect) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen ? 'true' as const : 'false' as const}
        aria-controls={dropdownId}
        aria-label={ariaLabel}
      >
        {trigger}
        <span className="sr-only">
          {isOpen ? 'Close menu' : 'Open menu'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={dropdownId}
          className={`dropdown-menu ${getPlacementClasses()} ${dropdownClassName}`}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`dropdown-item ${item.className || ''}`}
              role="menuitem"
              tabIndex={-1}
            >
              {item.icon && (
                <span className="flex-shrink-0 mr-2" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {item.disabled && (
                <span className="sr-only"> (disabled)</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessibleDropdown;
