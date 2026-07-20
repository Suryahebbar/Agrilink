import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceOrder } from '@/lib/models/marketplace-order';
import { connectDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    // Find order by orderId
    const order = await MarketplaceOrder.findOne({ orderId: id }).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Format order for tracking
    const formattedOrder = {
      orderId: order.orderId,
      customerDetails: order.customerDetails,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      statusHistory: order.statusHistory || [],
      shippingDetails: order.shippingDetails,
      paymentDetails: order.paymentDetails,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    return NextResponse.json({
      order: formattedOrder
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, trackingNumber, comment } = body;

    await connectDB();

    const order = await MarketplaceOrder.findOne({ orderId: id });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let newStatus = order.status;
    let statusComment = comment || '';

    switch (action) {
      case 'ship':
        newStatus = 'shipped';
        if (trackingNumber) {
          order.shippingDetails.trackingNumber = trackingNumber;
        }
        statusComment = statusComment || 'Order has been shipped';
        break;
      
      case 'deliver':
        newStatus = 'delivered';
        statusComment = statusComment || 'Order has been delivered';
        break;
      
      case 'cancel':
        newStatus = 'cancelled';
        statusComment = statusComment || 'Order has been cancelled';
        
        // Restore stock for cancelled items
        // Note: Order model import needed for stock restoration
        // for (const item of order.items) {
        //   await Order.findByIdAndUpdate(item.productId, {
        //     $inc: { 'inventory.currentStock': item.quantity }
        //   });
        // }
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update order status
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      updatedBy: 'system', // This would be the user ID in a real system
      comment: statusComment
    });

    if (action === 'ship') {
      order.shippingDetails.status = 'shipped';
    } else if (action === 'deliver') {
      order.shippingDetails.status = 'delivered';
    }

    await order.save();

    return NextResponse.json({
      message: `Order ${action}ed successfully`,
      order: {
        orderId: order.orderId,
        status: order.status,
        trackingNumber: order.shippingDetails.trackingNumber,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
