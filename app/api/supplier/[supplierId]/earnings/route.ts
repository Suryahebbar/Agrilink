import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();

    const { supplierId } = await params;

    // Authenticate seller
    const auth = await requireAuth(request, { params: { supplierId } });
    const sellerId = auth.sellerId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Fetch all orders for this seller
    const orders = await Order.find({ sellerId: sellerObjectId })
      .sort({ createdAt: -1 })
      .select('orderNumber totalAmount platformFeeRate platformFeeAmount sellerEarnings paymentStatus orderStatus createdAt customer')
      .lean();

    let totalGrossSales = 0;
    let totalPlatformFees = 0;
    let totalNetEarnings = 0;
    let paidEarnings = 0;
    let pendingEarnings = 0;

    const formattedOrders = orders.map((order: any) => {
      const gross = Number(order.totalAmount || 0);
      const feeRate = typeof order.platformFeeRate === 'number' ? order.platformFeeRate : 0.05;
      const fee = typeof order.platformFeeAmount === 'number' ? order.platformFeeAmount : Math.round(gross * feeRate * 100) / 100;
      const net = typeof order.sellerEarnings === 'number' ? order.sellerEarnings : Math.round((gross - fee) * 100) / 100;

      totalGrossSales += gross;
      totalPlatformFees += fee;
      totalNetEarnings += net;

      if (order.paymentStatus === 'paid') {
        paidEarnings += net;
      } else {
        pendingEarnings += net;
      }

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || 'Customer',
        customerCity: order.customer?.address?.city || '',
        createdAt: order.createdAt,
        grossAmount: gross,
        feeRate: feeRate * 100, // percentage e.g. 5%
        feeAmount: fee,
        netAmount: net,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      };
    });

    return NextResponse.json({
      summary: {
        totalGrossSales: Math.round(totalGrossSales * 100) / 100,
        totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
        totalNetEarnings: Math.round(totalNetEarnings * 100) / 100,
        paidEarnings: Math.round(paidEarnings * 100) / 100,
        pendingEarnings: Math.round(pendingEarnings * 100) / 100,
        totalOrders: orders.length,
        defaultCommissionRate: 5, // 5%
      },
      transactions: formattedOrders,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Unauthorized access to this supplier resource') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    console.error('Error fetching seller earnings:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
