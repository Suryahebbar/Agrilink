"use client";

import React, { useRef } from 'react';
import './tabs.css';

// Tab interface definitions
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface BaseTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  disabled?: boolean;
}

export interface TabsWithContentProps extends BaseTabsProps {
  showContent?: true;
  contentClassName?: string;
}

// Helper hook for keyboard navigation
const useKeyboardNavigation = (
  tabs: TabItem[],
  activeTab: string,
  onTabChange: (tabId: string) => void,
  disabled?: boolean
) => {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
        const prevTab = tabs[prevIndex];
        if (!prevTab.disabled) {
          onTabChange(prevTab.id);
          tabsRef.current[prevIndex]?.focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        const nextTab = tabs[nextIndex];
        if (!nextTab.disabled) {
          onTabChange(nextTab.id);
          tabsRef.current[nextIndex]?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        const firstEnabledTab = tabs.find(tab => !tab.disabled);
        if (firstEnabledTab) {
          const firstIndex = tabs.findIndex(tab => tab.id === firstEnabledTab.id);
          onTabChange(firstEnabledTab.id);
          tabsRef.current[firstIndex]?.focus();
        }
        break;
      case 'End':
        e.preventDefault();
        const lastEnabledTab = [...tabs].reverse().find(tab => !tab.disabled);
        if (lastEnabledTab) {
          const lastIndex = tabs.findIndex(tab => tab.id === lastEnabledTab.id);
          onTabChange(lastEnabledTab.id);
          tabsRef.current[lastIndex]?.focus();
        }
        break;
    }
  };

  return { tabsRef, handleKeyDown };
};

// Basic Tabs (Amazon-style underline)
export const BasicTabs: React.FC<BaseTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  disabled = false
}) => {
  const { tabsRef, handleKeyDown } = useKeyboardNavigation(tabs, activeTab, onTabChange, disabled);

  return (
    <div role="tablist" className={`tab-container-basic ${className}`} aria-orientation="horizontal">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isTabDisabled = disabled || tab.disabled;

        return (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={isTabDisabled}
            disabled={isTabDisabled}
            onClick={() => !isTabDisabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              tab-basic tab-transition tab-focus
              text-gray-500 hover:text-gray-700
              ${isActive ? 'active' : ''}
              ${isTabDisabled ? 'disabled' : 'cursor-pointer'}
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// Rounded Tabs
export const RoundedTabs: React.FC<BaseTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  disabled = false
}) => {
  const { tabsRef, handleKeyDown } = useKeyboardNavigation(tabs, activeTab, onTabChange, disabled);

  return (
    <div role="tablist" className={`tab-container-rounded ${className}`} aria-orientation="horizontal">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isTabDisabled = disabled || tab.disabled;

        return (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={isTabDisabled}
            disabled={isTabDisabled}
            onClick={() => !isTabDisabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              tab-rounded tab-transition tab-focus
              text-gray-600 hover:text-gray-800
              ${isActive ? 'active' : ''}
              ${isTabDisabled ? 'disabled' : 'cursor-pointer'}
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// Icon Tabs
export const IconTabs: React.FC<BaseTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  disabled = false
}) => {
  const { tabsRef, handleKeyDown } = useKeyboardNavigation(tabs, activeTab, onTabChange, disabled);

  return (
    <div role="tablist" className={`tab-container-icon ${className}`} aria-orientation="horizontal">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isTabDisabled = disabled || tab.disabled;

        return (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={isTabDisabled}
            disabled={isTabDisabled}
            onClick={() => !isTabDisabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              tab-icon tab-transition tab-focus
              text-gray-500 hover:text-gray-700
              ${isActive ? 'active' : ''}
              ${isTabDisabled ? 'disabled' : 'cursor-pointer'}
            `}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// Card-Style Tabs
export const CardTabs: React.FC<BaseTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  disabled = false
}) => {
  const { tabsRef, handleKeyDown } = useKeyboardNavigation(tabs, activeTab, onTabChange, disabled);

  return (
    <div role="tablist" className={`tab-container-card ${className}`} aria-orientation="horizontal">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isTabDisabled = disabled || tab.disabled;

        return (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={isTabDisabled}
            disabled={isTabDisabled}
            onClick={() => !isTabDisabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              tab-card tab-transition tab-focus
              text-gray-600 hover:bg-gray-50
              ${isActive ? 'active' : ''}
              ${isTabDisabled ? 'disabled' : 'cursor-pointer'}
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// Pill Tabs
export const PillTabs: React.FC<BaseTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  disabled = false
}) => {
  const { tabsRef, handleKeyDown } = useKeyboardNavigation(tabs, activeTab, onTabChange, disabled);

  return (
    <div role="tablist" className={`tab-container-pill ${className}`} aria-orientation="horizontal">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isTabDisabled = disabled || tab.disabled;

        return (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={isTabDisabled}
            disabled={isTabDisabled}
            onClick={() => !isTabDisabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              tab-pill tab-transition tab-focus
              text-gray-600 hover:bg-gray-200
              ${isActive ? 'active' : ''}
              ${isTabDisabled ? 'disabled' : 'cursor-pointer'}
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// Responsive container
export const ResponsiveTabsContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`overflow-x-auto scrollbar-hide ${className}`}>
    {children}
  </div>
);

// Tabs with content panels
export const TabsWithContent: React.FC<TabsWithContentProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  contentClassName = '',
  disabled = false
}) => {
  const { tabsRef, handleKeyDown } = useKeyboardNavigation(tabs, activeTab, onTabChange, disabled);

  return (
    <div className={className}>
      <div role="tablist" className="tab-container-basic" aria-orientation="horizontal">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isTabDisabled = disabled || tab.disabled;

          return (
            <button
              id={`tab-${tab.id}`}
              key={tab.id}
              ref={(el) => { tabsRef.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              aria-disabled={isTabDisabled}
              disabled={isTabDisabled}
              onClick={() => !isTabDisabled && onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                tab-basic tab-transition tab-focus
                text-gray-500 hover:text-gray-700
                ${isActive ? 'active' : ''}
                ${isTabDisabled ? 'disabled' : 'cursor-pointer'}
              `}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={`mt-4 ${contentClassName}`}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            className={activeTab === tab.id ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Tabs Factory
export interface TabsProps extends BaseTabsProps {
  variant?: 'basic' | 'rounded' | 'icon' | 'card' | 'pill';
  showContent?: boolean;
  contentClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  variant = 'basic',
  showContent = false,
  contentClassName = '',
  ...props
}) => {
  const componentMap = {
    basic: BasicTabs,
    rounded: RoundedTabs,
    icon: IconTabs,
    card: CardTabs,
    pill: PillTabs
  };

  const TabComponent = componentMap[variant];

  if (showContent) {
    return (
      <TabsWithContent
        {...props}
        contentClassName={contentClassName}
      />
    );
  }

  return <TabComponent {...props} />;
};

export default Tabs;

