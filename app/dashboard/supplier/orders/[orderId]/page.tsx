"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderItem {
  productId: {
    _id: string;
    name: string;
    sku: string;
    images?: { url: string }[];
    price?: number;
  } | string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  sellerId: string;
  customer: {
    name: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };
  };
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    method?: 'card' | 'upi' | 'netbanking' | 'wallet';
    transactionId?: string;
    paidAt?: string;
  };
  orderStatus: OrderStatus;
  shippingDetails?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');

  const statusOptions: OrderStatus[] = useMemo(
    () => ['new', 'processing', 'shipped', 'delivered', 'returned'],
    []
  );

  const paymentOptions: PaymentStatus[] = useMemo(
    () => ['pending', 'paid', 'failed', 'refunded'],
    []
  );

  useEffect(() => {
    if (!orderId) return;
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.seller?._id || 'temp';
          setSupplierId(currentSupplierId);
        } else {
          throw new Error('Failed to get supplier profile');
        }
      }
      
      const response = await fetch(`/api/supplier/${currentSupplierId}/orders/${orderId}`, withSupplierAuth());

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to load order');
      }

      const data = await response.json();
      setOrder(data.order);
      
      // Set form values from order data
      setNotes(data.order?.notes || '');
      setTrackingNumber(data.order?.shippingDetails?.trackingNumber || '');
      setCarrier(data.order?.shippingDetails?.carrier || '');
      setEstimatedDelivery(data.order?.shippingDetails?.estimatedDelivery || '');
    } catch (error) {
      console.error('Error loading order:', error);
      setError(error instanceof Error ? error.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (payload: Record<string, unknown>, successMessage: string) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/orders/${orderId}`, withSupplierAuth({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }));

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setSuccess(successMessage);
      await loadOrder();
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!order || newStatus === order.orderStatus) return;
    void updateOrder({ orderStatus: newStatus }, 'Order status updated');
  };

  const handlePaymentStatusChange = (newStatus: PaymentStatus) => {
    if (!order || newStatus === order.paymentStatus) return;
    void updateOrder({ paymentStatus: newStatus }, 'Payment status updated');
  };

  const handleShippingUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    void updateOrder(
      {
        shippingDetails: {
          trackingNumber: trackingNumber || undefined,
          carrier: carrier || undefined,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined
        },
        notes
      },
      'Shipping details updated'
    );
  };

  const getBadgeClass = (status: string, type: 'order' | 'payment') => {
    if (type === 'payment') {
      switch (status) {
        case 'paid':
          return 'badge badge-success';
        case 'pending':
          return 'badge badge-warning';
        case 'failed':
          return 'badge badge-error';
        case 'refunded':
          return 'badge badge-info';
        default:
          return 'badge badge-neutral';
      }
    }

    switch (status) {
      case 'new':
        return 'badge badge-info';
      case 'processing':
        return 'badge badge-warning';
      case 'shipped':
        return 'badge badge-info';
      case 'delivered':
        return 'badge badge-success';
      case 'returned':
        return 'badge badge-warning';
      case 'cancelled':
        return 'badge badge-error';
      default:
        return 'badge badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3">{error}</div>
        ) : (
          <div className="text-[#6b7280]">Order not found.</div>
        )}
        <Link href="/dashboard/supplier/orders" className="btn-secondary btn-md inline-flex">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6b7280]">
            <Link href="/dashboard/supplier/orders" className="text-[#1f3b2c] hover:underline">
              Orders
            </Link>{' '}
            / {order.orderNumber}
          </p>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Order Details</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right space-y-2">
          <div>
            <span className="text-xs uppercase text-[#6b7280]">Order Status</span>
            <div className="mt-1">
              <span className={getBadgeClass(order.orderStatus, 'order')}>{order.orderStatus}</span>
            </div>
          </div>
          <div>
            <span className="text-xs uppercase text-[#6b7280]">Payment Status</span>
            <div className="mt-1">
              <span className={getBadgeClass(order.paymentStatus, 'payment')}>{order.paymentStatus}</span>
            </div>
            {order.paymentStatus === 'paid' && order.paymentDetails?.transactionId && (
              <div className="mt-2 text-xs text-[#6b7280]">
                <div className="font-mono">{order.paymentDetails.transactionId}</div>
                {order.paymentDetails.method && (
                  <div className="mt-1">{order.paymentDetails.method}</div>
                )}
                {order.paymentDetails.paidAt && (
                  <div className="mt-1">{new Date(order.paymentDetails.paidAt).toLocaleString()}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md px-4 py-3">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1f3b2c]">Items</h2>
              <span className="text-sm text-[#6b7280]">{order.items.length} total items</span>
            </div>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={`${item.sku}-${item.productId && typeof item.productId === 'object' ? item.productId._id : item.sku}`} className="flex items-start justify-between border border-[#e2d4b7] rounded-md px-4 py-3">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-[#1f3b2c]">{item.name}</p>
                    <p className="text-sm text-[#6b7280]">SKU: {item.sku}</p>
                    <p className="text-xs text-[#6b7280] mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6b7280]">₹{item.price.toFixed(2)}</p>
                    <p className="text-base font-semibold text-[#1f3b2c]">₹{(item.total || (item.price * item.quantity)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e2d4b7] pt-4 mt-4">
              <div className="flex items-center justify-between text-sm text-[#6b7280]">
                <span>Subtotal</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-[#1f3b2c] mt-2">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#1f3b2c]">
              <div>
                <p className="text-xs uppercase text-[#6b7280]">Name</p>
                <p className="font-medium">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-[#6b7280]">Phone</p>
                <p className="font-medium">{order.customer.phone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-[#6b7280]">Shipping Address</p>
                <p className="font-medium mt-1">
                  {order.customer.address.street}, {order.customer.address.city}, {order.customer.address.state}{' '}
                  {order.customer.address.pincode}
                  {order.customer.address.country ? `, ${order.customer.address.country}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Management Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Update Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#6b7280] mb-2">Order Status</label>
                <select
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                  className="select-field w-full"
                  disabled={saving}
                  aria-label="Order Status"
                  title="Order Status"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase text-[#6b7280] mb-2">Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
                  className="select-field w-full"
                  disabled={saving}
                  aria-label="Payment Status"
                  title="Payment Status"
                >
                  {paymentOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Shipping & Notes</h2>
            <form onSubmit={handleShippingUpdate} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#6b7280] mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter tracking number"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-[#6b7280] mb-1">Carrier</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., India Post, Delhivery"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-[#6b7280] mb-1">Estimated Delivery</label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., 2024-01-15"
                  aria-label="Estimated Delivery Date"
                  title="Estimated Delivery Date"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-[#6b7280] mb-1">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field w-full"
                  rows={4}
                  placeholder="Add order notes for your team"
                />
              </div>
              <button
                type="submit"
                className="btn-primary btn-md w-full"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Shipping Details'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm text-[#1f3b2c]">
              <div className="flex items-center justify-between">
                <span>Order Number</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Placed</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span>{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Amount</span>
                <span className="font-semibold">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
