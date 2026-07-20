"use client";

import React, { useState } from 'react';
import { BasicTabs, RoundedTabs, IconTabs, CardTabs, PillTabs, TabsWithContent } from './Tabs';

const TabsDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const basicTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'analytics', label: 'Analytics' },
  ];

  const iconTabs = [
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const tabsWithContent = [
    { 
      id: 'profile', 
      label: 'Profile',
      content: <div className="p-4 bg-gray-50 rounded">Profile content here</div>
    },
    { 
      id: 'security', 
      label: 'Security',
      content: <div className="p-4 bg-gray-50 rounded">Security settings here</div>
    },
    { 
      id: 'notifications', 
      label: 'Notifications',
      content: <div className="p-4 bg-gray-50 rounded">Notification preferences here</div>
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Tabs Component Demo</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Tabs (Amazon-style)</h2>
        <BasicTabs
          tabs={basicTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Rounded Tabs</h2>
        <RoundedTabs
          tabs={basicTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Icon Tabs</h2>
        <IconTabs
          tabs={iconTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Card Tabs</h2>
        <CardTabs
          tabs={basicTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Pill Tabs</h2>
        <PillTabs
          tabs={basicTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tabs with Content</h2>
        <TabsWithContent
          tabs={tabsWithContent}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
};

export default TabsDemo;
