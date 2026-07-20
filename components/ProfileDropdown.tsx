"use client";

import React from 'react';
import Dropdown from './Dropdown';

interface ProfileDropdownItem {
  id: string;
  label?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger' | 'divider';
  disabled?: boolean;
}

interface ProfileDropdownProps {
  trigger: React.ReactNode;
  userName: string;
  userEmail?: string;
  items: ProfileDropdownItem[];
  width?: string;
  className?: string;
  closeOnItemClick?: boolean;
}

const ProfileDropdown = ({
  trigger,
  userName,
  userEmail,
  items,
  width = 'w-56',
  className = '',
  closeOnItemClick = true
}: ProfileDropdownProps) => {
  // Create the header item
  const headerItem = {
    id: 'profile-header',
    label: userEmail ? `Signed in as <br><span class="font-medium text-[#232F3E]">${userName}</span>` : userName,
    variant: 'header' as const
  };

  // Create divider after header
  const dividerItem = {
    id: 'profile-divider',
    variant: 'divider' as const
  };

  // Convert regular items
  const convertedItems = items.map(item => ({
    ...item,
    variant: (item.variant || 'default') as 'default' | 'danger' | 'divider'
  }));

  // Combine all items
  const allItems = [headerItem, dividerItem, ...convertedItems];

  return (
    <Dropdown
      trigger={trigger}
      items={allItems}
      position="right"
      width={width}
      className={className}
      closeOnItemClick={closeOnItemClick}
    />
  );
};

export default ProfileDropdown;
