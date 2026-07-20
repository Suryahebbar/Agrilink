"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Order {
  _id: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalAmount: number;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingDetails: {
    estimatedDelivery?: string;
    status: string;
  };
}

export default function FarmerMarketplaceOrders() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [uid, setUid] = useState<string | null>(initialUserId);

  // Helper function to build URLs with userId
  const buildUrl = (path: string) => {
    return uid ? `${path}?userId=${uid}` : '/login';
  };

  useEffect(() => {
    // Require userId from URL params, redirect to login if not present
    const urlUserId = searchParams.get('userId');
    if (urlUserId) {
      setUid(urlUserId);
    } else {
      // No userId in URL, redirect to login
      window.location.href = '/login';
    }
  }, [searchParams]);

  useEffect(() => {
    // Fetch whenever uid is ready/changes, but keep deps stable size
    if (!uid) { 
      setLoading(false);
      setOrders([]);
      return; 
    }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (!uid) { 
        setOrders([]);
        setLoading(false);
        return; 
      }
      const res = await fetch(`/api/farmer/orders?userId=${uid}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load orders');
      const apiOrders = Array.isArray(data?.orders) ? data.orders : [];
      const mapped: Order[] = apiOrders.map((o: any) => {
        const status = o.status || o.orderStatus || 'confirmed';
        const created = o.createdAt || new Date().toISOString();
        const eta = (status === 'delivered' || status === 'cancelled') ? undefined : new Date(new Date(created).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();
        return {
          _id: String(o._id || o.id || o.orderNumber),
          orderId: o.orderNumber || o.orderId || '',
          items: (o.items || []).map((it: any) => ({
            name: it.name,
            quantity: Number(it.quantity) || 0,
            price: Number(it.price) || 0,
            image: it.image,
          })),
          totalAmount: Number(o.totalAmount) || 0,
          status,
          createdAt: created,
          shippingDetails: { estimatedDelivery: eta, status },
        } as Order;
      });
      setOrders(mapped);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f3b2c]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f3b2c] mb-2">My Orders</h1>
        <p className="text-[#6b7280]">Track and manage your marketplace orders</p>
      </div>

      {/* Order Status Filter */}
      <div className="bg-white rounded-lg border border-[#e2d4b7] p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-[#1f3b2c] text-white'
                  : 'bg-gray-100 text-[#6b7280] hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {orders.filter(o => o.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl text-[#6b7280]">Orders</span>
          <h2 className="text-2xl font-semibold text-[#1f3b2c] mt-4">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </h2>
          <p className="text-[#6b7280] mt-2">
            {filter === 'all' 
              ? 'Start shopping to see your orders here'
              : `You don't have any ${filter} orders at the moment`
            }
          </p>
          {filter === 'all' && (
            <Link
              href={buildUrl('/dashboard/farmer/marketplace/products')}
              className="inline-block mt-6 bg-[#1f3b2c] text-white px-6 py-3 rounded-lg hover:bg-[#2d4f3c]"
            >
              Browse Products
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg border border-[#e2d4b7] p-6 hover:shadow-lg transition-shadow">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#1f3b2c]">Order #{order.orderId}</h3>
                  <p className="text-sm text-[#6b7280]">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                  </span>
                  <Link
                    href={buildUrl(`/dashboard/farmer/marketplace/orders/${order._id}`)}
                    className="text-[#1f3b2c] hover:underline text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <div className="flex space-x-4">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-lg text-[#6b7280]">Item</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1f3b2c]">{item.name}</p>
                        <p className="text-xs text-[#6b7280]">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="flex items-center">
                      <span className="text-sm text-[#6b7280]">+{order.items.length - 3} more</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Total */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-[#6b7280]">
                  {order.items.length} items • Total: 
                </div>
                <div className="text-lg font-bold text-[#1f3b2c]">
                  ₹{order.totalAmount.toLocaleString()}
                </div>
              </div>

              {/* Estimated Delivery (for active orders) */}
              {order.status !== 'delivered' && order.status !== 'cancelled' && order.shippingDetails.estimatedDelivery && (
                <div className="mt-3 text-sm text-[#6b7280]">
                  Estimated delivery: {new Date(order.shippingDetails.estimatedDelivery).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
