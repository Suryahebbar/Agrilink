import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();
    
    const resolvedParams = await context.params;
    const orderId = resolvedParams.orderId;
    const body = await request.json();
    const { status } = body;
    
    // Try supplier order first
    let order = await Order.findById(orderId);
    if (order) {
      (order as any).status = status;
      await order.save();
      return NextResponse.json({ message: 'Order status updated successfully' });
    }
    
    // Try farmer order
    order = await FarmerOrder.findById(orderId);
    if (order) {
      (order as any).status = status;
      await order.save();
      return NextResponse.json({ message: 'Order status updated successfully' });
    }
    
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
