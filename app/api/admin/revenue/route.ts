import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Seller } from '@/lib/models/supplier';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get revenue data from supplier orders
    const supplierRevenueData = await Order.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }},
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Get revenue data from farmer orders
    const farmerRevenueData = await FarmerOrder.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }},
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
    ]);
    
    const supplierRevenue = supplierRevenueData[0]?.total || 0;
    const farmerRevenue = farmerRevenueData[0]?.total || 0;
    const totalRevenue = supplierRevenue + farmerRevenue;
    
    // Get monthly revenue for trend
    const monthlyRevenueData = await Order.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }},
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        total: { $sum: '$totalAmount' }
      }}
    ]);
    
    const farmerMonthlyRevenueData = await FarmerOrder.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }},
      { $unwind: '$items' },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }}
    ]);
    
    // Combine monthly data
    const monthlyData = new Map();
    monthlyRevenueData.forEach((item: any) => {
      const existing = monthlyData.get(item._id) || { revenue: 0, orders: 0 };
      monthlyData.set(item._id, {
        revenue: existing.revenue + item.total,
        orders: existing.orders + 1
      });
    });
    
    farmerMonthlyRevenueData.forEach((item: any) => {
      const existing = monthlyData.get(item._id) || { revenue: 0, orders: 0 };
      monthlyData.set(item._id, {
        revenue: existing.revenue + item.total,
        orders: existing.orders + 1
      });
    });
    
    // Calculate growth rates
    const previousPeriodStart = new Date(startDate.getTime() - (range === '1y' ? 365 : range === '90d' ? 90 : range === '30d' ? 30 : 7) * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = startDate;
    
    const previousSupplierRevenue = await Order.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
      }},
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const previousFarmerRevenue = await FarmerOrder.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
      }},
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
    ]);
    
    const previousTotalRevenue = (previousSupplierRevenue[0]?.total || 0) + (previousFarmerRevenue[0]?.total || 0);
    const revenueGrowth = previousTotalRevenue > 0 ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 : 0;
    
    // Get top products
    const topProductsData = await Order.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }},
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    const farmerTopProductsData = await FarmerOrder.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }},
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    // Combine top products
    const allTopProducts = new Map();
    topProductsData.forEach((product: any) => {
      const existing = allTopProducts.get(product._id) || { quantity: 0, revenue: 0 };
      allTopProducts.set(product._id, {
        name: product._id,
        quantity: existing.quantity + product.quantity,
        revenue: existing.revenue + product.revenue
      });
    });
    
    farmerTopProductsData.forEach((product: any) => {
      const existing = allTopProducts.get(product._id) || { quantity: 0, revenue: 0 };
      allTopProducts.set(product._id, {
        name: product._id,
        quantity: existing.quantity + product.quantity,
        revenue: existing.revenue + product.revenue
      });
    });
    
    const topProducts = Array.from(allTopProducts.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Get top suppliers
    const topSuppliersData = await Order.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: startDate }
      }},
      { $group: {
        _id: '$sellerId',
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }},
      { $lookup: {
        from: 'suppliers',
        localField: '_id',
        foreignField: '_id',
        as: 'supplier'
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    const topSuppliers = topSuppliersData.map((item: any) => ({
      name: item.supplier?.name || 'Unknown',
      revenue: item.revenue,
      orders: item.orders
    }));

    // Calculate yearly revenue
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearlySupplierRevenue = await Order.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: yearStart }
      }},
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const yearlyFarmerRevenue = await FarmerOrder.aggregate([
      { $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: yearStart }
      }},
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
    ]);
    
    const yearlyRevenue = (yearlySupplierRevenue[0]?.total || 0) + (yearlyFarmerRevenue[0]?.total || 0);
    
    // Format monthly data for chart
    const revenueByMonth = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);

    const stats = {
      totalRevenue,
      monthlyRevenue: totalRevenue,
      yearlyRevenue,
      revenueGrowth,
      monthlyGrowth: revenueGrowth, // Simplified for now
      supplierRevenue,
      farmerRevenue,
      topProducts,
      topSuppliers,
      revenueByMonth
    };

    return NextResponse.json({ stats });
    
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue statistics' },
      { status: 500 }
    );
  }
}
