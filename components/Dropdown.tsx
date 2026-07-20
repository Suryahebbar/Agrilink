"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DropdownItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger' | 'divider' | 'header';
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  position?: 'left' | 'right';
  width?: string;
  className?: string;
  closeOnItemClick?: boolean;
}

const Dropdown = ({
  trigger,
  items,
  position = 'left',
  width = 'w-48',
  className = '',
  closeOnItemClick = true
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeDropdown]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.variant === 'divider' || item.variant === 'header') return;

    if (item.onClick) {
      item.onClick();
    }

    if (item.href) {
      window.location.assign(item.href);
    }

    if (closeOnItemClick) {
      closeDropdown();
    }
  };

  const getPositionClasses = () => {
    return position === 'right' ? 'right-0' : 'left-0';
  };

  const getItemClasses = (item: DropdownItem) => {
    const baseClasses = 'px-4 py-2 text-sm cursor-pointer transition-colors dropdown-item';
    
    if (item.variant === 'divider') {
      return 'border-t my-1 dropdown-divider';
    }

    if (item.variant === 'header') {
      return 'text-sm text-gray-600 border-b cursor-default pointer-events-none';
    }

    const variantClasses = item.variant === 'danger' 
      ? 'text-red-600 hover:bg-red-50' 
      : 'hover:bg-gray-100';

    const disabledClasses = item.disabled 
      ? 'opacity-50 cursor-not-allowed pointer-events-none' 
      : '';

    return `${baseClasses} ${variantClasses} ${disabledClasses}`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div 
        ref={triggerRef}
        onClick={toggleDropdown}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute mt-2 ${width} ${getPositionClasses()} dropdown-container animate-dropdown-in z-50`}
        >
          <ul className="py-1">
            {items.map((item) => (
              <li key={item.id}>
                {item.variant === 'divider' ? (
                  <div className={getItemClasses(item)} />
                ) : item.variant === 'header' ? (
                  <div className={getItemClasses(item)}>
                    <div dangerouslySetInnerHTML={{ __html: item.label || '' }} />
                  </div>
                ) : (
                  <div
                    className={getItemClasses(item)}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center">
                      {item.icon && (
                        <span className="mr-3 flex-shrink-0">
                          {item.icon}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
