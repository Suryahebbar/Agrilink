"use client";

import React from 'react';
import Dropdown from './Dropdown';
import IconDropdown from './IconDropdown';
import FilterDropdown, { FilterDropdownPanel } from './FilterDropdown';
import ProfileDropdown from './ProfileDropdown';

// Example usage components for all dropdown variants

export const BasicDropdownExample = () => {
  const items = [
    { id: '1', label: 'Dashboard', onClick: () => console.log('Dashboard clicked') },
    { id: '2', label: 'Orders', onClick: () => console.log('Orders clicked') },
    { id: '3', label: 'Inventory', onClick: () => console.log('Inventory clicked') },
    { id: '4', variant: 'divider' as const },
    { id: '5', label: 'Logout', onClick: () => console.log('Logout clicked'), variant: 'danger' as const }
  ];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
          Options
          <span>▾</span>
        </button>
      }
      items={items}
    />
  );
};

export const IconDropdownExample = () => {
  const items = [
    { 
      id: '1', 
      label: 'Reports', 
      icon: <span>📄</span>,
      onClick: () => console.log('Reports clicked')
    },
    { 
      id: '2', 
      label: 'Orders', 
      icon: <span>📦</span>,
      onClick: () => console.log('Orders clicked')
    },
    { 
      id: '3', 
      label: 'Analytics', 
      icon: <span>📊</span>,
      onClick: () => console.log('Analytics clicked')
    }
  ];

  return (
    <IconDropdown
      trigger={
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
          Menu
          <span>▾</span>
        </button>
      }
      items={items}
    />
  );
};

export const FilterDropdownExample = () => {
  const [selectedDate, setSelectedDate] = React.useState('7days');

  const dateOptions = [
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <FilterDropdown
      trigger={
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
          Date Range
          <span>▾</span>
        </button>
      }
      options={dateOptions}
      selectedValue={selectedDate}
      onSelect={setSelectedDate}
    />
  );
};

export const FilterDropdownPanelExample = () => {
  return (
    <FilterDropdownPanel
      trigger={
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
          Advanced Filter
          <span>▾</span>
        </button>
      }
      label="Date Range"
    >
      <select className="w-full mt-1 border rounded px-2 py-1 text-sm" aria-label="Date range filter">
        <option>Last 7 days</option>
        <option>Last 30 days</option>
        <option>This Month</option>
        <option>Custom Range</option>
      </select>
    </FilterDropdownPanel>
  );
};

export const ProfileDropdownExample = () => {
  const menuItems = [
    { id: '1', label: 'Account Settings', onClick: () => console.log('Account Settings') },
    { id: '2', label: 'Notifications', onClick: () => console.log('Notifications') },
    { id: '3', variant: 'divider' as const },
    { id: '4', label: 'Sign out', onClick: () => console.log('Sign out'), variant: 'danger' as const }
  ];

  return (
    <ProfileDropdown
      trigger={
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
          Profile
          <span>▾</span>
        </button>
      }
      userName="Surya"
      userEmail="surya@example.com"
      items={menuItems}
    />
  );
};

// Complete demo page
export const DropdownDemo = () => {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dropdown Components</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Dropdown</h2>
          <BasicDropdownExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Icon Dropdown</h2>
          <IconDropdownExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Filter Dropdown</h2>
          <FilterDropdownExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Filter Panel</h2>
          <FilterDropdownPanelExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile Dropdown</h2>
          <ProfileDropdownExample />
        </div>
      </div>
    </div>
  );
};

export default DropdownDemo;
