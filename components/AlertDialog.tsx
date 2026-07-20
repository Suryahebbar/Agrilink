"use client";

import React from 'react';
import Modal from './Modal';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
  title: string;
  message: string;
  actionText?: string;
  variant?: 'warning' | 'error' | 'info' | 'success';
  showAction?: boolean;
  icon?: React.ReactNode;
}

const AlertDialog = ({
  isOpen,
  onClose,
  onAction,
  title,
  message,
  actionText = "Understood",
  variant = 'warning',
  showAction = true,
  icon
}: AlertDialogProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          border: 'alert-dialog-border-warning',
          button: 'alert-dialog-button-warning',
          icon: 'alert-dialog-icon-warning'
        };
      case 'error':
        return {
          border: 'alert-dialog-border-error',
          button: 'alert-dialog-button-error',
          icon: 'alert-dialog-icon-error'
        };
      case 'info':
        return {
          border: 'alert-dialog-border-info',
          button: 'alert-dialog-button-info',
          icon: 'alert-dialog-icon-info'
        };
      case 'success':
        return {
          border: 'alert-dialog-border-success',
          button: 'alert-dialog-button-success',
          icon: 'alert-dialog-icon-success'
        };
      default:
        return {
          border: 'alert-dialog-border-warning',
          button: 'alert-dialog-button-warning',
          icon: 'alert-dialog-icon-warning'
        };
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const variantStyles = getVariantStyles();

  const footer = showAction ? (
    <div className="flex justify-end">
      <button
        onClick={onAction || onClose}
        className={`px-4 py-2 rounded ${variantStyles.button}`}
      >
        {actionText}
      </button>
    </div>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      showCloseButton={true}
      footer={footer}
    >
      <div className={`bg-white rounded-lg shadow-xl p-6 border-l-4 ${variantStyles.border}`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${variantStyles.icon}`}>
            {icon || getDefaultIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold modal-header-title">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              {message}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDialog;
