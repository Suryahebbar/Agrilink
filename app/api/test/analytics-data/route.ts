import { NextResponse, NextRequest } from 'next/server';
import { Order, Product, DailyAnalytics } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

// Type for top products aggregation result
interface TopProductAggregation {
  _id: mongoose.Types.ObjectId | null;
  name: string;
  quantity: number;
  revenue: number;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const sellerId = '6937e4d94cae15b75c9e255e'; // Hardcoded for testing
    const range = '7d';
    const productId = searchParams.get('productId'); // Get productId from query params
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 7);

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const productFilter = productId ? new mongoose.Types.ObjectId(productId) : null;
    
    // Get basic analytics data
    const [
      supplierRevenueData,
      farmerRevenueData,
      supplierOrdersData,
      farmerOrdersData,
      categoryData,
      dailyStats,
      activeProductsCount
    ] = await Promise.all([
      // Total revenue from supplier orders
      Order.aggregate([
        { 
          $match: { 
            sellerId: sellerObjectId, 
            paymentStatus: { $in: ['paid', null] }, 
            createdAt: { $gte: startDate },
            ...(productFilter && { 'items.productId': productFilter })
          } 
        },
        { $unwind: '$items' },
        ...(productFilter ? [{ $match: { 'items.productId': productFilter } }] : []),
        { $group: { _id: null, total: { $sum: '$items.total' } } }
      ]),
      // Total revenue from farmer orders
      FarmerOrder.aggregate([
        { 
          $match: { 
            'items.sellerId': sellerId, 
            paymentStatus: { $in: ['paid', null] }, 
            createdAt: { $gte: startDate },
            ...(productFilter && { 'items.productId': productFilter })
          } 
        },
        { $unwind: '$items' },
        { $match: { 'items.sellerId': sellerId } },
        ...(productFilter ? [{ $match: { 'items.productId': productFilter } }] : []),
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      // Total supplier orders
      Order.aggregate([
        { 
          $match: { 
            sellerId: sellerObjectId, 
            createdAt: { $gte: startDate },
            ...(productFilter && { 'items.productId': productFilter })
          } 
        },
        ...(productFilter ? [{ $unwind: '$items' }, { $match: { 'items.productId': productFilter } }] : []),
        { $count: "total" }
      ]),
      // Total farmer orders
      FarmerOrder.aggregate([
        { 
          $match: { 
            'items.sellerId': sellerId, 
            createdAt: { $gte: startDate },
            ...(productFilter && { 'items.productId': productFilter })
          } 
        },
        { $unwind: '$items' },
        { $match: { 'items.sellerId': sellerId } },
        ...(productFilter ? [{ $match: { 'items.productId': productFilter } }] : []),
        { $count: "total" }
      ]),
      // Category breakdown
      Order.aggregate([
        { 
          $match: { 
            sellerId: sellerObjectId, 
            paymentStatus: { $in: ['paid', null] }, 
            createdAt: { $gte: startDate }
          } 
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'supplierproducts',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.category',
            revenue: { $sum: '$items.total' },
            orders: { $sum: 1 }
          }
        }
      ]),
      // Daily analytics
      DailyAnalytics.aggregate([
        { 
          $match: { 
            sellerId: sellerObjectId, 
            date: { $gte: startDate }
          } 
        },
        { $sort: { date: -1 } }
      ]),
      Product.countDocuments({ sellerId: sellerObjectId, status: 'active' } as any)
    ]);

    // Get top products
    let supplierTopProductsAggregation = [];
    let farmerTopProductsAggregation = [];
    
    [supplierTopProductsAggregation, farmerTopProductsAggregation] = await Promise.all([
      Order.aggregate([
        { $match: { sellerId: sellerObjectId, paymentStatus: { $in: ['paid', null] }, createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),
      FarmerOrder.aggregate([
        { $match: { 'items.sellerId': sellerId, paymentStatus: { $in: ['paid', null] }, createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        { $match: { 'items.sellerId': sellerId } },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ])
    ]);

    const totalRevenue = (supplierRevenueData[0]?.total || 0) + (farmerRevenueData[0]?.total || 0);
    const totalOrders = (supplierOrdersData[0]?.total || 0) + (farmerOrdersData[0]?.total || 0);

    // Combine top products
    const allTopProducts = [
      ...supplierTopProductsAggregation.map((product: TopProductAggregation) => ({
        productId: product._id?.toString() ?? '',
        name: product.name,
        quantity: product.quantity,
        revenue: product.revenue
      })),
      ...farmerTopProductsAggregation.map((product: TopProductAggregation) => ({
        productId: product._id?.toString() ?? '',
        name: product.name,
        quantity: product.quantity,
        revenue: product.revenue
      }))
    ];

    const topProductsMap = new Map();
    allTopProducts.forEach(product => {
      const existing = topProductsMap.get(product.productId);
      if (existing) {
        existing.quantity += product.quantity;
        existing.revenue += product.revenue;
      } else {
        topProductsMap.set(product.productId, { ...product });
      }
    });

    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Format category data
    const totalCategoryRevenue = categoryData.reduce((sum: number, cat: any) => sum + (cat.revenue || 0), 0);
    const categoryBreakdown = categoryData.map((cat: any) => ({
      category: cat._id || 'other',
      revenue: cat.revenue || 0,
      orders: cat.orders || 0,
      percentage: totalCategoryRevenue > 0 ? parseFloat(((cat.revenue || 0) / totalCategoryRevenue * 100).toFixed(2)) : 0
    }));

    const overview = {
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      activeProducts: activeProductsCount || 0,
      revenueGrowth: 0,
      orderGrowth: 0
    };

    const salesChart = dailyStats
      .map((day: any) => ({
        date: day.date,
        revenue: day.revenue ?? 0,
        orders: day.orders ?? 0
      }))
      .sort((a: { date: Date }, b: { date: Date }) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      overview,
      salesChart,
      topProducts,
      categoryBreakdown,
      debug: {
        supplierRevenueData,
        farmerRevenueData,
        supplierOrdersData,
        farmerOrdersData,
        dailyStats
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
