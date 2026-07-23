'use client';

import { FiDatabase, FiSearch, FiRefreshCw } from 'react-icons/fi';

export default function BlockchainRecords() {
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">Blockchain Records</h1>
        <p className="text-sm text-gray-500 mt-1">Review decentralized smart contract states, transaction proofs, and integrity verifications.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FiSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by transaction hash or contract address..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:border-transparent text-sm"
              disabled
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors" disabled>
            <FiRefreshCw /> Sync Ledger
          </button>
        </div>

        <div className="p-12 text-center text-gray-500">
          <div className="mx-auto w-12 h-12 bg-[#E6F7F7] text-[#1A9B9A] rounded-xl flex items-center justify-center mb-4">
            <FiDatabase className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#232F3E] mb-1">Blockchain Records Foundation</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">This module will display verified transactions, block numbers, gas fees, and cryptographically signed agreements in the next phase.</p>
        </div>
      </div>
    </div>
  );
}
