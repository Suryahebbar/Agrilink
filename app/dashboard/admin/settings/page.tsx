"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemSettings {
  platform: {
    name: string;
    version: string;
    maintenance: boolean;
    maintenanceMessage: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    twoFactorAuth: boolean;
  };
  features: {
    farmerRegistration: boolean;
    supplierApproval: boolean;
    documentVerification: boolean;
  };
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        setError('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        // Settings saved successfully
      } else {
        setError('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">No settings available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Configure system-wide settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
            <input
              type="text"
              value={settings.platform.name}
              onChange={(e) => setSettings({
                ...settings,
                platform: { ...settings.platform, name: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
            <input
              type="text"
              value={settings.platform.version}
              onChange={(e) => setSettings({
                ...settings,
                platform: { ...settings.platform, version: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenance"
              checked={settings.platform.maintenance}
              onChange={(e) => setSettings({
                ...settings,
                platform: { ...settings.platform, maintenance: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="maintenance" className="ml-2 block text-sm text-gray-900">
              Enable Maintenance Mode
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Message</label>
            <textarea
              value={settings.platform.maintenanceMessage}
              onChange={(e) => setSettings({
                ...settings,
                platform: { ...settings.platform, maintenanceMessage: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailEnabled"
              checked={settings.notifications.emailEnabled}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, emailEnabled: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emailEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Email Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smsEnabled"
              checked={settings.notifications.smsEnabled}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, smsEnabled: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="smsEnabled" className="ml-2 block text-sm text-gray-900">
              Enable SMS Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pushEnabled"
              checked={settings.notifications.pushEnabled}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, pushEnabled: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="pushEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Push Notifications
            </label>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
            <input
              type="number"
              value={settings.security.passwordMinLength}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, passwordMinLength: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactorAuth"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, twoFactorAuth: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-900">
              Require Two-Factor Authentication
            </label>
          </div>
        </div>
      </div>

      {/* Feature Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="farmerRegistration"
              checked={settings.features.farmerRegistration}
              onChange={(e) => setSettings({
                ...settings,
                features: { ...settings.features, farmerRegistration: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="farmerRegistration" className="ml-2 block text-sm text-gray-900">
              Enable Farmer Registration
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="supplierApproval"
              checked={settings.features.supplierApproval}
              onChange={(e) => setSettings({
                ...settings,
                features: { ...settings.features, supplierApproval: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="supplierApproval" className="ml-2 block text-sm text-gray-900">
              Require Supplier Approval
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="documentVerification"
              checked={settings.features.documentVerification}
              onChange={(e) => setSettings({
                ...settings,
                features: { ...settings.features, documentVerification: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="documentVerification" className="ml-2 block text-sm text-gray-900">
              Enable Document Verification
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}
    </div>
  );
}
