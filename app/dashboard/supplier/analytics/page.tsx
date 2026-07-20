"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    activeProducts: number;
    revenueGrowth: number;
    orderGrowth: number;
  };
  salesChart: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  categoryBreakdown: {
    category: string;
    revenue: number;
    orders: number;
    percentage: number;
  }[];
}

// Simple chart components (using CSS/SVG instead of external libraries)
const LineChart = ({ data, dataKey, color, height = 200 }: { data: any[], dataKey: string, color: string, height?: number }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0));
  const minValue = 0;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d[dataKey] - minValue) / (maxValue - minValue || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d[dataKey] - minValue) / (maxValue - minValue || 1)) * 100;
          return (
            <circle key={i} cx={x} cy={y} r="2" fill={color} />
          );
        })}
      </svg>
    </div>
  );
};

const BarChart = ({ data, dataKey, labelKey, color, height = 200 }: { data: any[], dataKey: string, labelKey: string, color: string, height?: number }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0));
  
  return (
    <div className="space-y-2" style={{ height }}>
      {data.slice(0, 10).map((item, index) => {
        const height = (item[dataKey] / (maxValue || 1)) * 100;
        return (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-24 text-xs text-gray-600 truncate">{item[labelKey]}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ width: `${height}%`, backgroundColor: color }}
              />
            </div>
            <div className="w-16 text-xs text-right text-gray-600">
              {typeof item[dataKey] === 'number' ? item[dataKey].toLocaleString() : item[dataKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PieChart = ({ data, dataKey, labelKey, height = 200 }: { data: any[], dataKey: string, labelKey: string, height?: number }) => {
  if (!data || data.length === 0) return null;
  
  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
  let currentAngle = 0;
  
  const colors = ['#1f3b2c', '#e2d4b7', '#6b7280', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
  
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="relative">
        <svg width="150" height="150" viewBox="0 0 150 150">
          {data.map((item, index) => {
            if (item[dataKey] === 0) return null;
            const percentage = (item[dataKey] / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = 75 + 50 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 75 + 50 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 75 + 50 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 75 + 50 * Math.sin((endAngle - 90) * Math.PI / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 75 75`,
              `L ${x1} ${y1}`,
              `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div className="absolute top-full mt-4 left-0 right-0 space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span>{item[labelKey]}</span>
              </div>
              <span className="font-medium">
                {((item[dataKey] / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [products, setProducts] = useState<Array<{id: string, name: string, sku: string, status: string, category: string, price: number}>>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  // Load products for dropdown
  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      // Temporarily use mock data for testing
      const mockProducts = [
        { id: '694383067f7e637ae7ac1c9e', name: 'Test Delivered Product', sku: 'TEST-001', status: 'active', category: 'vegetables', price: 100 },
        { id: '694383067f7e637ae7ac1c9f', name: 'Sample Product', sku: 'SAMPLE-002', status: 'active', category: 'fruits', price: 150 }
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({ range: timeRange });
      if (selectedProductId) {
        queryParams.append('productId', selectedProductId);
      }
      
      // Use the actual supplier analytics API
      const response = await fetch(`/api/supplier/analytics?${queryParams}`);

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to load analytics');
      }

      const analyticsData: AnalyticsData = await response.json();
      setData(analyticsData);
      setError('');
    } catch (error) {
      console.error('Error loading analytics:', error);
      setData(null);
      setError(error instanceof Error ? error.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedProductId]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedProductId, loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">No analytics data available</div>
      </div>
    );
  }

  // Check if there's actual data (not all zeros)
  const hasData =
    data.overview.totalOrders > 0 ||
    data.overview.totalRevenue > 0 ||
    data.topProducts.length > 0 ||
    data.salesChart.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Analytics Dashboard</h1>
          <p className="text-sm text-[#6b7280] mt-1">Track your business performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            disabled={loadingProducts}
            className="px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-gray-700"
            aria-label="Select product for analytics"
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-gray-700"
            aria-label="Select time range for analytics"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!hasData && (
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[#1f3b2c] mb-2">No analytics data yet</h3>
          <p className="text-[#6b7280] mb-4">
            Start selling products to see your analytics data here. Once you have orders and sales, this dashboard will show your business performance.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/dashboard/supplier/products/new"
              className="inline-flex items-center justify-center rounded-md bg-[#1f3b2c] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d4f3c]"
            >
              Add Your First Product
            </Link>
            <Link
              href="/dashboard/supplier/orders"
              className="inline-flex items-center justify-center rounded-md border border-[#e2d4b7] px-4 py-2 text-sm font-medium text-[#1f3b2c] hover:bg-[#f9fafb]"
            >
              View Orders
            </Link>
          </div>
        </div>
      )}

      {/* Analytics Content - Only show when there's data */}
      {hasData && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6b7280]">Total Revenue</p>
                  <p className="text-2xl font-semibold text-[#1f3b2c]">
                    ₹{data.overview.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6b7280]">Total Orders</p>
                  <p className="text-2xl font-semibold text-[#1f3b2c]">
                    {data.overview.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6b7280]">Avg Order Value</p>
                  <p className="text-2xl font-semibold text-[#1f3b2c]">
                    ₹{data.overview.avgOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6b7280]">Active Products</p>
                  <p className="text-2xl font-semibold text-[#1f3b2c]">
                    {data.overview.activeProducts.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Trends Chart */}
          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Sales Trends</h2>
            {data.salesChart.length > 0 ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-[#6b7280] mb-2">Revenue Over Time</h3>
                  <LineChart data={data.salesChart} dataKey="revenue" color="#10b981" height={200} />
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-[#6b7280] mb-2">Orders Over Time</h3>
                  <LineChart data={data.salesChart} dataKey="orders" color="#3b82f6" height={200} />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#6b7280]">
                No sales data available for the selected period
              </div>
            )}
          </div>

          {/* Top Products */}
          {!selectedProductId && data.topProducts.length > 0 && (
            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Top Selling Products</h2>
              <BarChart data={data.topProducts} dataKey="revenue" labelKey="name" color="#1f3b2c" height={300} />
            </div>
          )}

          {/* Category Breakdown */}
          {data.categoryBreakdown.length > 0 && (
            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Sales by Category</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-[#6b7280] mb-4">Revenue Distribution</h3>
                  <PieChart data={data.categoryBreakdown} dataKey="revenue" labelKey="category" height={250} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#6b7280] mb-4">Category Performance</h3>
                  <BarChart data={data.categoryBreakdown} dataKey="revenue" labelKey="category" color="#e2d4b7" height={250} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
