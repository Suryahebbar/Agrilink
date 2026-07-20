import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; productId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { sellerId } = await requireAuth(request, { params: resolvedParams });
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    
    const product = await Product.findOne({
      _id: resolvedParams.productId,
      sellerId: sellerObjectId as any
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; productId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { sellerId } = await requireAuth(request, { params: resolvedParams });
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    
    const data = await request.json();
    
    const product = await Product.findOneAndUpdate(
      { _id: resolvedParams.productId, sellerId: sellerObjectId as any },
      { $set: data },
      { new: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; productId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { sellerId } = await requireAuth(request, { params: resolvedParams });
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    
    const product = await Product.findOneAndDelete({
      _id: resolvedParams.productId,
      sellerId: sellerObjectId as any
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    );
  }
}
