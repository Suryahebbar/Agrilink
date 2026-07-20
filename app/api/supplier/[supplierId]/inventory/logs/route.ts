import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { InventoryLog, Product } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import { Types } from 'mongoose';

// GET /api/supplier/[supplierId]/inventory/logs - Get inventory logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    // Authenticate supplier
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Get inventory logs
    const logs = await InventoryLog.find({ sellerId: new Types.ObjectId(sellerId) })
      .populate('productId', 'name sku', 'SupplierProduct')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await InventoryLog.countDocuments({ sellerId: new Types.ObjectId(sellerId) });
    
    return NextResponse.json({ 
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error: unknown) {
    console.error('Error fetching inventory logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch inventory logs' },
      { status: 500 }
    );
  }
}

// POST /api/supplier/[supplierId]/inventory/logs - Create inventory log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    // Authenticate supplier
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    const body = await request.json();
    const { productId, change, reason, notes } = body;
    
    if (!productId || !change || !reason) {
      return NextResponse.json(
        { error: 'ProductId, change, and reason are required' },
        { status: 400 }
      );
    }
    
    // Get current product stock
    const product = await Product.findOne({ _id: productId, sellerId: new Types.ObjectId(sellerId) });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const previousStock = product.stockQuantity;
    const newStock = previousStock + change;
    
    // Validate new stock
    if (newStock < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }
    
    // Update product stock
    await Product.findByIdAndUpdate(productId, { stockQuantity: newStock });
    
    // Create inventory log
    const log = await InventoryLog.create({
      productId: new Types.ObjectId(productId),
      sellerId: new Types.ObjectId(sellerId),
      change,
      reason,
      previousStock,
      newStock,
      notes
    });
    
    return NextResponse.json({ 
      message: 'Inventory log created successfully',
      log: await InventoryLog.findById(log._id).populate('productId', 'name sku', 'SupplierProduct')
    });
    
  } catch (error: unknown) {
    console.error('Error creating inventory log:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inventory log' },
      { status: 500 }
    );
  }
}
