"use client";

import React from 'react';
import Dropdown from './Dropdown';

interface IconDropdownItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

interface IconDropdownProps {
  trigger: React.ReactNode;
  items: IconDropdownItem[];
  width?: string;
  className?: string;
  closeOnItemClick?: boolean;
}

const IconDropdown = ({
  trigger,
  items,
  width = 'w-56',
  className = '',
  closeOnItemClick = true
}: IconDropdownProps) => {
  const dropdownItems = items.map(item => ({
    ...item,
    variant: 'default' as const
  }));

  return (
    <Dropdown
      trigger={trigger}
      items={dropdownItems}
      position="left"
      width={width}
      className={className}
      closeOnItemClick={closeOnItemClick}
    />
  );
};

export default IconDropdown;
