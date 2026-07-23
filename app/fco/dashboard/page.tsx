'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiTrendingUp, FiUsers, FiClock, FiCheckSquare, FiLogOut, FiLink2 } from 'react-icons/fi';
import Link from 'next/link';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const handleLogout = () => {
    // Perform logout cleanups
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#fffaf1] flex flex-col">
      {/* Dedicated FCO Top Bar Navigation */}
      <header className="bg-[#f7f0de] border-b border-[#e2d4b7] z-40 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center gap-2">
                <FiLink2 className="w-6 h-6 text-[#166534] rotate-45" />
                <span className="text-2xl font-bold bg-gradient-to-r from-[#166534] to-[#15803d] bg-clip-text text-transparent">
                  AgriLink
                </span>
              </div>
            </div>

            {/* Portal Badge & Log Out */}
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] rounded-lg border border-[#bbf7d0]">
                <span className="text-sm font-semibold text-[#166534]">
                  🤝 FCO Officer Portal
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold leading-tight text-[#1f3b2c]">FCO Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage assigned farm groups, counselling sessions, and agreement verifications.</p>
        </div>

        {/* Workload Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Assigned Groups</p>
              <p className="text-3xl font-black text-[#1f3b2c] mt-1">4</p>
            </div>
            <div className="p-3 bg-emerald-50 text-[#166534] rounded-full">
              <FiUsers className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Pending Meetings</p>
              <p className="text-3xl font-black text-[#1f3b2c] mt-1">2</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
              <FiClock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Completed Counselling</p>
              <p className="text-3xl font-black text-[#1f3b2c] mt-1">12</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
              <FiCheckSquare className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Completed Agreements</p>
              <p className="text-3xl font-black text-[#1f3b2c] mt-1">8</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
              <FiTrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-12 text-center text-gray-500 border border-gray-200/60 rounded-2xl shadow-sm">
          <FiUsers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1f3b2c]">FCO Counseling & Workload Features</h3>
          <p className="text-sm text-gray-400 mt-1">Counselling sheets and assignment records will load here in the next phase.</p>
        </div>
      </main>
    </div>
  );
}

export default function FcoDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fffaf1] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#166534]"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
