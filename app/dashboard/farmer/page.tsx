'use client';

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFarmerActivities } from '@/lib/hooks/useFarmerActivities';

export default function FarmerOverviewPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [stats] = useState({
    totalLand: '24.5',
    activeCrops: 3,
    monthlyRevenue: '₹45,250',
    pendingAgreements: 2
  });

  // Fetch recent activities for the current user
  const { activities: recentActivities, loading, error, refresh } = useFarmerActivities(userId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]">
      {/* Hero Section with Background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#166534] to-[#15803d] rounded-b-3xl mb-8">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative px-6 py-12 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Welcome back, Farmer! 🌾
                </h1>
                <p className="text-[#bbf7d0] text-lg">
                  Your farm is thriving. Here's what's happening today.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <p className="text-[#bbf7d0] text-sm">Today's Date</p>
                <p className="text-white font-semibold text-lg">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a
            href="/dashboard/farmer/documents"
            className="group bg-white rounded-xl p-6 shadow-lg border border-[#e5e7eb] hover:shadow-xl hover:border-[#166534] transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-[#166534] to-[#15803d] rounded-lg p-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#1f3b2c] mb-2">Complete Your Profile</h3>
                <p className="text-sm text-[#6b7280] mb-4">
                  Upload your KYC documents to unlock all features, including land integration.
                </p>
                <span className="text-sm font-medium text-[#166534] group-hover:underline">
                  Upload Documents →
                </span>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/farmer/land"
            className="group bg-white rounded-xl p-6 shadow-lg border border-[#e5e7eb] hover:shadow-xl hover:border-[#d97706] transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-[#d97706] to-[#ea580c] rounded-lg p-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#1f3b2c] mb-2">Land Integration</h3>
                <p className="text-sm text-[#6b7280] mb-4">
                  View and manage your land integration agreements with other farmers.
                </p>
                <span className="text-sm font-medium text-[#d97706] group-hover:underline">
                  Manage Agreements →
                </span>
              </div>
            </div>
          </a>

          <a
            href={`/dashboard/farmer/crop-price-prediction${userId ? `?userId=${userId}` : ''}`}
            className="group bg-white rounded-xl p-6 shadow-lg border border-[#e5e7eb] hover:shadow-xl hover:border-[#1e40af] transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] rounded-lg p-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#1f3b2c] mb-2">Market Intelligence</h3>
                <p className="text-sm text-[#6b7280] mb-4">
                  Get AI-powered crop price predictions to maximize your profit.
                </p>
                <span className="text-sm font-medium text-[#1e40af] group-hover:underline">
                  View Predictions →
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* Recent Activity & Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#e5e7eb]">
            <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activity
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#f9fafb] rounded-lg animate-pulse">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">
                <p>Failed to load activities</p>
                <button 
                  onClick={refresh}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const statusColor = activity.status === 'success' 
                    ? 'bg-[#166534]' 
                    : activity.status === 'failed' 
                      ? 'bg-[#dc2626]' 
                      : 'bg-[#d97706]';
                      
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#f9fafb] rounded-lg hover:bg-[#f3f4f6] transition-colors">
                      <div className={`w-2 h-2 ${statusColor} rounded-full mt-2`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1f3b2c] truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-[#6b7280] truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-[#6b7280] mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No recent activities found</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-xl p-6 shadow-lg border border-[#fbbf24]">
            <h3 className="text-lg font-semibold text-[#92400e] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Pro Tips
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <p className="text-sm text-[#92400e]">
                  Consider diversifying crops this season to reduce risk and maximize returns.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <p className="text-sm text-[#92400e]">
                  Wheat prices are predicted to rise by 8% next month. Good time to harvest!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}