"use client";

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { ModalProvider, useModal } from '@/lib/modal';

function ModalDemo() {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const { openConfirmation, openForm, openAlert } = useModal();

  // Confirmation Dialog Examples
  const handleDeleteConfirmation = () => {
    openConfirmation({
      title: "Delete Product",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      onConfirm: () => console.log("Product deleted"),
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
  };

  const handleLogoutConfirmation = () => {
    openConfirmation({
      title: "Logout",
      message: "Are you sure you want to logout?",
      onConfirm: () => console.log("Logged out"),
      variant: "info",
      confirmText: "Logout",
      cancelText: "Stay"
    });
  };

  // Form Dialog Examples
  const handleAddProduct = () => {
    openForm({
      title: "Add Product",
      subtitle: "Enter product details below",
      fields: [
        {
          name: "name",
          label: "Product Name",
          type: "text",
          placeholder: "Enter product name",
          required: true
        },
        {
          name: "price",
          label: "Price",
          type: "number",
          placeholder: "0.00",
          required: true
        },
        {
          name: "category",
          label: "Category",
          type: "select",
          options: ["Electronics", "Clothing", "Food", "Books"],
          required: true
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Product description..."
        }
      ],
      onSubmit: (data: Record<string, string>) => console.log("Form submitted:", data),
      submitText: "Add Product",
      cancelText: "Cancel"
    });
  };

  const handleEditProfile = () => {
    openForm({
      title: "Edit Profile",
      fields: [
        {
          name: "firstName",
          label: "First Name",
          type: "text",
          defaultValue: "John",
          required: true
        },
        {
          name: "lastName",
          label: "Last Name",
          type: "text",
          defaultValue: "Doe",
          required: true
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          defaultValue: "john.doe@example.com",
          required: true
        }
      ],
      onSubmit: (data: Record<string, string>) => console.log("Profile updated:", data),
      submitText: "Save Changes",
      cancelText: "Cancel",
      initialData: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com"
      }
    });
  };

  // Alert Dialog Examples
  const handleInventoryWarning = () => {
    openAlert({
      title: "Low Inventory Warning",
      message: "Your inventory is critically low. Refill stock to avoid listing removal.",
      variant: "warning",
      actionText: "View Inventory",
      onAction: () => console.log("Navigate to inventory")
    });
  };

  const handleSuccessMessage = () => {
    openAlert({
      title: "Success!",
      message: "Your product has been successfully listed and is now live.",
      variant: "success",
      actionText: "View Product",
      onAction: () => console.log("Navigate to product")
    });
  };

  const handleSystemError = () => {
    openAlert({
      title: "System Error",
      message: "We're experiencing technical difficulties. Please try again later.",
      variant: "error",
      actionText: "Contact Support",
      onAction: () => console.log("Contact support")
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Modals & Dialogs Demo</h1>

        {/* Confirmation Dialogs Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Confirmation Dialogs</h2>
          <p className="text-gray-600">Small dialogs for confirming user actions with different variants.</p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDeleteConfirmation}
              className="px-4 py-2 bg-[#D93025] text-white rounded hover:bg-red-700"
            >
              Delete Confirmation
            </button>
            
            <button
              onClick={handleLogoutConfirmation}
              className="px-4 py-2 bg-[#1A9B9A] text-white rounded hover:bg-[#178A89]"
            >
              Logout Confirmation
            </button>
          </div>
        </section>

        {/* Form Dialogs Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Form Dialogs</h2>
          <p className="text-gray-600">Medium-sized dialogs with form fields and validation.</p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-[#1A9B9A] text-white rounded hover:bg-[#178A89]"
            >
              Add Product Form
            </button>
            
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-[#2962FF] text-white rounded hover:bg-[#1A3EAD]"
            >
              Edit Profile Form
            </button>
          </div>
        </section>

        {/* Alert Dialogs Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Alert Dialogs</h2>
          <p className="text-gray-600">Important alerts and warnings with distinctive styling.</p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleInventoryWarning}
              className="px-4 py-2 bg-[#FF9900] text-white rounded hover:bg-[#E88B00]"
            >
              Inventory Warning
            </button>
            
            <button
              onClick={handleSuccessMessage}
              className="px-4 py-2 bg-[#067D62] text-white rounded hover:bg-green-700"
            >
              Success Message
            </button>
            
            <button
              onClick={handleSystemError}
              className="px-4 py-2 bg-[#D93025] text-white rounded hover:bg-red-700"
            >
              System Error
            </button>
          </div>
        </section>

        {/* Custom Modal Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Custom Modal</h2>
          <p className="text-gray-600">Base modal component with custom content.</p>
          
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Open Custom Modal
          </button>
        </section>

        {/* Usage Instructions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Usage Instructions</h2>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Modal Context</h3>
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`import { useModal } from '@/lib/modal';

const { openConfirmation, openForm, openAlert } = useModal();

// Confirmation Dialog
openConfirmation({
  title: "Delete Item",
  message: "Are you sure?",
  onConfirm: () => handleDelete(),
  variant: "danger"
});

// Form Dialog
openForm({
  title: "Add Item",
  fields: [/* field definitions */],
  onSubmit: (data) => handleSubmit(data)
});

// Alert Dialog
openAlert({
  title: "Warning",
  message: "Important message",
  variant: "warning"
});`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Direct Component Usage</h3>
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`import ConfirmationDialog from '@/components/ConfirmationDialog';
import FormDialog from '@/components/FormDialog';
import AlertDialog from '@/components/AlertDialog';

<ConfirmationDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Confirm Action"
  message="Are you sure?"
  variant="danger"
/>

<FormDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
  title="Add Product"
  fields={fields}
/>

<AlertDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Warning"
  message="Important message"
  variant="warning"
/>`}
              </pre>
            </div>
          </div>
        </section>
      </div>

      {/* Custom Modal */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Custom Modal"
        subtitle="This is a custom modal with any content you want"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsCustomModalOpen(false)}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Close
            </button>
            <button
              onClick={() => setIsCustomModalOpen(false)}
              className="px-4 py-2 rounded bg-[#1A9B9A] text-white hover:bg-[#178A89]"
            >
              Save Changes
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p>This is a custom modal using the base Modal component. You can put any content here:</p>
          
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Amazon-style design with proper animations</li>
              <li>Click outside to close</li>
              <li>Escape key to close</li>
              <li>Body scroll lock</li>
              <li>Multiple size options</li>
              <li>Customizable header and footer</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Best Practices:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use clear, concise titles</li>
              <li>Keep actions focused and limited</li>
              <li>Provide context for user decisions</li>
              <li>Use appropriate variants for different scenarios</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function DemoPage() {
  return (
    <ModalProvider>
      <ModalDemo />
    </ModalProvider>
  );
}
