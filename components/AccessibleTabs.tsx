"use client";

import React, { ReactNode, useRef, useEffect } from 'react';
import './accessibility.css';

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  orientation = 'horizontal'
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tabListRef.current) return;

      const tabElements = Array.from(
        tabListRef.current.querySelectorAll('[role="tab"]:not([disabled])')
      ) as HTMLElement[];
      
      const currentIndex = tabElements.findIndex(
        (tab) => tab.getAttribute('aria-controls') === activeTab
      );

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabElements.length - 1;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = currentIndex < tabElements.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tabElements.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        const newTabId = tabElements[newIndex].getAttribute('aria-controls');
        if (newTabId) {
          onTabChange(newTabId);
          tabElements[newIndex].focus();
        }
      }
    };

    const tabList = tabListRef.current;
    if (tabList) {
      tabList.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (tabList) {
        tabList.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [tabs, activeTab, onTabChange]);

  const getTabListClasses = () => {
    return [
      'tab-list',
      orientation === 'vertical' ? 'flex-col space-y-1' : 'flex space-x-1'
    ].filter(Boolean).join(' ');
  };

  const getTabClasses = (tab: TabItem) => {
    const isActive = activeTab === tab.id;
    const isDisabled = tab.disabled;

    return [
      'tab-button',
      isActive && 'active',
      isDisabled && 'disabled',
      !isDisabled && 'cursor-pointer'
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={`accessible-tabs ${className}`}>
      {/* Tab List */}
      <div
        ref={tabListRef}
        className={getTabListClasses()}
        role="tablist"
        aria-orientation={orientation as 'horizontal' | 'vertical'}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={getTabClasses(tab)}
            role="tab"
            aria-selected={activeTab === tab.id ? 'true' as const : 'false' as const}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={tab.disabled ? 'true' as const : undefined}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          className="tab-panel"
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

export default AccessibleTabs;
