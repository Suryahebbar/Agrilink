"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import HeaderWrapper from '../../components/Header/HeaderWrapper';
import { LayoutDashboard, Layers, ScrollText, CloudSun, Store, TrendingUp, Lock, Users, Calendar, ShieldCheck } from '../../../components/ui/icons';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export default function FarmerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Check land verification status on mount/update
  useEffect(() => {
    if (!userId) {
      setCheckingVerification(false);
      return;
    }

    const checkVerification = async () => {
      try {
        const res = await fetch(`/api/farmer/land-details?userId=${userId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data && data.data.length > 0) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } catch (err) {
        console.error('Verification check error:', err);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [userId, pathname]); // Re-run check on page transitions in case land was just verified

  const buildHref = (baseHref: string) => {
    if (!userId || !baseHref.startsWith('/dashboard/farmer')) return baseHref;
    const url = new URL(baseHref, 'http://dummy');
    url.searchParams.set('userId', userId);
    return url.pathname + '?' + url.searchParams.toString();
  };

  const getMarketplaceHref = () => {
    if (userId) {
      return `/dashboard/farmer/marketplace?userId=${userId}`;
    }
    return '/dashboard/farmer/marketplace';
  };

  // Dynamically compute nav items based on verification state
  const navItems: NavSection[] = [
    {
      title: 'Management',
      items: [
        { label: 'Overview', href: '/dashboard/farmer', icon: LayoutDashboard },
        {
          label: isVerified ? 'Land Details' : 'Land Verification',
          href: '/dashboard/farmer/land/details',
          icon: Layers
        },
        { label: 'Digital Farm Pooling', href: '/dashboard/farmer/pooling', icon: Users },
        { label: 'Farm Management', href: '/dashboard/farmer/farm-management', icon: Calendar },
        { label: 'Crop Insurance', href: '/dashboard/farmer/insurance', icon: ShieldCheck },
        { label: 'Farm Finance & P&L', href: '/dashboard/farmer/finance', icon: TrendingUp },
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

  // Determine if current page is allowed without verification
  // Overview, Land Details/Verification, and the Marketplace are accessible without land verification
  const isPageAllowed =
    pathname === '/dashboard/farmer' ||
    pathname === '/dashboard/farmer/land/details' ||
    pathname.startsWith('/dashboard/farmer/marketplace');
  const showLockedOverlay = !checkingVerification && !isVerified && !isPageAllowed;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-[#e5e7eb] shadow-xl flex flex-col fixed left-0 top-0 bottom-0 overflow-y-auto pt-4 z-20">
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

                  // Disable if checking verification OR if not verified and it is not overview or details
                  const isDisabled = !checkingVerification && !isVerified && item.href !== '/dashboard/farmer' && item.href !== '/dashboard/farmer/land/details';

                  return (
                    <li key={item.href}>
                      {isDisabled ? (
                        <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-gray-400 cursor-not-allowed opacity-60 bg-gray-50/50">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-gray-200">
                              <Icon className="h-4 w-4 text-gray-400" />
                            </div>
                            <span className="font-medium text-sm">{item.label}</span>
                          </div>
                          <Lock className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      ) : (
                        <Link
                          href={item.href === '/dashboard/farmer/marketplace' ? getMarketplaceHref() : buildHref(item.href)}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${isActive
                              ? 'bg-gradient-to-r from-[#166534] to-[#15803d] text-white shadow-md'
                              : 'text-[#374151] hover:bg-[#f0fdf4] hover:text-[#166534]'
                            }`}
                        >
                          <div className={`p-1.5 rounded-lg transition-all ${isActive
                              ? 'bg-white/20'
                              : 'bg-[#f0fdf4] group-hover:bg-white group-hover:shadow-sm'
                            }`}>
                            <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#166534]'}`} />
                          </div>
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Quick Tips */}
        <div className="px-3 py-4 border-t border-[#e5e7eb] bg-white/50">
          <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-[#d97706] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[11px] font-semibold text-[#92400e] leading-tight">Quick Tip</span>
            </div>
            <p className="text-[11px] text-[#92400e] leading-tight">
              {isVerified ? 'Check weather updates daily for better crop planning!' : 'Please verify your land records to unlock all portals.'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen overflow-hidden">
        <HeaderWrapper />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto relative min-h-[500px]">
            {checkingVerification ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-gray-500">Checking account configuration...</p>
              </div>
            ) : showLockedOverlay ? (
              /* Beautiful Blocked Overlay Screen */
              <div className="flex flex-col items-center justify-center min-h-[450px] bg-white/70 backdrop-blur-md border border-[#e2d4b7] rounded-3xl p-10 text-center shadow-xl animate-fadeIn">
                <div className="w-16 h-16 bg-[#166534]/10 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8 text-[#166534]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1f3b2c] mb-3">Verification Required</h2>
                <p className="text-sm text-[#6b7280] max-w-md mb-8 leading-relaxed">
                  Access to this portal is restricted. You must complete your **Land Verification** to link your digital RTC records before you can access the marketplace, predictive tools, and schemes.
                </p>
                <Link
                  href={buildHref('/dashboard/farmer/land/details')}
                  className="rounded-xl bg-[#166534] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#14532d] transition-all active:scale-[0.98]"
                >
                  Verify Land Now
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}