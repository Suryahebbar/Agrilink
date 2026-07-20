"use client";

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/lib/notifications';

interface NotificationItemProps {
  notification: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };
  onClose: (id: string) => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation after mount
    const showTimer = setTimeout(() => setIsVisible(true), 0);
    
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Allow fade-out animation to complete before removing
      setTimeout(() => onClose(notification.id), 250);
    }, notification.duration || 4500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, notification.duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = 'fixed bottom-5 right-5 flex items-center gap-3 shadow-lg rounded-md p-4 text-white bg-[#232F3E] border-l-4';
    
    switch (notification.type) {
      case 'success':
        return `${baseStyles} border-[#1A9B9A]`;
      case 'error':
        return `${baseStyles} border-[#D93025]`;
      case 'warning':
        return `${baseStyles} border-[#FF9900]`;
      case 'info':
        return `${baseStyles} border-[#2962FF]`;
      default:
        return `${baseStyles} border-gray-400`;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-[#1A9B9A]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-[#D93025]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-[#FF9900]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-[#2962FF]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`${getToastStyles()} ${
        isVisible 
          ? 'animate-slide-in opacity-100 transform translate-y-0' 
          : 'opacity-0 transform translate-y-[18px] transition-all duration-250 ease-in'
      }`}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <p className="flex-1 text-white font-medium">{notification.message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(notification.id), 250);
        }}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0"
        aria-label="Close notification"
        title="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={removeNotification} 
        />
      ))}
    </div>
  );
}
