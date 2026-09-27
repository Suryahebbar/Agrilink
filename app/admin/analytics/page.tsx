'use client';

import { FiBarChart2, FiDownload, FiCalendar } from 'react-icons/fi';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">Analytics & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Review dashboard performance, growth figures, crop yields, and financial logs.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors" disabled>
              <FiCalendar /> Last 30 Days
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-xl text-sm font-bold transition-all" disabled>
            <FiDownload /> Export PDF Report
          </button>
        </div>

        <div className="p-12 text-center text-gray-500">
          <div className="mx-auto w-12 h-12 bg-[#E6F7F7] text-[#1A9B9A] rounded-xl flex items-center justify-center mb-4">
            <FiBarChart2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#232F3E] mb-1">Analytics Foundation</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">This module will host charts, data visualizations, region-wise distributions, and seasonal reports in the next phase.</p>
        </div>
      </div>
    </div>
  );
}
