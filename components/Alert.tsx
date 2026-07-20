"use client";

import React from 'react';

interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const Alert = ({ type, children, className = '', icon }: AlertProps) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-[#E6F7F7] border-[#1A9B9A] text-[#147878]';
      case 'warning':
        return 'bg-[#FFF7E6] border-[#FF9900] text-[#A36100]';
      case 'error':
        return 'bg-[#FDECEC] border-[#D93025] text-[#A02015]';
      case 'info':
        return 'bg-[#E8F0FE] border-[#2962FF] text-[#1A3EAD]';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700';
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'info':
        return 'Info';
      default:
        return 'Notice';
    }
  };

  return (
    <div className={`flex items-start gap-3 border-l-4 p-4 rounded-md ${getAlertStyles()} ${className}`}>
      <div className="flex-shrink-0">
        {icon || getDefaultIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium">{getLabel()}:</span> {children}
      </div>
    </div>
  );
};

export default Alert;
