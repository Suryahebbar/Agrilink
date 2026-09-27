'use client';

import { 
  FiUsers, 
  FiCheckCircle, 
  FiFolder, 
  FiShield, 
  FiFileText, 
  FiDatabase, 
  FiDollarSign, 
  FiHeart, 
  FiActivity, 
  FiPlusCircle, 
  FiEye, 
  FiLayers,
  FiClock,
  FiTruck,
  FiPackage,
  FiAlertTriangle
} from 'react-icons/fi';
import Link from 'next/link';
import StatCard from './components/StatCard';
import RecentActivities from './components/RecentActivities';
import { useDashboardData } from './hooks/useDashboardData';

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useDashboardData();

  const overviewCards = [
    {
      title: "Total Farmers",
      value: stats?.totalFarmers?.toLocaleString() ?? "0",
      icon: <FiUsers className="h-6 w-6 text-indigo-600" />,
      color: "bg-indigo-500",
    },
    {
      title: "Total Suppliers",
      value: stats?.totalSuppliers?.toLocaleString() ?? "0",
      icon: <FiTruck className="h-6 w-6 text-purple-600" />,
      color: "bg-purple-500",
    },
    {
      title: "Pending Legal Approvals",
      value: stats?.pendingSupplierApprovals?.toLocaleString() ?? "0",
      icon: <FiAlertTriangle className="h-6 w-6 text-amber-600" />,
      color: "bg-amber-500",
    },
    {
      title: "Verified Suppliers",
      value: stats?.verifiedSuppliers?.toLocaleString() ?? "0",
      icon: <FiCheckCircle className="h-6 w-6 text-emerald-600" />,
      color: "bg-emerald-500",
    },
    {
      title: "Active Agreements",
      value: stats?.activeFarmPools?.toLocaleString() ?? "0",
      icon: <FiFileText className="h-6 w-6 text-blue-600" />,
      color: "bg-blue-500",
    },
    {
      title: "Catalog Products",
      value: stats?.totalSupplierProducts?.toLocaleString() ?? "0",
      icon: <FiPackage className="h-6 w-6 text-rose-600" />,
      color: "bg-rose-500",
    },
    {
      title: "Supplier Orders",
      value: stats?.totalSupplierOrders?.toLocaleString() ?? "0",
      icon: <FiLayers className="h-6 w-6 text-cyan-600" />,
      color: "bg-cyan-500",
    },
    {
      title: "Marketplace Revenue",
      value: stats?.revenueOverview !== undefined ? `₹${stats.revenueOverview.toLocaleString()}` : "₹0",
      icon: <FiDollarSign className="h-6 w-6 text-teal-600" />,
      color: "bg-teal-500",
    },
  ];

  const quickActions = [
    {
      title: "Supplier Legal Verification",
      description: "Review statutory trade licenses, GSTIN, FCO/Seed permits, and KYC approvals.",
      href: "/admin/suppliers",
      icon: <FiTruck className="h-5 w-5 text-white" />,
      btnColor: "bg-[#1A9B9A] hover:bg-[#147878]",
    },
    {
      title: "Product Compliance Oversight",
      description: "Inspect agricultural inputs, seed/fertilizer catalog standards, and chemical bans.",
      href: "/admin/products",
      icon: <FiPackage className="h-5 w-5 text-white" />,
      btnColor: "bg-[#232F3E] hover:bg-[#37475A]",
    },
    {
      title: "Audit Logs",
      description: "Review all system logs, supplier approvals, and administrative actions.",
      href: "/admin/audit-logs",
      icon: <FiActivity className="h-5 w-5 text-white" />,
      btnColor: "bg-[#232F3E] hover:bg-[#37475A]",
    },
    {
      title: "Agreement Management",
      description: "Review legal documents, supplier seller terms, and digital contracts.",
      href: "/admin/agreements",
      icon: <FiFileText className="h-5 w-5 text-white" />,
      btnColor: "bg-[#232F3E] hover:bg-[#37475A]",
    },
    {
      title: "Blockchain Records",
      description: "Monitor stamped smart contracts, immutable block heights, and hash proofs.",
      href: "/admin/blockchain",
      icon: <FiDatabase className="h-5 w-5 text-white" />,
      btnColor: "bg-[#232F3E] hover:bg-[#37475A]",
    },
    {
      title: "Manage Farmers",
      description: "Review applications, digital assets, and land registrations.",
      href: "/admin/farmers",
      icon: <FiUsers className="h-5 w-5 text-white" />,
      btnColor: "bg-[#232F3E] hover:bg-[#37475A]",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">Admin Overview</h1>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <StatCard
              key={i}
              title="Loading..."
              value="..."
              icon={<FiUsers className="h-6 w-6 text-gray-400" />}
              color="bg-gray-200"
              isLoading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-[#D13212] font-bold text-lg">Error Loading Dashboard</h3>
        <p className="text-red-600 text-sm mt-1">{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
        <p className="text-red-600 text-sm mt-2">Please refresh the page or check your database connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time statistics and activity logs across the platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {overviewCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            isLoading={false}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#232F3E]">Recent Administrative Activities</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Live Logs
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
            <RecentActivities activities={stats?.recentActivities || []} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <h2 className="text-lg font-bold text-[#232F3E] mb-6">Quick Actions</h2>
          <div className="space-y-4">
            {quickActions.map((action, index) => (
              <div key={index} className="p-4 rounded-xl border border-gray-100 hover:border-[#1A9B9A]/30 hover:bg-[#E6F7F7]/10 transition-all flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${action.btnColor}  shrink-0`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#232F3E]">{action.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.description}</p>
                  <Link 
                    href={action.href} 
                    className="inline-flex items-center text-xs font-bold text-[#1A9B9A] hover:text-[#147878] mt-2 transition-colors"
                  >
                    Go to panel &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
