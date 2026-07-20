"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { withSupplierAuth } from '@/lib/supplier-auth';

// Create context for supplier ID
const SupplierIdContext = createContext<string | null>(null);

export const useSupplierId = () => {
  const context = useContext(SupplierIdContext);
  if (!context) {
    throw new Error('useSupplierId must be used within SupplierLayout');
  }
  return context;
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard/supplier', current: true },
  { name: 'Products', href: '/dashboard/supplier/products', current: false },
  { name: 'Inventory', href: '/dashboard/supplier/inventory', current: false },
  { name: 'Orders', href: '/dashboard/supplier/orders', current: false },
  // { name: 'Analytics', href: '/dashboard/supplier/analytics', current: false },
  //{ name: 'Reviews', href: '/dashboard/supplier/reviews', current: false },
  { name: 'Profile', href: '/dashboard/supplier/profile', current: false },
  // { name: 'Settings', href: '/dashboard/supplier/settings', current: false },
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
    const loadSupplierId = async () => {
      try {
        const response = await fetch('/api/supplier', withSupplierAuth());
        if (response.ok) {
          const data = await response.json();
          // Try both supplier and seller keys
          const id = data.supplier?._id || data.seller?._id;
          if (id) {
            setSupplierId(id);
          } else {
            console.error('No supplier ID found in response:', data);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to load supplier ID:', errorData);
        }
      } catch (error) {
        console.error('Error loading supplier ID:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSupplierId();
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard/supplier') {
      return pathname === href;
    }
    return pathname.startsWith(href);
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

  return (
    <SupplierIdContext.Provider value={supplierId}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--gray-300)]">
              <h1 className="text-lg font-semibold text-[var(--navy-blue)]">Supplier Portal</h1>
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
            <h1 className="text-lg font-semibold text-[var(--navy-blue)]">Supplier Portal</h1>
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
