"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfirmationDialogProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

interface FormDialogProps {
  title: string;
  subtitle?: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'textarea' | 'select';
    placeholder?: string;
    required?: boolean;
    options?: string[];
    defaultValue?: string;
  }>;
  onSubmit: (data: Record<string, string>) => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  initialData?: Record<string, string>;
}

interface AlertDialogProps {
  title: string;
  message: string;
  actionText?: string;
  variant?: 'warning' | 'error' | 'info' | 'success';
  showAction?: boolean;
  icon?: React.ReactNode;
  onAction?: () => void;
}

interface CustomModalProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

type ModalProps = ConfirmationDialogProps | FormDialogProps | AlertDialogProps | CustomModalProps;

interface ModalState {
  isOpen: boolean;
  type: 'confirmation' | 'form' | 'alert' | 'custom';
  props: ModalProps;
}

interface ModalContextType {
  modal: ModalState;
  openConfirmation: (props: ConfirmationDialogProps) => void;
  openForm: (props: FormDialogProps) => void;
  openAlert: (props: AlertDialogProps) => void;
  openCustom: (props: CustomModalProps) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'confirmation',
    props: {} as ModalProps
  });

  const openConfirmation = (props: ConfirmationDialogProps) => {
    setModal({
      isOpen: true,
      type: 'confirmation',
      props
    });
  };

  const openForm = (props: FormDialogProps) => {
    setModal({
      isOpen: true,
      type: 'form',
      props
    });
  };

  const openAlert = (props: AlertDialogProps) => {
    setModal({
      isOpen: true,
      type: 'alert',
      props
    });
  };

  const openCustom = (props: CustomModalProps) => {
    setModal({
      isOpen: true,
      type: 'custom',
      props
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{
      modal,
      openConfirmation,
      openForm,
      openAlert,
      openCustom,
      closeModal
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
