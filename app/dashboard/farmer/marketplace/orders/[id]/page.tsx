"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import ToastContainer from '@/components/Toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  productId?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: {
    method?: 'card' | 'upi' | 'netbanking' | 'wallet';
    transactionId?: string;
    paidAt?: string;
  };
  shipping: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  tracking: {
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    shippedAt?: string;
    deliveredAt?: string;
    carrier?: string;
    currentLocation?: string;
  };
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  const userId = searchParams.get('userId');
  const orderId = params.id as string;
  
  // Helper function to build URLs with userId
  const buildUrl = (path: string) => {
    return userId ? `${path}?userId=${userId}` : path;
  };
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Review state management
  const [reviewData, setReviewData] = useState({
    rating: 0,
    title: '',
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      if (!userId) {
        console.error('No userId provided');
        return;
      }

      const response = await fetch(`/api/farmer/orders/${orderId}?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        const errorData = await response.json();
        console.error('Error loading order:', errorData.error);
        if (response.status === 404) {
          setOrder(null);
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId, userId]);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId, loadOrder]);

  const handleSubmitReview = () => {
    handleReviewSubmit();
  };

  const handleReviewSubmit = async (rating?: number) => {
    try {
      setSubmittingReview(true);
      
      const reviewPayload = {
        userId,
        orderId,
        productId: order?.items[0]?.productId || '',
        rating: rating || reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        userName: 'Farmer User', // This would come from user profile
        userEmail: 'farmer@example.com' // This would come from user profile
      };

      const res = await fetch('/api/farmer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload)
      });

      if (res.ok) {
        await res.json().catch(() => null);
        success('Review submitted successfully!');
        
        // Reset review form
        setReviewData({ rating: 0, title: '', comment: '' });
        
        // Optionally reload order to show review status
        loadOrder();
      } else {
        const errorData = await res.json();
        error(errorData.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f3b2c]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <ToastContainer />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-semibold text-[#1f3b2c]">Order not found</h2>
          <p className="text-[#6b7280] mt-2">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href={buildUrl('/dashboard/farmer/marketplace/orders')}
            className="inline-block mt-6 bg-[#1f3b2c] text-white px-6 py-3 rounded-lg hover:bg-[#2d4f3c]"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-[#6b7280] mb-6">
        <Link href={buildUrl('/dashboard/farmer/marketplace')} className="hover:text-[#1f3b2c]">
          Marketplace
        </Link>
        <span>/</span>
        <Link href={buildUrl('/dashboard/farmer/marketplace/orders')} className="hover:text-[#1f3b2c]">
          Orders
        </Link>
        <span>/</span>
        <span className="text-[#1f3b2c]">Order #{order.orderNumber}</span>
      </nav>

      {/* Order Header */}
      <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1f3b2c] mb-2">Order #{order.orderNumber}</h1>
            <p className="text-[#6b7280]">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
            <p className="text-sm text-[#6b7280] mt-1">
              Payment Status: <span className={`px-2 py-1 rounded text-xs font-medium ${
                order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>{order.paymentStatus}</span>
            </p>
          </div>
          <div className="text-right">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
            </span>
          </div>
        </div>

        {/* Order Timeline with 3-Day Delivery */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4">Delivery Timeline (3-Day Delivery)</h3>
          <div className="flex items-center justify-between">
            {[
              { step: 'confirmed', day: 'Day 1', description: 'Order Confirmed' },
              { step: 'processing', day: 'Day 2', description: 'Processing' },
              { step: 'shipped', day: 'Day 3', description: 'Shipped' },
              { step: 'delivered', day: 'Day 3', description: 'Delivered' }
            ].map((item, index) => {
              const orderDate = new Date(order.createdAt);
              const stepDate = new Date(orderDate.getTime() + (index * 24 * 60 * 60 * 1000));
              const isCompleted = order.status === item.step || 
                (order.status === 'delivered' && index <= 3) ||
                (order.status === 'shipped' && index <= 2) ||
                (order.status === 'processing' && index <= 1) ||
                (order.status === 'confirmed' && index <= 0);
              
              return (
                <div key={item.step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-[#1f3b2c] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    isCompleted ? 'text-[#1f3b2c]' : 'text-gray-500'
                  }`}>
                    {item.day}
                  </span>
                  <span className={`text-xs ${
                    isCompleted ? 'text-[#1f3b2c]' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    {stepDate.toLocaleDateString()}
                  </span>
                  {index < 3 && (
                    <div className={`w-20 h-0.5 mt-3 ${
                      order.status === 'delivered' && index <= 2 ||
                      order.status === 'shipped' && index <= 1 ||
                      order.status === 'processing' && index <= 0
                        ? 'bg-[#1f3b2c]' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    {item.image ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover rounded"
                        />
                      </div>
                    ) : (
                      <span className="text-lg text-[#6b7280]">Item</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#1f3b2c]">{item.name}</h3>
                    <p className="text-sm text-[#6b7280]">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1f3b2c]">₹{item.price.toLocaleString()}</p>
                    <p className="text-sm text-[#6b7280]">each</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1f3b2c]">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Section - Only show for delivered orders */}
          {order.status === 'delivered' && (
            <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
              <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Rate Your Order</h2>
              <div className="space-y-4">
                <div className="text-sm text-[#6b7280] mb-4">
                  How was your experience with this order? Your feedback helps other farmers make better purchasing decisions.
                </div>
                
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm font-medium text-[#1f3b2c]">Overall Rating:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleReviewSubmit(star)}
                        className={`w-6 h-6 rounded-full border ${
                          star <= (reviewData.rating || 0)
                            ? 'bg-yellow-400 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1f3b2c] mb-2">Review Title</label>
                    <input
                      type="text"
                      value={reviewData.title}
                      onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c]"
                      placeholder="Brief summary of your experience"
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#1f3b2c] mb-2">Your Review</label>
                    <textarea
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c]"
                      rows={4}
                      placeholder="Share your experience with this order..."
                      maxLength={1000}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setReviewData({ rating: 0, title: '', comment: '' })}
                      className="px-4 py-2 border border-[#e2d4b7] text-[#6b7280] rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={!reviewData.rating || !reviewData.title.trim() || !reviewData.comment.trim()}
                      className="px-4 py-2 bg-[#1f3b2c] text-white rounded-lg hover:bg-[#2c5282] disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Information */}
          <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Shipping Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-[#1f3b2c] mb-2">Delivery Address</h3>
                <div className="text-[#6b7280]">
                  <p className="font-medium text-[#1f3b2c]">{order.shipping.name}</p>
                  <p>{order.shipping.phone}</p>
                  <p>{order.shipping.address}</p>
                  {order.shipping.city && <p>{order.shipping.city}, {order.shipping.state} - {order.shipping.pincode}</p>}
                </div>
              </div>

              {order.tracking.trackingNumber && (
                <div>
                  <h3 className="font-medium text-[#1f3b2c] mb-2">Tracking Information</h3>
                  <div className="text-[#6b7280]">
                    <p>Tracking Number: <span className="font-mono">{order.tracking.trackingNumber}</span></p>
                    <p>Carrier: {order.tracking.carrier}</p>
                    {order.tracking.currentLocation && (
                      <p>Current Location: {order.tracking.currentLocation}</p>
                    )}
                    <button className="text-[#1f3b2c] hover:underline text-sm mt-1">
                      Track Package →
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-[#1f3b2c] mb-2">Delivery Timeline</h3>
                <div className="text-[#6b7280]">
                  {order.tracking.estimatedDelivery && (
                    <p>Estimated Delivery: {new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</p>
                  )}
                  {order.tracking.actualDelivery && (
                    <p>Delivered on: {new Date(order.tracking.actualDelivery).toLocaleDateString()}</p>
                  )}
                  {order.tracking.shippedAt && (
                    <p>Shipped on: {new Date(order.tracking.shippedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Status History */}
          <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Order Status History</h2>
            <div className="space-y-4">
              {order.statusHistory.map((history, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    history.status === 'delivered' ? 'bg-green-500' :
                    history.status === 'shipped' ? 'bg-blue-500' :
                    history.status === 'processing' ? 'bg-yellow-500' :
                    history.status === 'cancelled' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-[#1f3b2c] capitalize">{history.status}</h4>
                      <span className="text-sm text-[#6b7280]">
                        {new Date(history.timestamp).toLocaleDateString()} at {new Date(history.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {history.note && (
                      <p className="text-sm text-[#6b7280] mt-1">{history.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Subtotal ({order.items.length} items)</span>
                <span className="text-[#1f3b2c]">₹{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Shipping</span>
                <span className="text-[#1f3b2c]">FREE</span>
              </div>
            </div>

            <div className="border-t border-[#e2d4b7] pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-[#1f3b2c]">Total</span>
                <span className="text-lg font-bold text-[#1f3b2c]">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-[#1f3b2c] mb-2">Payment Method</h3>
              <div className="text-[#6b7280] space-y-1">
                <p>
                  {order.paymentDetails?.method || (order.paymentStatus === 'paid' ? 'Card' : '—')}
                </p>
                {order.paymentStatus === 'paid' && order.paymentDetails?.transactionId && (
                  <p className="text-xs font-mono">
                    {order.paymentDetails.transactionId}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {order.status === 'delivered' && (
                <button className="w-full bg-[#1f3b2c] text-white py-2 rounded-lg font-medium hover:bg-[#2d4f3c]">
                  Reorder Items
                </button>
              )}
              
              <Link
                href={buildUrl('/dashboard/farmer/marketplace')}
                className="block w-full text-center border border-[#e2d4b7] text-[#1f3b2c] py-2 rounded-lg font-medium hover:bg-[#f9fafb]"
              >
                Continue Shopping
              </Link>
              
              <Link
                href={buildUrl('/dashboard/farmer/marketplace/orders')}
                className="block w-full text-center text-[#6b7280] hover:text-[#1f3b2c] text-sm"
              >
                ← Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
    </div>
  );
}
