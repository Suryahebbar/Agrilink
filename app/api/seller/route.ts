import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/seller';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// GET /api/seller - Get seller info
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;
    
    // Get seller info
    const seller = await Seller.findById(sellerId).select('-passwordHash');
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ seller });
    
  } catch (error) {
    console.error('Error fetching seller info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller info' },
      { status: 500 }
    );
  }
}
