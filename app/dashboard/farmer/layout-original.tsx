"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import HeaderWrapper from '../../components/Header/HeaderWrapper';
import { LayoutDashboard, FileText, Layers, ScrollText, ShoppingBag, CloudSun, Store, TrendingUp } from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navItems: NavSection[] = [
  {
    title: 'Management',
    items: [
      { label: 'Overview', href: '/dashboard/farmer', icon: LayoutDashboard },
      { label: 'KYC Documents', href: '/dashboard/farmer/documents', icon: FileText },
      { label: 'Land Integration', href: '/dashboard/farmer/land', icon: Layers },
      { label: 'Government Schemes', href: '/dashboard/farmer/schemes', icon: ScrollText },
    ]
  },
  {
    title: 'Tools',
    items: [
      { label: 'Marketplace', href: '/dashboard/farmer/marketplace', icon: Store },
      { label: 'Crop Price Prediction', href: '/dashboard/farmer/crop-price-prediction', icon: TrendingUp },
      { label: 'Weather', href: '/dashboard/farmer/weather', icon: CloudSun },
    ]
  }
];

export default function FarmerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const buildHref = (baseHref: string) => {
    if (!userId || !baseHref.startsWith('/dashboard/farmer')) return baseHref;
    const url = new URL(baseHref, 'http://dummy');
    url.searchParams.set('userId', userId);
    return url.pathname + '?' + url.searchParams.toString();
  };

  // Special handling for marketplace to always include userId
  const getMarketplaceHref = () => {
    if (userId) {
      return `/dashboard/farmer/marketplace?userId=${userId}`;
    }
    return '/dashboard/farmer/marketplace';
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-[#e5e7eb] shadow-xl flex-col fixed left-0 top-0 bottom-0 overflow-y-auto pt-4">
        {/* Sidebar Header */}
        <div className="px-5 py-6 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#166534] to-[#15803d] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f3b2c]">AgriLink</h2>
              <p className="text-xs text-[#6b7280]">Farmer Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {navItems.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isOverview = item.href === '/dashboard/farmer';
                  const isActive = isOverview
                    ? pathname === item.href
                    : item.href !== '/dashboard/farmer/marketplace' && pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href === '/dashboard/farmer/marketplace' ? getMarketplaceHref() : buildHref(item.href)}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#166534] to-[#15803d] text-white shadow-md'
                            : 'text-[#374151] hover:bg-[#f0fdf4] hover:text-[#166534]'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg transition-all ${
                          isActive
                            ? 'bg-white/20'
                            : 'bg-[#f0fdf4] group-hover:bg-white group-hover:shadow-sm'
                        }`}>
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#166534]'}`} />
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Quick Stats */}
        <div className="px-3 py-4 border-t border-[#e5e7eb] bg-white/50">
          <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-[#d97706] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[11px] font-semibold text-[#92400e] leading-tight">Quick Tip</span>
            </div>
            <p className="text-[11px] text-[#92400e] leading-tight">
              Check weather updates daily for better crop planning!
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen overflow-hidden">
        <HeaderWrapper />
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}