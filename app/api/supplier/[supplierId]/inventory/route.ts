import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product, InventoryLog } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;

    const query: Record<string, unknown> = {
      sellerId: new mongoose.Types.ObjectId(sellerId)
    };

    const products = await Product.find(query).sort({ stockQuantity: 1 }).lean();

    const lowStock = products.filter((p: any) => p.stockQuantity <= (p.reorderThreshold || 5));
    const outOfStock = products.filter((p: any) => p.stockQuantity === 0);

    const logs = await InventoryLog.find({ sellerId: new mongoose.Types.ObjectId(sellerId) })
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        inStockCount: products.length - lowStock.length
      },
      products,
      lowStock,
      recentLogs: logs
    });
  } catch (error: any) {
    console.error('Error fetching supplier inventory:', error);
    return NextResponse.json({ error: error.message || 'Failed to load inventory' }, { status: 500 });
  }
}
