import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/supplier';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Verify admin token
    const token = request.headers.get('cookie')?.split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Find products by seller ID
    const products = await Product.find({ sellerId: id })
      .select('name sku price stockQuantity status')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
