import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, Product } from '@/lib/models/supplier';
import { FarmerOrder as FarmerOrderModel } from '@/lib/models/FarmerOrder';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose, { Types } from 'mongoose';

interface FarmerOrderItem {
  sellerId: Types.ObjectId | string | null;
  productId: Types.ObjectId | string | null;
  quantity: number;
  price: number;
}

interface FarmerOrder {
  _id: Types.ObjectId;
  items: FarmerOrderItem[];
  status: string;
  createdAt: Date;
}

interface ProductStats {
  totalSold: number;
  totalRevenue: number;
  orderCount: number;
  _id?: Types.ObjectId;
  name?: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || '30'; // Default to 30 days

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get top selling products from supplier orders
    const supplierTopProducts = await Order.aggregate([
      { 
        $match: { 
          sellerId: sellerObjectId as any, 
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'returned'] }
        } 
      },
      { $unwind: '$items' },
      { 
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit * 2 }, // Get more to account for filtering
      {
        $lookup: {
          from: 'supplierproducts',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          sku: '$product.sku',
          price: '$product.price',
          stockQuantity: '$product.stockQuantity',
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    // Get top products from farmer orders
    const farmerOrders = await FarmerOrderModel.find({
      createdAt: { $gte: startDate },
      status: { $nin: ['cancelled'] },
      'items.sellerId': { $in: [sellerId, sellerObjectId.toString()] }
    }).lean<FarmerOrder[]>();

    // Aggregate farmer order items
    const farmerProductMap = new Map<string, ProductStats>();
    farmerOrders.forEach((order: FarmerOrder) => {
      order.items.forEach((item: FarmerOrderItem) => {
        if (item.sellerId?.toString() === sellerId || item.sellerId?.toString() === sellerObjectId.toString()) {
          const productId = item.productId?.toString();
          if (productId) {
            const existing = farmerProductMap.get(productId) || { 
              totalSold: 0, 
              totalRevenue: 0, 
              orderCount: 0 
            };
            farmerProductMap.set(productId, {
              ...existing,
              totalSold: existing.totalSold + (item.quantity || 0),
              totalRevenue: existing.totalRevenue + ((item.price || 0) * (item.quantity || 0)),
              orderCount: existing.orderCount + 1
            });
          }
        }
      });
    });

    // Combine results
    const combinedMap = new Map<string, ProductStats>();
    
    // Add supplier order products
    supplierTopProducts.forEach((product: ProductStats) => {
      if (product._id) {
        combinedMap.set(product._id.toString(), product);
      }
    });
    
    // Add/update with farmer order products
    farmerProductMap.forEach((stats: ProductStats, productId: string) => {
      const existing = combinedMap.get(productId);
      if (existing) {
        existing.totalSold = (existing.totalSold || 0) + (stats.totalSold || 0);
        existing.totalRevenue = (existing.totalRevenue || 0) + (stats.totalRevenue || 0);
        existing.orderCount = (existing.orderCount || 0) + (stats.orderCount || 0);
      } else {
        combinedMap.set(productId, {
          _id: new mongoose.Types.ObjectId(productId),
          name: 'Unknown Product',
          totalSold: stats.totalSold || 0,
          totalRevenue: stats.totalRevenue || 0,
          orderCount: stats.orderCount || 0
        });
      }
    });
    
    // Convert to array and sort by total sold
    const topProducts = Array.from(combinedMap.values())
      .sort((a: ProductStats, b: ProductStats) => (b.totalSold || 0) - (a.totalSold || 0))
      .slice(0, limit);

    return NextResponse.json({ products: topProducts });
  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top products' },
      { status: 500 }
    );
  }
}
