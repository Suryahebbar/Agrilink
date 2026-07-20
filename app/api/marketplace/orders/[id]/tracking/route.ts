import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceOrder } from '@/lib/models/marketplace-order';
import { connectDB } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    
    await connectDB();

    const order = await MarketplaceOrder.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate tracking events based on order status and timestamps
    const trackingEvents = generateTrackingEvents(order);

    return NextResponse.json({
      orderId: order._id,
      orderNumber: order.orderId,
      status: order.status,
      trackingEvents,
      estimatedDelivery: order.estimatedDelivery,
      trackingNumber: order.trackingNumber
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking information' }, { status: 500 });
  }
}

function generateTrackingEvents(order: any) {
  const events = [];
  const now = new Date();
  
  // Order placed
  events.push({
    id: 'order_placed',
    title: 'Order Placed',
    description: `Your order ${order.orderId} has been placed successfully`,
    timestamp: order.createdAt,
    status: 'completed',
    icon: 'shopping-cart',
    location: 'Online'
  });

  // Order confirmed
  if (order.status !== 'pending') {
    const confirmedTime = new Date(order.createdAt);
    confirmedTime.setHours(confirmedTime.getHours() + 1);
    
    events.push({
      id: 'order_confirmed',
      title: 'Order Confirmed',
      description: 'Your order has been confirmed and is being processed',
      timestamp: order.confirmedAt || confirmedTime,
      status: 'completed',
      icon: 'check-circle',
      location: 'Processing Center'
    });
  }

  // Order processing
  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    const processingTime = new Date(order.createdAt);
    processingTime.setHours(processingTime.getHours() + 12);
    
    events.push({
      id: 'order_processing',
      title: 'Order Processing',
      description: 'Your order is being prepared for shipment',
      timestamp: processingTime,
      status: 'completed',
      icon: 'package',
      location: 'Warehouse'
    });
  }

  // Order shipped
  if (['shipped', 'delivered'].includes(order.status)) {
    const shippedTime = new Date(order.createdAt);
    shippedTime.setDate(shippedTime.getDate() + 1);
    
    events.push({
      id: 'order_shipped',
      title: 'Order Shipped',
      description: `Your order has been shipped via ${order.shippingCarrier || 'Standard Shipping'}`,
      timestamp: order.shippedAt || shippedTime,
      status: 'completed',
      icon: 'truck',
      location: 'Distribution Center',
      trackingNumber: order.trackingNumber
    });
  }

  // In transit
  if (['shipped', 'delivered'].includes(order.status)) {
    const transitTime = new Date(order.createdAt);
    transitTime.setDate(transitTime.getDate() + 2);
    
    events.push({
      id: 'in_transit',
      title: 'In Transit',
      description: 'Your package is on its way to your location',
      timestamp: transitTime,
      status: order.status === 'shipped' ? 'active' : 'completed',
      icon: 'navigation',
      location: 'In Transit'
    });
  }

  // Out for delivery
  if (order.status === 'delivered') {
    const deliveryTime = new Date(order.createdAt);
    deliveryTime.setDate(deliveryTime.getDate() + 3);
    
    events.push({
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Your package is out for delivery and will arrive today',
      timestamp: deliveryTime,
      status: 'completed',
      icon: 'truck',
      location: 'Local Facility'
    });
  }

  // Delivered
  if (order.status === 'delivered') {
    const deliveredTime = order.deliveredAt || new Date(order.createdAt);
    deliveredTime.setDate(deliveredTime.getDate() + 3);
    
    events.push({
      id: 'delivered',
      title: 'Delivered',
      description: 'Your package has been successfully delivered',
      timestamp: deliveredTime,
      status: 'completed',
      icon: 'check-circle',
      location: order.shippingAddress?.city || 'Your Location'
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
