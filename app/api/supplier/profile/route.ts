import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// GET /api/supplier/profile - Get supplier profile (non-dynamic route)
export async function GET(request: NextRequest) {
  try {
    console.log('Profile API: Starting request');
    await connectDB();
    
    // Authenticate supplier
    const auth = await requireAuth(request);
    console.log('Profile API: Auth successful, sellerId:', auth.sellerId);
    const sellerId = auth.sellerId;
    
    // Get supplier profile
    const supplier = await Seller.findById(sellerId).select('-passwordHash -otp -otpExpiry').lean();
    console.log('Profile API: Supplier found:', !!supplier);
    
    if (!supplier) {
      console.log('Profile API: Supplier not found for ID:', sellerId);
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    console.log('Profile API: Returning supplier data');
    return NextResponse.json({ seller: supplier });
    
  } catch (error: any) {
    console.error('Error fetching supplier profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: error.status || 500 }
    );
  }
}
