"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { withSupplierAuth } from '@/lib/supplier-auth';

// Create context for supplier ID
interface SupplierContextType {
  supplierId: string | null;
  loading: boolean;
}

const SupplierIdContext = createContext<SupplierContextType | undefined>(undefined);

export const useSupplierId = () => {
  const context = useContext(SupplierIdContext);
  if (context === undefined) {
    throw new Error('useSupplierId must be used within SupplierLayout');
  }
  return context.supplierId;
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard/seller', current: true },
  { name: 'Products', href: '/dashboard/seller/products', current: false },
  { name: 'Inventory', href: '/dashboard/seller/inventory', current: false },
  { name: 'Orders', href: '/dashboard/seller/orders', current: false },
  { name: 'Earnings & Payouts', href: '/dashboard/seller/earnings', current: false },
  { name: 'Ads & Promotions', href: '/dashboard/seller/ads', current: false },
  { name: 'Profile', href: '/dashboard/seller/profile', current: false },
];

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Load supplier ID on mount
  useEffect(() => {
    let isMounted = true;

    const loadSupplierId = async () => {
      try {
        const response = await fetch('/api/supplier', withSupplierAuth());
        if (response.ok) {
          const data = await response.json();
          const id = data.supplier?._id || data.seller?._id;
          if (isMounted) {
            if (id) {
              setSupplierId(id);
            } else if (data.needsSetup) {
              router.push('/dashboard/supplier/setup');
              return;
            }
          }
        } else if (response.status === 401) {
          if (isMounted) {
            setSupplierId(null);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn('Could not load supplier profile:', errorData);
        }
      } catch (error) {
        console.error('Error loading supplier ID:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSupplierId();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const isActive = (href: string) => {
    const normalizedPath = pathname.replace(/^\/dashboard\/supplier/, '/dashboard/seller');
    const normalizedHref = href.replace(/^\/dashboard\/supplier/, '/dashboard/seller');
    if (normalizedHref === '/dashboard/seller') {
      return normalizedPath === normalizedHref;
    }
    return normalizedPath.startsWith(normalizedHref);
  };

  const handleLogout = () => {
    // Clear any auth tokens or session data
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerInfo');
    
    // Redirect to login page
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-blue-600"></div>
      </div>
    );
  }

  if (!loading && !supplierId && !pathname.includes('/setup') && !pathname.includes('/register')) {
    return (
      <SupplierIdContext.Provider value={{ supplierId, loading }}>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Supplier Account Required</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              You are currently not signed in to a supplier account, or your profile setup is still pending.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login?role=supplier"
                className="w-full py-2.5 px-4 rounded-xl bg-[#1A9B9A] text-white text-xs font-bold hover:bg-[#147878] transition-colors"
              >
                Sign In as Supplier
              </Link>
              <Link
                href="/dashboard/supplier/setup"
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Complete Profile Setup
              </Link>
            </div>
          </div>
        </div>
      </SupplierIdContext.Provider>
    );
  }

  return (
    <SupplierIdContext.Provider value={{ supplierId, loading }}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--gray-300)]">
              <h1 className="text-lg font-semibold text-[var(--navy-blue)]">Seller Dashboard</h1>
            <button
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-[var(--navy-blue)] text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="sidebar hidden lg:flex lg:flex-col">
        <div className="flex flex-col flex-grow bg-white">
          <div className="flex h-16 items-center px-6 border-b border-[var(--gray-300)]">
            <h1 className="text-lg font-semibold text-[var(--navy-blue)]">Seller Dashboard</h1>
          </div>
          <nav className="flex-1 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="sidebar-item-text">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <div className="top-navbar">
          <div className="flex h-16 items-center justify-between w-full px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white hover:text-[var(--primary-teal-light)]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo/Brand - centered */}
            <div className="flex-1 flex justify-center lg:justify-start lg:flex-none">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-[var(--primary-teal)] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-white hidden lg:block">Agrilink</span>
              </div>
            </div>

            {/* Right side - My Profile and Logout buttons */}
            <div className="flex items-center space-x-3">
              {/* My Profile button */}
              <button 
                onClick={() => router.push('/dashboard/supplier/profile')}
                className="px-4 py-2 text-sm font-medium text-white border border-white rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                My Profile
              </button>

              {/* Logout button */}
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary-teal)] rounded-md hover:bg-[var(--primary-teal-dark)] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="bg-[#fffaf1] min-h-screen pt-[60px]">
          <div className="py-6">
            <div className="max-w-[var(--max-width-content)] mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
      </div>
    </SupplierIdContext.Provider>
  );
} 
