import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/models/supplier';
import { InventoryLog } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';

// POST /api/supplier/[supplierId]/inventory/quick-update - Quick stock update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { sellerId } = await requireAuth(request, { params: resolvedParams });
    
    const { productId, quantity, reason } = await request.json();
    
    if (!productId || quantity === undefined || !reason) {
      return NextResponse.json(
        { error: 'Product ID, quantity, and reason are required' },
        { status: 400 }
      );
    }

    const sellerObjectId = new Types.ObjectId(sellerId);
    const productObjectId = new Types.ObjectId(productId);
    
    // Find the product and verify ownership
    const product = await Product.findOne({
      _id: productObjectId,
      sellerId: new Types.ObjectId(sellerId)
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Store previous stock for logging
    const previousStock = product.stockQuantity;
    const newStock = parseInt(quantity);
    const change = newStock - previousStock;
    
    // Update product stock
    product.stockQuantity = newStock;
    await product.save();
    
    // Create inventory log
    const inventoryLog = new InventoryLog({
      productId: productObjectId,
      sellerId: sellerObjectId,
      change: change,
      reason: reason,
      previousStock: previousStock,
      newStock: newStock
    });
    
    await inventoryLog.save();
    
    return NextResponse.json({
      message: 'Inventory updated successfully',
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        previousStock: previousStock,
        change: change
      }
    });
    
  } catch (error: unknown) {
    console.error('Error updating inventory:', error);
    const statusCode = error instanceof Error && 'status' in error ? 
      (typeof (error as { status: unknown }).status === 'number' ? (error as { status: number }).status : 500) : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update inventory' },
      { status: statusCode }
    );
  }
}
