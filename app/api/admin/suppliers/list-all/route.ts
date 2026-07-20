import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { Product } from '@/lib/models/supplier';
import { Order } from '@/lib/models/supplier';
import { Types } from 'mongoose';

interface SupplierType {
  _id: Types.ObjectId;
  companyName?: string;
  email: string;
  phone?: string;
  verificationStatus?: string;
  createdAt: Date;
  // Add other fields as needed
}

export async function GET() {
  try {
    await connectDB();
    
    // Get all suppliers with full details
    const suppliers = await Seller.find({})
      .select('-passwordHash -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get additional stats for each supplier
    const suppliersWithStats = await Promise.all(
      suppliers.map(async (supplier: SupplierType) => {
        const productsCount = await Product.countDocuments({ 
          sellerId: supplier._id as any 
        });
        
        const ordersCount = await Order.countDocuments({ 
          sellerId: supplier._id as any 
        });
        
        const revenueData = await Order.aggregate([
          { $match: { sellerId: supplier._id as any, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        return {
          ...supplier,
          stats: {
            productsCount,
            ordersCount,
            totalRevenue: revenueData[0]?.total || 0
          }
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      count: suppliersWithStats.length,
      suppliers: suppliersWithStats
    });
    
  } catch (error) {
    console.error('Error fetching all suppliers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch suppliers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
