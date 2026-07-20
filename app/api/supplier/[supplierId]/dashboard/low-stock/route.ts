import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose from 'mongoose';

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

    // Get low stock products
    const lowStockProducts = await Product.find({ 
      sellerId: sellerObjectId as any,
      $expr: { $lte: ['$stockQuantity', '$reorderThreshold'] }
    })
    .sort({ stockQuantity: 1 })
    .limit(limit)
    .lean();

    return NextResponse.json({ products: lowStockProducts });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
}
