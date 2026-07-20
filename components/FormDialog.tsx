"use client";

import React, { useState } from 'react';
import Modal from './Modal';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
  defaultValue?: string;
}

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  title: string;
  subtitle?: string;
  fields: FormField[];
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  initialData?: Record<string, string>;
}

const FormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  fields,
  submitText = "Save",
  cancelText = "Cancel",
  isLoading = false,
  initialData = {}
}: FormDialogProps) => {
  const [formData, setFormData] = useState<Record<string, string>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.name];
    const value = formData[field.name] || field.defaultValue || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={isLoading}
            className={`w-full border px-3 py-2 rounded resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              fieldError ? 'border-red-500' : 'border-gray-300'
            }`}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            disabled={isLoading}
            className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              fieldError ? 'border-red-500' : 'border-gray-300'
            }`}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={isLoading}
            className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              fieldError ? 'border-red-500' : 'border-gray-300'
            }`}
            required={field.required}
          />
        );
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 rounded bg-[#1A9B9A] text-white hover:bg-[#178A89] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </span>
        ) : (
          submitText
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="md"
      showCloseButton={!isLoading}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </form>
    </Modal>
  );
};

export default FormDialog;
