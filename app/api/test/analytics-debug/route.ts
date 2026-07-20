import { NextResponse } from 'next/server';
import { Order, Product, DailyAnalytics } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    console.log('=== Analytics Debug ===');
    
    // Test basic data fetching
    const sellerId = '6937e4d94cae15b75c9e255e';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    console.log('Seller ID:', sellerId);
    console.log('Start Date:', startDate);
    
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    
    // Test individual queries
    const supplierOrders = await Order.find({ sellerId: sellerObjectId as any }).limit(5);
    const farmerOrders = await FarmerOrder.find({ 'items.sellerId': sellerId as any }).limit(5);
    
    console.log('Supplier orders found:', supplierOrders.length);
    console.log('Farmer orders found:', farmerOrders.length);
    
    // Test aggregations
    const supplierRevenue = await Order.aggregate([
      { $match: { sellerId: sellerObjectId as any, paymentStatus: { $in: ['paid', null] }, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const farmerRevenue = await FarmerOrder.aggregate([
      { $match: { 'items.sellerId': sellerId as any, paymentStatus: { $in: ['paid', null] }, createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $match: { 'items.sellerId': sellerId as any } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
    ]);
    
    console.log('Supplier revenue:', supplierRevenue);
    console.log('Farmer revenue:', farmerRevenue);
    
    return NextResponse.json({
      message: 'Analytics debug completed',
      data: {
        supplierOrders: supplierOrders.length,
        farmerOrders: farmerOrders.length,
        supplierRevenue: supplierRevenue[0]?.total || 0,
        farmerRevenue: farmerRevenue[0]?.total || 0,
        totalRevenue: (supplierRevenue[0]?.total || 0) + (farmerRevenue[0]?.total || 0)
      }
    });
    
  } catch (error) {
    console.error('Analytics debug error:', error);
    return NextResponse.json(
      { error: 'Analytics debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
