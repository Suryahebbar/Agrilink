import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { Product } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose, { Types } from 'mongoose';

interface SupplierOrder {
  _id: Types.ObjectId;
  totalAmount: number;
  orderStatus: string;
  createdAt: Date;
  items: Array<{
    productId: Types.ObjectId | {
      _id: Types.ObjectId;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
}

interface FarmerOrderType {
  _id: Types.ObjectId;
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: Array<{
    productId: Types.ObjectId | string;
    sellerId: Types.ObjectId | string;
    quantity: number;
    price: number;
  }>;
}

interface RecentSupplierOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  customer?: {
    name: string;
  };
  totalAmount: number;
  orderStatus: string;
  createdAt: Date;
}

interface RecentFarmerOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  shipping?: {
    name: string;
  };
  status: string;
  items: Array<{
    sellerId: Types.ObjectId | string;
    price: number;
    quantity: number;
  }>;
  createdAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Authenticate supplier and validate supplierId
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // Default to 30 days

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get orders from Order model (direct supplier orders)
    const supplierOrders = await Order.find({ 
      sellerId: sellerObjectId as any,
      createdAt: { $gte: startDate }
    });

    // Get orders from FarmerOrder model (farmer orders with this supplier's products)
    const farmerOrders = await FarmerOrder.find({
      createdAt: { $gte: startDate },
      'items.sellerId': { $in: [sellerId, sellerObjectId.toString()] }
    });

    // Combine and process orders
    const allOrders = [
      ...supplierOrders.map((o: SupplierOrder) => ({
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
        createdAt: o.createdAt
      })),
      ...farmerOrders.map((o: FarmerOrderType) => ({
        // Calculate total for this supplier's items only
        totalAmount: o.items
          .filter((item: any) => 
            item.sellerId?.toString() === sellerId || 
            item.sellerId?.toString() === sellerObjectId.toString()
          )
          .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        orderStatus: o.status === 'confirmed' ? 'new' : o.status === 'processing' ? 'processing' : o.status === 'shipped' ? 'shipped' : o.status === 'delivered' ? 'delivered' : 'cancelled',
        createdAt: o.createdAt
      }))
    ].filter(o => o.totalAmount > 0);

    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period data for growth calculations
    const previousStartDate = new Date(startDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
    const previousSupplierOrders = await Order.find({ 
      sellerId: sellerObjectId as any,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });
    const previousFarmerOrders = await FarmerOrder.find({
      createdAt: { $gte: previousStartDate, $lt: startDate },
      'items.sellerId': { $in: [sellerId, sellerObjectId.toString()] }
    });

    const previousAllOrders = [
      ...previousSupplierOrders.map((o: SupplierOrder) => ({ totalAmount: o.totalAmount })),
      ...previousFarmerOrders.map((o: FarmerOrderType) => ({
        totalAmount: o.items
          .filter((item: any) => 
            item.sellerId?.toString() === sellerId || 
            item.sellerId?.toString() === sellerObjectId.toString()
          )
          .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      }))
    ].filter(o => o.totalAmount > 0);

    const previousRevenue = previousAllOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const previousOrderCount = previousAllOrders.length;

    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const orderGrowth = previousOrderCount > 0 
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 
      : 0;

    // Get product count
    const activeProducts = await Product.countDocuments({ 
      sellerId: sellerObjectId as any,
      status: 'active'
    });

    // Get product statistics
    const topProducts = await Product.aggregate<{
      _id: Types.ObjectId;
      name: string;
      price: number;
      images: string[];
      orderCount: number;
    }>([
      { $match: { sellerId: sellerObjectId as any } },
      { $project: { name: 1, price: 1, images: 1, orderCount: { $size: { $ifNull: ['$orders', []] } } } },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);

    // Get order status breakdown
    const statusBreakdown: Record<string, number> = {};
    allOrders.forEach((order: { orderStatus: string }) => {
      statusBreakdown[order.orderStatus] = (statusBreakdown[order.orderStatus] || 0) + 1;
    });

    // Get recent orders for dashboard (combine both types)
    const recentSupplierOrders = await Order.find({ sellerId: sellerObjectId as any })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<RecentSupplierOrder[]>();

    const recentFarmerOrders = await FarmerOrder.find({
      'items.sellerId': { $in: [sellerId, sellerObjectId.toString()] },
      createdAt: { $gte: startDate }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<RecentFarmerOrder[]>();

    const recentOrders = [
      ...recentSupplierOrders.map((order: RecentSupplierOrder) => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || 'Customer',
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        date: order.createdAt
      })),
      ...recentFarmerOrders.map((order: RecentFarmerOrder) => {
        const sellerItems = order.items.filter((item: { sellerId: Types.ObjectId | string | null | undefined }) => 
          item.sellerId?.toString() === sellerId || 
          item.sellerId?.toString() === sellerObjectId.toString()
        );
        
        return {
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          customerName: order.shipping?.name || 'Customer',
          totalAmount: sellerItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0),
          status: order.status,
          date: order.createdAt
        };
      })
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        revenue: {
          current: totalRevenue,
          previous: previousRevenue,
          growth: revenueGrowth
        },
        orders: {
          current: totalOrders,
          previous: previousOrderCount,
          growth: orderGrowth
        },
        activeProducts,
        statusBreakdown,
        recentOrders,
        topProducts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
