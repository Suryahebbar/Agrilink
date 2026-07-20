"use client";

import React from 'react';
import Modal from './Modal';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'danger',
  isLoading = false
}: ConfirmationDialogProps) => {
  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#D93025] text-white hover:bg-red-700';
      case 'warning':
        return 'bg-[#FF9900] text-white hover:bg-[#E88B00]';
      case 'info':
        return 'bg-[#1A9B9A] text-white hover:bg-[#178A89]';
      default:
        return 'bg-[#1A9B9A] text-white hover:bg-[#178A89]';
    }
  };

  const footer = (
    <>
      <button
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className={`px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonStyles()}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          confirmText
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={!isLoading}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={footer}
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
};

export default ConfirmationDialog;
