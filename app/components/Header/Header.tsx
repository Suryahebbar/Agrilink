"use client";

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [farmerName, setFarmerName] = useState<string>('');

  const isDashboard = pathname?.startsWith('/dashboard');
  const isFarmer = pathname?.startsWith('/dashboard/farmer');
  const isSupplier = pathname?.startsWith('/dashboard/supplier');
  const userId = searchParams.get('userId');

  const buildDashboardHref = (baseHref: string) => {
    if (!userId) return baseHref;
    const url = new URL(baseHref, 'http://dummy');
    url.searchParams.set('userId', userId);
    return url.pathname + '?' + url.searchParams.toString();
  };

  // Fetch farmer profile data to get the name
  useEffect(() => {
    if (isFarmer && userId) {
      fetchFarmerProfile();
    }
  }, [isFarmer, userId]);

  const fetchFarmerProfile = async () => {
    try {
      const response = await fetch(`/api/farmer/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const name = data.profile?.verifiedName || data.profile?.aadhaarKannadaName || data.profile?.name || 'Farmer';
        setFarmerName(name);
      }
    } catch (error) {
      console.error('Failed to fetch farmer profile:', error);
    }
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <header className="bg-[#f7f0de] z-40">
      <div className="px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              href={isDashboard ? (isFarmer ? buildDashboardHref('/dashboard/farmer') : isSupplier ? buildDashboardHref('/dashboard/supplier') : '/') : '/'} 
              className="flex items-center gap-2 group"
            >
              <div className="flex items-center justify-center">
                <Link2 className="w-6 h-6 text-[#166534] rotate-45" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#166534] to-[#15803d] bg-clip-text text-transparent">
                AgriLink
              </span>
            </Link>
          </div>

          {/* Public Navigation */}
          {!isDashboard && (
            <nav className="hidden md:ml-6 md:flex md:items-center md:space-x-2">
              <Link 
                href="/#features" 
                className="text-[#374151] hover:text-[#166534] hover:bg-[#f0fdf4] px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Features
              </Link>
              <Link 
                href="/login" 
                className="text-[#374151] hover:text-[#166534] hover:bg-[#f0fdf4] px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="ml-2 bg-gradient-to-r from-[#166534] to-[#15803d] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
              >
                Register
              </Link>
            </nav>
          )}

          {/* Dashboard Navigation */}
          {isDashboard && (
            <nav className="hidden md:ml-6 md:flex md:items-center md:space-x-3">
              {/* Dashboard Badge */}
              <div className="px-4 py-2 bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] rounded-lg border border-[#bbf7d0]">
                <span className="text-sm font-semibold text-[#166534]">
                  {isFarmer && '🌾 Farmer Dashboard'}
                  {isSupplier && '📦 Supplier Dashboard'}
                  {!isFarmer && !isSupplier && 'Dashboard'}
                </span>
              </div>

              {isFarmer && (
                <Link
                  href={buildDashboardHref('/dashboard/farmer/profile')}
                  className="flex flex-col items-start text-[#374151] hover:text-[#166534] hover:bg-[#f0fdf4] px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Profile
                  </div>
                  {farmerName && (
                    <span className="text-xs text-[#6b7280] mt-1">{farmerName}</span>
                  )}
                </Link>
              )}

              {isSupplier && (
                <>
                  <Link
                    href={buildDashboardHref('/dashboard/supplier')}
                    className="text-[#374151] hover:text-[#166534] hover:bg-[#f0fdf4] px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Overview
                  </Link>
                  <Link
                    href={buildDashboardHref('/dashboard/supplier')}
                    className="flex items-center gap-2 text-[#374151] hover:text-[#166534] hover:bg-[#f0fdf4] px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="ml-2 flex items-center gap-2 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}