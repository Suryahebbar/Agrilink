"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface OrderAnalytics {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  statusBreakdown: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  timeSeriesData: {
    date: string;
    orders: number;
    revenue: number;
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

export default function OrderAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrderAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/supplier/analytics?range=${timeRange}`, withSupplierAuth());
      
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load analytics data');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const exportOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/supplier/orders/export?range=${timeRange}`, withSupplierAuth());
      
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to export orders');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Error exporting orders:', err);
      setError('Failed to export orders');
    }
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600 text-center">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Analytics</h1>
          <p className="text-gray-600">Track your order performance and trends</p>
        </div>
        
        <div className="flex gap-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={exportOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Exporting...' : 'Export Orders'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Orders</h3>
          <p className="text-2xl font-bold text-blue-600">{data?.overview.totalOrders.toLocaleString() || '0'}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">₹{data?.overview.totalRevenue.toLocaleString() || '0'}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Order Value</h3>
          <p className="text-2xl font-bold text-purple-600">₹{data?.overview.avgOrderValue.toLocaleString() || '0'}</p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pending</span>
            <span className="text-xl font-semibold text-yellow-600">{data?.statusBreakdown.pending}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Processing</span>
            <span className="text-xl font-semibold text-blue-600">{data?.statusBreakdown.processing}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Shipped</span>
            <span className="text-xl font-semibold text-indigo-600">{data?.statusBreakdown.shipped}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Delivered</span>
            <span className="text-xl font-semibold text-green-600">{data?.statusBreakdown.delivered}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cancelled</span>
            <span className="text-xl font-semibold text-red-600">{data?.statusBreakdown.cancelled}</span>
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Over Time</h3>
        <div className="h-64">
          <div className="text-center text-gray-500">
            <p>Time series chart would be rendered here</p>
            <p>Showing {data?.timeSeriesData?.length || 0} data points</p>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
        <div className="space-y-2">
          {data?.topProducts?.slice(0, 5).map((product: any, index: number) => (
            <div key={product.productId} className="flex justify-between items-center p-3 border-b">
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">{product.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">{product.quantity}</p>
                <p className="text-sm text-gray-600">sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
