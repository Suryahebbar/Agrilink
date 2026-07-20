"use client";

import React, { useState } from 'react';
import Dropdown from './Dropdown';

interface FilterOption {
  value: string;
  label: string;
}

const FilterDropdown = ({
  trigger,
  options,
  selectedValue,
  onSelect,
  width = 'w-60',
  className = ''
}: {
  trigger: React.ReactNode;
  options: FilterOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  width?: string;
  className?: string;
}) => {
  const [currentValue, setCurrentValue] = useState(selectedValue || '');

  const handleSelect = (value: string) => {
    setCurrentValue(value);
    onSelect(value);
  };

  const dropdownItems = options.map(option => ({
    id: option.value,
    label: option.label,
    onClick: () => handleSelect(option.value),
    variant: currentValue === option.value ? 'default' as const : 'default' as const
  }));

  return (
    <Dropdown
      trigger={trigger}
      items={dropdownItems}
      position="left"
      width={width}
      className={className}
      closeOnItemClick={true}
    />
  );
};

// Alternative Filter Dropdown with custom content
export const FilterDropdownPanel = ({
  trigger,
  label,
  children,
  width = 'w-60',
  className = ''
}: {
  trigger: React.ReactNode;
  label: string;
  children: React.ReactNode;
  width?: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
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
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute mt-2 ${width} dropdown-container animate-dropdown-in z-50`}
        >
          <div className="p-3">
            <label className="text-xs text-gray-500">{label}</label>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
