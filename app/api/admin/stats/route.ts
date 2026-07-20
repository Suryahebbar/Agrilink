import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { Order } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';

export async function GET() {
  try {
    await connectDB();
    
    // Get comprehensive admin statistics
    const [
      totalSuppliers,
      activeSuppliers,
      pendingSuppliers,
      totalFarmers,
      activeFarmers,
      totalOrders,
      pendingOrders,
      totalRevenue,
      monthlyRevenue,
      documentStats
    ] = await Promise.all([
      Seller.countDocuments(),
      Seller.countDocuments({ status: 'active' }),
      Seller.countDocuments({ status: 'pending' }),
      FarmerProfile.countDocuments(),
      FarmerProfile.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      FarmerOrder.aggregate([
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      
      // Monthly revenue
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      FarmerOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      
      // Document statistics (mock data for now)
      new Promise(resolve => resolve({ pending: 5, approved: 12 }))
    ]);

    return NextResponse.json({
      totalSuppliers,
      activeSuppliers,
      pendingSuppliers,
      totalFarmers,
      activeFarmers,
      totalOrders: (totalOrders || 0) + (totalFarmers || 0),
      pendingOrders: (pendingOrders || 0) + (pendingOrders || 0),
      totalRevenue: (totalRevenue?.[0]?.total || 0) + (monthlyRevenue?.[0]?.total || 0) + (monthlyRevenue?.[1]?.total || 0),
      monthlyRevenue: (monthlyRevenue?.[0]?.total || 0) + (monthlyRevenue?.[1]?.total || 0),
      pendingDocuments: (documentStats as any)?.pending || 0,
      approvedDocuments: (documentStats as any)?.approved || 0
    });
    
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
