"use client";

import React from 'react';
import Alert from '@/components/Alert';
import { useNotifications } from '@/lib/notifications';
import NotificationContainer from '@/components/NotificationContainer';
import { NotificationProvider } from '@/lib/notifications';

function NotificationDemo() {
  const { success, error, warning, info, clearAll } = useNotifications();

  const handleShowToasts = () => {
    success('Product added successfully!');
    error('Something went wrong. Please try again.');
    warning('Inventory is running low.');
    info('Your reports are being generated.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Alerts & Notifications Demo</h1>
        
        {/* Alert Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Alert Components</h2>
          
          <div className="space-y-4">
            <Alert type="success">
              Your changes have been saved successfully.
            </Alert>
            
            <Alert type="warning">
              Inventory is running low. Please restock soon.
            </Alert>
            
            <Alert type="error">
              Something went wrong. Please try again later.
            </Alert>
            
            <Alert type="info">
              Your reports are being generated in the background.
            </Alert>
          </div>
        </section>

        {/* Toast Notifications Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Toast Notifications</h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleShowToasts}
              className="px-4 py-2 bg-[#1A9B9A] text-white rounded-md hover:bg-[#147878] transition-colors"
            >
              Show All Toasts
            </button>
            
            <button
              onClick={() => success('Product added successfully!')}
              className="px-4 py-2 bg-[#1A9B9A] text-white rounded-md hover:bg-[#147878] transition-colors"
            >
              Success Toast
            </button>
            
            <button
              onClick={() => error('Failed to save changes')}
              className="px-4 py-2 bg-[#D93025] text-white rounded-md hover:bg-[#A02015] transition-colors"
            >
              Error Toast
            </button>
            
            <button
              onClick={() => warning('Please review your input')}
              className="px-4 py-2 bg-[#FF9900] text-white rounded-md hover:bg-[#A36100] transition-colors"
            >
              Warning Toast
            </button>
            
            <button
              onClick={() => info('New feature available')}
              className="px-4 py-2 bg-[#2962FF] text-white rounded-md hover:bg-[#1A3EAD] transition-colors"
            >
              Info Toast
            </button>
            
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        </section>

        {/* Custom Alert Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Custom Alert Examples</h2>
          
          <div className="space-y-4">
            <Alert 
              type="success" 
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
              }
            >
              Custom icon alert with success message
            </Alert>
            
            <Alert type="info" className="border-l-8">
              This alert has thicker border and custom styling
            </Alert>
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Usage Instructions</h2>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Component</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`import Alert from '@/components/Alert';

<Alert type="success">
  Your message here
</Alert>

<Alert type="warning" icon={customIcon}>
  Custom icon alert
</Alert>`}
            </pre>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Toast Notifications</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`import { useNotifications } from '@/lib/notifications';

const { success, error, warning, info } = useNotifications();

success('Success message!');
error('Error message!');
warning('Warning message!');
info('Info message!');`}
            </pre>
          </div>
        </section>
      </div>
      
      <NotificationContainer />
    </div>
  );
}

export default function DemoPage() {
  return (
    <NotificationProvider>
      <NotificationDemo />
    </NotificationProvider>
  );
}
