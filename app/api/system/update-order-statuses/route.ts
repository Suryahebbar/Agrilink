import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Order } from '@/lib/models/supplier';

// Order progression timeline (3-day delivery with randomization)
const ORDER_TIMELINE = {
  // Day 0: Order placed
  'confirmed': {
    nextStatus: 'processing',
    waitHours: () => {
      // Random between 8-24 hours (0.33-1 day) - ensures max 3 days total
      return Math.floor(Math.random() * 16) + 8;
    },
    description: 'Order confirmed, preparing for shipment'
  },
  // Day 1: Processing
  'processing': {
    nextStatus: 'shipped',
    waitHours: () => {
      // Random between 8-24 hours (0.33-1 day) - ensures max 3 days total
      return Math.floor(Math.random() * 16) + 8;
    },
    description: 'Order is being processed and prepared'
  },
  // Day 2: Shipped
  'shipped': {
    nextStatus: 'delivered',
    waitHours: () => {
      // Random between 8-24 hours (0.33-1 day) - ensures max 3 days total
      return Math.floor(Math.random() * 16) + 8;
    },
    description: 'Order has been shipped and is in transit'
  },
  // Day 3: Delivered
  'delivered': {
    nextStatus: null,
    waitHours: null,
    description: 'Order has been delivered successfully'
  }
};

export async function POST() {
  try {
    await connectDB();
    
    console.log('=== Starting Order Status Update ===');
    
    let updatedFarmerOrders = 0;
    let updatedSupplierOrders = 0;
    
    // Update Farmer Orders
    const farmerOrders = await FarmerOrder.find({
      status: { $in: ['confirmed', 'processing', 'shipped'] }
    });
    
    console.log(`Processing ${farmerOrders.length} farmer orders`);
    
    for (const order of farmerOrders) {
      const timeline = ORDER_TIMELINE[order.status as keyof typeof ORDER_TIMELINE];
      
      if (timeline && timeline.nextStatus) {
        const statusAge = Date.now() - order.updatedAt.getTime();
        const waitTime = (typeof (timeline as any).waitHours === 'function' ? (timeline as any).waitHours() : (timeline as any).waitHours) * 60 * 60 * 1000; // Convert hours to milliseconds
        
        if (statusAge >= waitTime) {
          // Update order status
          const previousStatus = order.status;
          order.status = timeline.nextStatus as any;
          
          // Add to status history
          order.statusHistory.push({
            status: timeline.nextStatus as any,
            timestamp: new Date(),
            note: `Status automatically updated from ${previousStatus} after ${typeof (timeline as any).waitHours === 'function' ? (timeline as any).waitHours() : (timeline as any).waitHours} hours`
          });
          
          // Update tracking information if shipped
          if (timeline.nextStatus === 'shipped') {
            order.tracking.shippedAt = new Date();
            order.tracking.currentLocation = 'In Transit - Distribution Center';
          }
          
          // Update tracking information if delivered
          if (timeline.nextStatus === 'delivered') {
            order.tracking.deliveredAt = new Date();
            order.tracking.currentLocation = 'Delivered';
            order.tracking.actualDelivery = new Date();
          }
          
          await order.save();
          updatedFarmerOrders++;
          
          console.log(`Farmer order ${order.orderNumber}: ${previousStatus} → ${timeline.nextStatus}`);
        }
      }
    }
    
    // Update Supplier Orders
    const supplierOrders = await Order.find({
      orderStatus: { $in: ['new', 'processing', 'shipped'] }
    });
    
    console.log(`Processing ${supplierOrders.length} supplier orders`);
    
    for (const order of supplierOrders) {
      const timeline = ORDER_TIMELINE[order.orderStatus === 'new' ? 'confirmed' : order.orderStatus as keyof typeof ORDER_TIMELINE];
      
      if (timeline && timeline.nextStatus) {
        const statusAge = Date.now() - order.updatedAt.getTime();
        const waitTime = (typeof (timeline as any).waitHours === 'function' ? (timeline as any).waitHours() : (timeline as any).waitHours) * 60 * 60 * 1000; // Convert hours to milliseconds
        
        if (statusAge >= waitTime) {
          // Update order status
          const previousStatus = order.orderStatus;
          order.orderStatus = (timeline.nextStatus === 'confirmed' ? 'new' : timeline.nextStatus) as any;
          
          // Update tracking information if shipped
          if (timeline.nextStatus === 'shipped') {
            if (!order.shippingDetails) {
              order.shippingDetails = {} as any;
            }
            (order.shippingDetails as any).shippedAt = new Date();
          }
          
          await order.save();
          updatedSupplierOrders++;
          
          console.log(`Supplier order ${order.orderNumber}: ${previousStatus} → ${order.orderStatus}`);
        }
      }
    }
    
    return NextResponse.json({
      message: 'Order status update completed',
      stats: {
        updatedFarmerOrders,
        updatedSupplierOrders,
        totalProcessed: farmerOrders.length + supplierOrders.length
      },
      timeline: ORDER_TIMELINE
    });
    
  } catch (error) {
    console.error('Error updating order statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update order statuses' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current order status distribution
export async function GET() {
  try {
    await connectDB();
    
    // Farmer order status distribution
    const farmerOrderStats = await FarmerOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Supplier order status distribution
    const supplierOrderStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return NextResponse.json({
      message: 'Order status distribution',
      farmerOrders: farmerOrderStats,
      supplierOrders: supplierOrderStats,
      timeline: ORDER_TIMELINE
    });
    
  } catch (error) {
    console.error('Error fetching order status distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status distribution' },
      { status: 500 }
    );
  }
}
