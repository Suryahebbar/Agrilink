"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface Order {
  _id: string;
  orderNumber: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  customerName?: string;
  customerPhone?: string;
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: {
    method?: 'card' | 'upi' | 'netbanking' | 'wallet';
    transactionId?: string;
    paidAt?: string;
  };
  orderStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  shippingDetails?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  };
  createdAt: string;
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');

  const tabs = useMemo(() => [
    { id: 'all', label: 'All Orders', count: 0 },
    { id: 'new', label: 'New', count: 0 },
    { id: 'processing', label: 'Processing', count: 0 },
    { id: 'shipped', label: 'Shipped', count: 0 },
    { id: 'delivered', label: 'Delivered', count: 0 },
    { id: 'returned', label: 'Returns', count: 0 }
  ], []);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get supplierId from authentication
      const profileResponse = await fetch('/api/supplier', withSupplierAuth());
      if (!profileResponse.ok) {
        if (profileResponse.status === 401) {
          // Try simulate login for development
          console.log('Authentication failed, trying simulate login...');
          const simulateResponse = await fetch('/api/supplier/simulate-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (simulateResponse.ok) {
            const simulateData = await simulateResponse.json();
            setSupplierId(simulateData.seller._id);
            console.log('Simulate login successful, retrying orders fetch...');
            // Retry with the new supplier ID
            return loadOrders();
          } else {
            throw new Error('Authentication required. Please login as a supplier.');
          }
        } else {
          throw new Error('Failed to get supplier profile');
        }
      }

      const profileData = await profileResponse.json();
      const currentSupplierId = profileData.seller?._id || profileData.supplier?._id;
      
      if (!currentSupplierId) {
        throw new Error('Supplier ID not found in profile');
      }
      
      setSupplierId(currentSupplierId);
      
      const params = new URLSearchParams({
        status: activeTab === 'all' ? '' : activeTab,
        search: searchTerm
      });

      const response = await fetch(`/api/supplier/${currentSupplierId}/orders?${params}`, withSupplierAuth());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData.details
            ? `${errorData.error || 'Failed to fetch orders'}: ${errorData.details}`
            : (errorData.error || 'Failed to fetch orders'))
        );
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    loadOrders();
  }, [activeTab, searchTerm, loadOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      if (!supplierId) {
        throw new Error('Supplier ID not available');
      }
      
      const response = await fetch(`/api/supplier/${supplierId}/orders/${orderId}`, withSupplierAuth({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderStatus: newStatus })
      }));

      const data = await response.json();

      if (response.ok) {
        setSuccess('Order status updated successfully!');
        await loadOrders(); // Reload orders
      } else {
        setError(data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'badge-info';
      case 'processing': return 'badge-warning';
      case 'shipped': return 'badge-info';
      case 'delivered': return 'badge-success';
      case 'returned': return 'badge-warning';
      case 'cancelled': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'failed': return 'badge-error';
      case 'refunded': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Update tab counts based on orders
  useEffect(() => {
    tabs.forEach(tab => {
      if (tab.id === 'all') {
        tab.count = orders.length;
      } else {
        tab.count = orders.filter(order => order.orderStatus === tab.id).length;
      }
    });
  }, [orders, tabs]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--navy-blue)]">Orders Management</h1>
        <p className="text-sm text-[var(--gray-600)] mt-1">Manage customer orders and fulfillment</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-[var(--error-red-light)] border border-[var(--error-red-border)] rounded-lg p-4">
          <p className="text-[var(--error-red)]">{error}</p>
          {error.includes('Authentication') && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/supplier/simulate-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  
                  if (response.ok) {
                    setSuccess('Authentication fixed! Reloading...');
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    setError('Failed to fix authentication');
                  }
                } catch (error) {
                  console.error('Error fixing authentication:', error);
                  setError('Error fixing authentication');
                }
              }}
              className="mt-2 bg-[var(--navy-blue)] text-white px-4 py-2 rounded text-sm hover:bg-[var(--primary-teal)]"
            >
              Fix Authentication
            </button>
          )}
        </div>
      )}
      {success && (
        <div className="bg-[var(--success-green-light)] border border-[var(--success-green-border)] rounded-lg p-4">
          <p className="text-[var(--success-green)]">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-[var(--gray-300)] rounded-lg">
        <div className="border-b border-[var(--gray-300)]">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-[var(--navy-blue)] text-[var(--navy-blue)]'
                    : 'border-transparent text-[var(--gray-600)] hover:text-[var(--navy-blue)] hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-[var(--gray-300)]">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by order number, customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button
              onClick={loadOrders}
              className="btn-secondary btn-md"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[#6b7280]">
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm mt-1">
                  {activeTab === 'all' 
                    ? "You haven't received any orders yet" 
                    : `No ${activeTab} orders found`
                  }
                </p>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-[var(--gray-300)]">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e2d4b7]">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#f9fafb]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[var(--navy-blue)]">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-[var(--gray-600)]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[var(--navy-blue)]">
                          {order.customer?.name || order.customerName || 'Customer'}
                        </div>
                        <div className="text-xs text-[var(--gray-600)]">
                          {order.customer?.phone || order.customerPhone || 'N/A'}
                        </div>
                        <div className="text-xs text-[var(--gray-600)]">
                          {order.customer?.address?.city || 'N/A'}, {order.customer?.address?.state || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--gray-600)]">
                        {order.items.length} items
                      </div>
                      <div className="text-xs text-[var(--gray-600)]">
                        {order.items.slice(0, 2).map(item => item.name).join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--navy-blue)]">
                      ₹{formatAmount(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`badge ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        {order.paymentStatus === 'paid' && order.paymentDetails?.transactionId && (
                          <div className="text-xs text-[var(--gray-600)] font-mono">
                            {order.paymentDetails.transactionId}
                          </div>
                        )}
                        {order.paymentStatus === 'paid' && order.paymentDetails?.method && (
                          <div className="text-xs text-[var(--gray-600)]">
                            {order.paymentDetails.method}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`badge ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                        {/* Mini timeline for 3-day delivery */}
                        <div className="flex items-center space-x-1">
                          {['new', 'processing', 'shipped', 'delivered'].map((step, index) => {
                            const isCompleted = order.orderStatus === step || 
                              (order.orderStatus === 'delivered' && index <= 3) ||
                              (order.orderStatus === 'shipped' && index <= 2) ||
                              (order.orderStatus === 'processing' && index <= 1) ||
                              (order.orderStatus === 'new' && index <= 0);
                            
                            return (
                              <div key={step} className="flex items-center">
                                <div className={`w-2 h-2 rounded-full ${
                                  isCompleted ? 'bg-[var(--navy-blue)]' : 'bg-gray-300'
                                }`} />
                                {index < 3 && (
                                  <div className={`w-3 h-0.5 ${
                                    order.orderStatus === 'delivered' && index <= 2 ||
                                    order.orderStatus === 'shipped' && index <= 1 ||
                                    order.orderStatus === 'processing' && index <= 0
                                      ? 'bg-[var(--navy-blue)]' : 'bg-gray-300'
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/supplier/orders/${order._id}`}
                          className="text-[var(--navy-blue)] hover:text-[var(--primary-teal)]"
                        >
                          View
                        </Link>
                        
                        {/* Status Update Dropdown */}
                        {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && (
                          <select
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            className="select-field"
                            defaultValue=""
                            aria-label={`Update status for order ${order.orderNumber}`}
                          >
                            <option value="" disabled>Update</option>
                            {order.orderStatus === 'new' && (
                              <option value="processing">Processing</option>
                            )}
                            {order.orderStatus === 'processing' && (
                              <option value="shipped">Shipped</option>
                            )}
                            {order.orderStatus === 'shipped' && (
                              <option value="delivered">Delivered</option>
                            )}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
