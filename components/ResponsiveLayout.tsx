"use client";

import React, { ReactNode } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  sidebarWidth?: {
    default?: string;
    lg?: string;
  };
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  className = '',
  sidebarWidth = { default: 'w-64', lg: 'w-72' }
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      {header && (
        <header className="bg-white shadow-sm border-b border-gray-200">
          {header}
        </header>
      )}

      <div className="flex">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        {sidebar && (
          <aside className={`${sidebarWidth.default} ${sidebarWidth.lg} hidden lg:block bg-white shadow-sm border-r border-gray-200 min-h-screen`}>
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="bg-white border-t border-gray-200">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default ResponsiveLayout;
