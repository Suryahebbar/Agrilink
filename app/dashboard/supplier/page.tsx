"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';
import { useSupplierId } from './layout';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  avgOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  reorderThreshold: number;
}

type SupplierSettingsResponse = {
  settings?: {
    taxInclusive?: boolean;
    taxRate?: number;
  };
};

type DashboardStatsResponse = {
  stats?: {
    revenue?: { current?: number; previous?: number; growth?: number };
    orders?: { current?: number; previous?: number; growth?: number };
    activeProducts?: number;
  };
};

type RecentOrdersResponse = {
  orders?: RecentOrder[];
};

type LowStockResponse = {
  products?: LowStockProduct[];
};

export default function SupplierDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taxInclusive, setTaxInclusive] = useState<boolean>(true);
  const [taxRate, setTaxRate] = useState<number>(0.18);
  const supplierId = useSupplierId();

  useEffect(() => {
    if (!supplierId) return;

    loadDashboardData({ silent: false });

    const interval = setInterval(() => {
      loadDashboardData({ silent: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [supplierId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async ({ silent }: { silent: boolean }) => {
    if (!supplierId) {
      console.error('No supplier ID available');
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      
      // Load supplier settings for tax display
      try {
        const settingsRes = await fetch(`/api/supplier/${supplierId}/settings`, withSupplierAuth());
        if (settingsRes.ok) {
          const raw: unknown = await settingsRes.json();
          const data = raw as SupplierSettingsResponse;
          if (data.settings) {
            setTaxInclusive(Boolean(data.settings.taxInclusive));
            setTaxRate(typeof data.settings.taxRate === 'number' ? data.settings.taxRate : 0.18);
          }
        }
      } catch (e) {
        console.error('Error loading supplier settings for dashboard:', e);
      }

      // Load dashboard data with supplierId
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        fetch(`/api/supplier/${supplierId}/dashboard/stats`, withSupplierAuth()),
        fetch(`/api/supplier/${supplierId}/dashboard/recent-orders`, withSupplierAuth()),
        fetch(`/api/supplier/${supplierId}/dashboard/low-stock`, withSupplierAuth())
      ]);

        // Handle stats response with proper error handling
        if (statsRes.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/login';
          return;
        }

        // Handle stats response
        if (statsRes.ok) {
          const raw: unknown = await statsRes.json();
          const statsData = raw as DashboardStatsResponse;
          const apiStats = statsData?.stats;
          const totalRevenue = typeof apiStats?.revenue?.current === 'number' ? apiStats.revenue.current : 0;
          const totalOrders = typeof apiStats?.orders?.current === 'number' ? apiStats.orders.current : 0;
          const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
          setStats({
            totalRevenue,
            totalOrders,
            activeProducts: typeof apiStats?.activeProducts === 'number' ? apiStats.activeProducts : 0,
            avgOrderValue,
            revenueGrowth: typeof apiStats?.revenue?.growth === 'number' ? apiStats.revenue.growth : 0,
            orderGrowth: typeof apiStats?.orders?.growth === 'number' ? apiStats.orders.growth : 0
          });
        } else {
          const errorData = await statsRes.json().catch(() => ({}));
          console.error('Dashboard stats error:', errorData);
          setStats({
            totalRevenue: 0,
            totalOrders: 0,
            activeProducts: 0,
            avgOrderValue: 0,
            revenueGrowth: 0,
            orderGrowth: 0
          });
        }

        // Handle recent orders response
        if (ordersRes.ok) {
          const raw: unknown = await ordersRes.json();
          const data = raw as RecentOrdersResponse;
          setRecentOrders(Array.isArray(data.orders) ? data.orders : []);
        } else {
          setRecentOrders([]);
        }

        // Handle low stock response
        if (lowStockRes.ok) {
          const raw: unknown = await lowStockRes.json();
          const data = raw as LowStockResponse;
          setLowStockProducts(Array.isArray(data.products) ? data.products : []);
        } else {
          setLowStockProducts([]);
        }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Set empty states on error
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        activeProducts: 0,
        avgOrderValue: 0,
        revenueGrowth: 0,
        orderGrowth: 0
      });
      setRecentOrders([]);
      setLowStockProducts([]);
      setError('Failed to load dashboard data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const applyTax = (base: number) => {
    const value = taxInclusive ? base * (1 + taxRate) : base;
    return value;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--navy-blue)]">Dashboard</h1>
        <p className="text-sm text-[var(--gray-600)] mt-1">Welcome back! Here&#39;s what&#39;s happening with your business today.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--error-red-light)] border border-[var(--error-red-border)] rounded-lg p-4">
          <p className="text-[var(--error-red)]">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Total Orders</p>
              <p className="metric-value">
                {stats?.totalOrders?.toLocaleString() || '0'}
              </p>
              {stats?.orderGrowth && (
                <p className={`metric-change ${stats.orderGrowth > 0 ? 'positive' : 'negative'}`}>
                  {stats.orderGrowth > 0 ? '↑' : '↓'} {Math.abs(stats.orderGrowth)}%
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Active Products</p>
              <p className="metric-value">
                {stats?.activeProducts?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-[var(--gray-600)] mt-1">Products listed</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Avg Order Value</p>
              <p className="metric-value">
                ₹{stats?.avgOrderValue ? applyTax(stats.avgOrderValue).toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-[var(--gray-600)] mt-1">Per order</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Recent Orders</h2>
              <Link
                href="/dashboard/supplier/orders"
                className="text-sm text-[var(--navy-blue)] hover:underline"
              >
                View all
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--gray-600)]">No recent orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 border border-[var(--gray-300)] rounded-lg">
                    <div>
                      <p className="font-medium text-[var(--navy-blue)]">{order.orderNumber}</p>
                      <p className="text-sm text-[var(--gray-600)]">{order.customerName}</p>
                      <p className="text-xs text-[var(--gray-600)]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--navy-blue)]">₹{applyTax(order.totalAmount)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="lg:col-span-1">
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Low Stock Alert</h2>
              <Link
                href="/dashboard/supplier/inventory"
                className="text-sm text-[var(--navy-blue)] hover:underline"
              >
                Manage
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--gray-600)]">All stock levels healthy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 border border-[var(--gray-300)] rounded-lg">
                    <div>
                      <p className="font-medium text-[var(--navy-blue)] text-sm">{product.name}</p>
                      <p className="text-xs text-[var(--gray-600)]">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        product.stockQuantity === 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {product.stockQuantity}
                      </p>
                      <p className="text-xs text-[var(--gray-600)]">Reorder at {product.reorderThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <h2 className="card-title mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/supplier/products/new"
            className="flex items-center justify-center px-4 py-3 border border-[var(--gray-300)] rounded-md text-sm font-medium text-[var(--navy-blue)] hover:bg-[#f9fafb]"
          >
            Add New Product
          </Link>
          <Link
            href="/dashboard/supplier/inventory"
            className="flex items-center justify-center px-4 py-3 border border-[var(--gray-300)] rounded-md text-sm font-medium text-[var(--navy-blue)] hover:bg-[#f9fafb]"
          >
            Update Inventory
          </Link>
          <Link
            href="/dashboard/supplier/orders"
            className="flex items-center justify-center px-4 py-3 border border-[var(--gray-300)] rounded-md text-sm font-medium text-[var(--navy-blue)] hover:bg-[#f9fafb]"
          >
            View Orders
          </Link>
          <Link
            href="/dashboard/supplier/profile"
            className="flex items-center justify-center px-4 py-3 border border-[var(--gray-300)] rounded-md text-sm font-medium text-[var(--navy-blue)] hover:bg-[#f9fafb]"
          >
            Profile Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
