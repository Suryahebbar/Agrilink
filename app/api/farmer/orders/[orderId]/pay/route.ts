import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Order as SupplierOrder } from '@/lib/models/supplier';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;

    const { searchParams } = new URL(req.url);
    const userIdFromQuery = searchParams.get('userId');

    const body = (await req.json().catch(() => ({}))) as {
      userId?: string;
      paymentMethod?: 'card' | 'upi' | 'netbanking' | 'wallet';
    };

    const userId = body.userId || userIdFromQuery;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const orderId = resolvedParams.orderId;
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    await connectDB();

    const order = await FarmerOrder.findById(orderId).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const ownerId = (order.userId || order.user)?.toString();
    if (!ownerId || ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        message: 'Order already paid',
        transactionId: order.paymentDetails?.transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
        orderId: order._id?.toString?.() || orderId,
        orderNumber: order.orderNumber
      });
    }

    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const paidAt = new Date();
    const method = body.paymentMethod;

    // Update FarmerOrder payment status
    await FarmerOrder.updateOne(
      { _id: orderId },
      {
        $set: {
          paymentStatus: 'paid',
          paymentDetails: {
            method,
            transactionId,
            paidAt
          }
        },
        $push: {
          statusHistory: {
            status: 'paid',
            timestamp: new Date(),
            note: `Payment received via ${method || 'gateway'}. Transaction ${transactionId}`
          }
        }
      }
    );

    // Update all linked supplier orders by orderNumber prefix (AGRxxxxx-....)
    const orderNumber = typeof order.orderNumber === 'string' ? order.orderNumber : '';
    if (orderNumber) {
      const escaped = orderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await SupplierOrder.updateMany(
        { orderNumber: { $regex: `^${escaped}-` } },
        { 
          $set: { 
            paymentStatus: 'paid',
            paymentDetails: {
              method,
              transactionId,
              paidAt
            }
          } 
        }
      );
    }

    return NextResponse.json({
      message: 'Payment processed successfully',
      transactionId,
      orderId: order._id?.toString?.() || orderId,
      orderNumber: order.orderNumber
    });
  } catch (err) {
    console.error('POST /api/farmer/orders/[orderId]/pay error:', err);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
