'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { 
  FiLayout, 
  FiUsers, 
  FiFolder, 
  FiShield, 
  FiFileText, 
  FiDatabase, 
  FiBarChart2, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiChevronRight, 
  FiHome,
  FiActivity,
  FiTruck,
  FiPackage
} from 'react-icons/fi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: FiLayout },
  { label: 'Farmer Management', href: '/admin/farmers', icon: FiUsers },
  { label: 'Supplier Management', href: '/admin/suppliers', icon: FiTruck },
  { label: 'Product Compliance', href: '/admin/products', icon: FiPackage },
  { label: 'Farm Pool Management', href: '/admin/farm-pools', icon: FiFolder },
  { label: 'FCO Management', href: '/admin/fco', icon: FiShield },
  { label: 'Agreement Management', href: '/admin/agreements', icon: FiFileText },
  { label: 'Scheme Management', href: '/admin/schemes', icon: FiFileText },
  { label: 'Blockchain Records', href: '/admin/blockchain', icon: FiDatabase },
  { label: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FiActivity },
  { label: 'Settings', href: '/admin/settings', icon: FiSettings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (pathname === '/admin/login') return;

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/admin/me');
        if (response.ok) {
          const data = await response.json();
          setAuthenticated(data.authenticated);
          if (data.user) {
            setAdminUser(data.user);
          }
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (pathname === '/admin/login') return;

    if (!loading && !authenticated) {
      router.push('/admin/login');
    }
  }, [loading, authenticated, router, pathname]);

  // If it's the login page, render children directly without dashboard decoration or checks
  if (pathname === '/admin/login') {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f0de] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A9B9A] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!authenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', {
        method: 'POST',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Helper to generate Breadcrumbs
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter((p) => p && p !== 'admin');
    const breadcrumbs = [{ label: 'Admin', href: '/admin/dashboard' }];
    
    paths.forEach((path, index) => {
      const href = '/admin/' + paths.slice(0, index + 1).join('/');
      const label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex bg-gradient-to-br from-[#f7f0de]/50 to-[#e6f7f7]/30">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#232F3E] text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Sidebar Header */}
          <div className="h-16 px-6 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1A9B9A] flex items-center justify-center shadow-md">
                <FiShield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg tracking-wide text-white">AgriLink</h2>
                <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Admin Portal</p>
              </div>
            </div>
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-6 px-4 overflow-y-auto space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${
                    isActive 
                      ? 'bg-[#1A9B9A] text-white shadow-lg shadow-[#1A9B9A]/30'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-900/50">
            <div className="flex items-center gap-3 px-2 py-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center font-bold text-[#1A9B9A]">
                {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-gray-400 font-medium">Logged in as</p>
                <p className="text-sm font-bold text-white truncate">{adminUser?.email || 'admin@bpfis.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-semibold text-sm"
            >
              <FiLogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center px-4 justify-between lg:px-8 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden text-gray-500 hover:text-gray-700" 
                onClick={() => setSidebarOpen(true)}
              >
                <FiMenu className="h-6 w-6" />
              </button>
              
              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center space-x-1.5 text-sm text-gray-500 font-medium">
                <Link href="/admin/dashboard" className="text-gray-400 hover:text-[#1A9B9A] flex items-center gap-1 transition-colors">
                  <FiHome className="h-4 w-4" />
                </Link>
                {getBreadcrumbs().map((bc, idx) => (
                  <div key={`${bc.href}-${idx}`} className="flex items-center space-x-1.5">
                    <FiChevronRight className="h-3.5 w-3.5 text-gray-300" />
                    {idx === getBreadcrumbs().length - 1 ? (
                      <span className="text-[#232F3E] font-bold">{bc.label}</span>
                    ) : (
                      <Link href={bc.href} className="hover:text-[#1A9B9A] transition-colors">
                        {bc.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold bg-[#E6F7F7] text-[#1A9B9A] border border-[#1A9B9A]/20">
                Authorized Session
              </span>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
