'use client';

import { FiSettings, FiSave, FiLock } from 'react-icons/fi';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure platform rules, system preferences, roles, and security parameters.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden p-6 max-w-2xl space-y-6">
        <h3 className="text-lg font-bold text-[#232F3E] border-b border-gray-100 pb-3 flex items-center gap-2">
          <FiLock /> Admin Credentials
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#232F3E] mb-1">
              Admin Email Address
            </label>
            <input
              type="email"
              value="admin@bpfis.com"
              className="appearance-none rounded-xl block w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 text-sm focus:outline-none cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        <div className="p-12 text-center text-gray-500 border-t border-gray-100">
          <div className="mx-auto w-12 h-12 bg-[#E6F7F7] text-[#1A9B9A] rounded-xl flex items-center justify-center mb-4">
            <FiSettings className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#232F3E] mb-1">Settings Foundation</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">This module will allow admins to update credentials, configure blockchain providers, and adjust system limits in the next phase.</p>
        </div>
      </div>
    </div>
  );
}
