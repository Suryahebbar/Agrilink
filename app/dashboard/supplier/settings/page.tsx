"use client";

import { useState, useEffect } from 'react';
import { withSupplierAuth } from '@/lib/supplier-auth';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');

  // Change password modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    lowStockAlerts: true,
    reviewNotifications: true,
    marketingEmails: false,
    
    // Business Settings
    autoConfirmOrders: false,
    defaultShippingMethod: 'standard',
    returnPolicy: '30-days',
    taxInclusive: true,
    taxRate: 0.18,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '24h',
    
    // Display Settings
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en'
  });

  // Delete account state
  const [deleting, setDeleting] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        // Temporarily use hardcoded supplierId for testing
        currentSupplierId = '6937e4d94cae15b75c9e255e';
        setSupplierId(currentSupplierId);
      }
      
      // Temporarily use test endpoint to bypass authentication
      const response = await fetch(`/api/test/settings`);

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Map the API response to frontend state structure
          const apiSettings = data.settings;
          setSettings({
            emailNotifications: apiSettings.notifications?.emailNotifications ?? true,
            smsNotifications: apiSettings.notifications?.smsNotifications ?? false,
            orderNotifications: apiSettings.notifications?.orderUpdates ?? true,
            lowStockAlerts: apiSettings.notifications?.lowStockAlerts ?? true,
            reviewNotifications: true, // Default since not in API
            marketingEmails: apiSettings.notifications?.promotionalEmails ?? false,
            
            autoConfirmOrders: apiSettings.preferences?.autoConfirmOrders ?? false,
            defaultShippingMethod: apiSettings.preferences?.defaultShippingMethod ?? 'standard',
            returnPolicy: apiSettings.preferences?.returnPolicy ?? '30-days',
            taxInclusive: apiSettings.tax?.taxInclusive ?? true,
            taxRate: apiSettings.tax?.taxRate ?? 0.18,
            
            twoFactorAuth: false, // Default since not in API
            sessionTimeout: '24h', // Default since not in API
            
            currency: apiSettings.preferences?.currency ?? 'INR',
            timezone: apiSettings.preferences?.timezone ?? 'Asia/Kolkata',
            language: apiSettings.preferences?.language ?? 'en'
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleSelect = (setting: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const currentSupplierId = supplierId || '6937e4d94cae15b75c9e255e';
      
      // Structure the data to match API expectations
      const settingsData = {
        businessInfo: {
          companyName: '', // Will be populated from profile if needed
          email: '',
          phone: ''
        },
        notifications: {
          emailNotifications: settings.emailNotifications,
          smsNotifications: settings.smsNotifications,
          orderUpdates: settings.orderNotifications,
          lowStockAlerts: settings.lowStockAlerts,
          promotionalEmails: settings.marketingEmails
        },
        tax: {
          taxInclusive: settings.taxInclusive,
          taxRate: settings.taxRate
        },
        preferences: {
          autoConfirmOrders: settings.autoConfirmOrders,
          defaultShippingMethod: settings.defaultShippingMethod,
          returnPolicy: settings.returnPolicy,
          currency: settings.currency,
          timezone: settings.timezone,
          language: settings.language
        }
      };

      // Temporarily use test endpoint to bypass authentication
      const response = await fetch(`/api/test/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Settings saved successfully!');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitChangePassword = async () => {
    setChangePasswordError('');
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setChangePasswordError('Please enter both current and new password');
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/settings/change-password`, withSupplierAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      }));

      const data = await response.json();
      if (response.ok) {
        setSuccess('Password changed successfully');
        setIsChangePasswordOpen(false);
      } else {
        setChangePasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setChangePasswordError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/settings/export`, withSupplierAuth());
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to download data');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supplier-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
      setError('Failed to download data');
    }
  };

  const handleDeleteAccount = async () => {
    const reason = (document.getElementById('deletionReason') as HTMLTextAreaElement)?.value;
    const password = (document.getElementById('deletionPassword') as HTMLInputElement)?.value;

    if (!reason || !password) {
      setError('Please provide both deletion reason and password');
      return;
    }

    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      
      const response = await fetch('/api/supplier/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supplierId}` // Using supplierId as token - adjust based on your auth
        },
        body: JSON.stringify({ reason, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message);
        // Redirect to login page after successful deletion request
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit deletion request');
      }
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      setError('Failed to submit deletion request');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChangePassword = () => {
    setIsChangePasswordOpen(true);
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="text-sm text-[var(--gray-600)] mt-1">Manage your account preferences and business settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn-primary btn-md min-w-[120px] flex items-center justify-center"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-[var(--error-red-light)] border border-[var(--error-red-border)] rounded-lg p-4">
          <p className="text-[var(--error-red)]">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-[var(--success-green-light)] border border-[var(--success-green-border)] rounded-lg p-4">
          <p className="text-[var(--success-green)]">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Settings */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[var(--gray-300)] rounded-lg p-6">
            <h2 className="section-header mb-6">Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--gray-300)]">
                <div>
                  <p className="font-medium text-[var(--navy-blue)]">Email Notifications</p>
                  <p className="text-sm text-[var(--gray-600)]">Receive important updates via email</p>
                </div>
                <label
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-[var(--primary-teal)]' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle email notifications"
                >
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications ?? false}
                    onChange={() => handleToggle('emailNotifications')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--gray-300)]">
                <div>
                  <p className="font-medium text-[var(--navy-blue)]">Order Notifications</p>
                  <p className="text-sm text-[var(--gray-600)]">Alerts for new orders and status changes</p>
                </div>
                <label
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.orderNotifications ? 'bg-[var(--primary-teal)]' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle order notifications"
                >
                  <input
                    type="checkbox"
                    checked={settings.orderNotifications ?? false}
                    onChange={() => handleToggle('orderNotifications')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.orderNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--gray-300)]">
                <div>
                  <p className="font-medium text-[var(--navy-blue)]">Low Stock Alerts</p>
                  <p className="text-sm text-[var(--gray-600)]">Get notified when inventory is running low</p>
                </div>
                <label
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.lowStockAlerts ? 'bg-[var(--primary-teal)]' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle low stock alerts"
                >
                  <input
                    type="checkbox"
                    checked={settings.lowStockAlerts ?? false}
                    onChange={() => handleToggle('lowStockAlerts')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.lowStockAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--gray-300)]">
                <div>
                  <p className="font-medium text-[var(--navy-blue)]">Review Notifications</p>
                  <p className="text-sm text-[var(--gray-600)]">Alerts for new customer reviews</p>
                </div>
                <label
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.reviewNotifications ? 'bg-[var(--primary-teal)]' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle review notifications"
                >
                  <input
                    type="checkbox"
                    checked={settings.reviewNotifications ?? false}
                    onChange={() => handleToggle('reviewNotifications')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reviewNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[var(--navy-blue)]">Marketing Emails</p>
                  <p className="text-sm text-[var(--gray-600)]">Receive promotional offers and updates</p>
                </div>
                <label
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.marketingEmails ? 'bg-[var(--primary-teal)]' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle marketing emails"
                >
                  <input
                    type="checkbox"
                    checked={settings.marketingEmails ?? false}
                    onChange={() => handleToggle('marketingEmails')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[var(--gray-300)] rounded-lg p-6">
            <h2 className="section-header mb-6">Business Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  Default Shipping Method
                </label>
                <select
                  value={settings.defaultShippingMethod}
                  onChange={(e) => handleSelect('defaultShippingMethod', e.target.value)}
                  className="select-field"
                  aria-label="Select default shipping method"
                >
                  <option value="standard">Standard Shipping</option>
                  <option value="express">Express Shipping</option>
                  <option value="pickup">Store Pickup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  Return Policy
                </label>
                <select
                  value={settings.returnPolicy}
                  onChange={(e) => handleSelect('returnPolicy', e.target.value)}
                  className="select-field"
                  aria-label="Select return policy"
                >
                  <option value="7-days">7 Days</option>
                  <option value="15-days">15 Days</option>
                  <option value="30-days">30 Days</option>
                  <option value="no-returns">No Returns</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-[#e2d4b7]">
                <div>
                  <p className="font-medium text-[#1f3b2c]">Auto-confirm Orders</p>
                  <p className="text-sm text-[#6b7280]">Automatically accept new orders</p>
                </div>
                <label
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoConfirmOrders ? 'bg-[#1f3b2c]' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle auto-confirm orders"
                >
                  <input
                    type="checkbox"
                    checked={settings.autoConfirmOrders ?? false}
                    onChange={() => handleToggle('autoConfirmOrders')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoConfirmOrders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[#1f3b2c]">Tax Inclusive Prices</p>
                  <p className="text-sm text-[#6b7280]">Show prices including tax</p>
                </div>
                <label
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.taxInclusive ? 'bg-[#1f3b2c]' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle tax inclusive prices"
                >
                  <input
                    type="checkbox"
                    checked={settings.taxInclusive ?? false}
                    onChange={() => handleToggle('taxInclusive')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.taxInclusive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  GST Rate (%)
                </label>
                <select
                  value={(settings.taxRate * 100).toString()}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value || '0');
                    setSettings(prev => ({
                      ...prev,
                      taxRate: isNaN(value) ? 0 : value / 100,
                    }));
                  }}
                  className="select-field"
                  aria-label="Select GST rate"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-[var(--gray-300)] rounded-lg p-6">
        <h2 className="section-header mb-6">Security Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--gray-300)]">
              <div>
                <p className="font-medium text-[#1f3b2c]">Two-Factor Authentication</p>
                <p className="text-sm text-[#6b7280]">Add an extra layer of security</p>
              </div>
              <label
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.twoFactorAuth ? 'bg-[#1f3b2c]' : 'bg-gray-200'
                }`}
                aria-label="Toggle two-factor authentication"
              >
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth ?? false}
                  onChange={() => handleToggle('twoFactorAuth')}
                  className="sr-only"
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Session Timeout
              </label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => handleSelect('sessionTimeout', e.target.value)}
                className="select-field"
                aria-label="Select session timeout"
              >
                <option value="1h">1 Hour</option>
                <option value="8h">8 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <button
              className="w-full btn-secondary btn-md"
              aria-label="Change password"
              onClick={handleOpenChangePassword}
            >
              Change Password
            </button>
            <button
              className="w-full btn-secondary btn-md"
              aria-label="Download my data"
              onClick={handleDownloadData}
            >
              Download My Data
            </button>
                      </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <button
                className="text-sm text-[var(--gray-500)] hover:text-[var(--gray-700)]"
                onClick={() => !changingPassword && setIsChangePasswordOpen(false)}
              >
                Close
              </button>
            </div>

            {changePasswordError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {changePasswordError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[var(--gray-700)]">
                  Current Password
                </label>
                <input
                  type="password"
                  className="input input-md w-full"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changingPassword}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-[var(--gray-700)]">
                  New Password
                </label>
                <input
                  type="password"
                  className="input input-md w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changingPassword}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                className="btn-secondary btn-md"
                onClick={() => !changingPassword && setIsChangePasswordOpen(false)}
                disabled={changingPassword}
              >
                Cancel
              </button>
              <button
                className="btn-primary btn-md min-w-[120px] flex items-center justify-center"
                onClick={handleSubmitChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Section */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <div className="border-b border-red-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
          <p className="text-sm text-gray-800 mt-1">
            Permanently delete your supplier account and all associated data. This action cannot be undone.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l4.577 8.094c.752 1.344 2.722 1.344 3.486 0l4.577-8.094c.752-1.344 2.722-1.344 3.486 0zM8 4.75a.75.75 0 100-1.5 0v8.5a.75.75 0 001.5 0v-8.5zM12 17.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75V9a.75.75 0 01.75-.75h6.75a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Deleting your account will permanently remove:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>All your products and inventory</li>
                  <li>All order history and transactions</li>
                  <li>All customer data and reviews</li>
                  <li>Your business documents and verification status</li>
                  <li>Any pending orders or transactions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Reason for deletion (required)
            </label>
            <textarea
              id="deletionReason"
              rows={3}
              className="input input-md w-full"
              placeholder="Please tell us why you want to delete your account..."
              style={{ color: '#000' }}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Confirm with password (required)
            </label>
            <input
              type="password"
              id="deletionPassword"
              className="input input-md w-full max-w-md"
              placeholder="Enter your password to confirm deletion"
              style={{ color: '#000' }}
            />
          </div>

          <div className="mt-6">
            <button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
