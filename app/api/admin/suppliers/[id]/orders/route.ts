import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      await connectDB();

      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const page = parseInt(searchParams.get('page') || '1', 10);

      const query = { sellerId: id as any };

      const totalOrders = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Compute aggregated tax & earnings figures for administrative audit
      const totals = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalGross: { $sum: '$totalAmount' },
            totalPlatformFees: { $sum: '$platformFeeAmount' },
            totalSellerEarnings: { $sum: '$sellerEarnings' },
            paidOrdersCount: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
            }
          }
        }
      ]);

      const summary = totals[0] || {
        totalGross: 0,
        totalPlatformFees: 0,
        totalSellerEarnings: 0,
        paidOrdersCount: 0
      };

      return NextResponse.json({
        success: true,
        data: orders,
        summary,
        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit) || 1
        }
      });
    } catch (error) {
      console.error('Error fetching supplier orders for admin:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supplier orders' },
        { status: 500 }
      );
    }
  })(request, { params });
}
