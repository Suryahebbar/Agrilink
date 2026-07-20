import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, Product } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose, { Types } from 'mongoose';

void Product;

interface SupplierOrderDocument {
  _id: Types.ObjectId;
  orderNumber: string;
  customer?: { name: string; phone: string };
  totalAmount: number;
  orderStatus: string;
  paymentStatus?: string;
  paymentDetails?: {
    method?: string;
    transactionId?: string;
    paidAt?: Date;
  };
  items: unknown[];
  shippingDetails?: unknown;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();
    
    // Authenticate supplier - don't validate route params for orders endpoint
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId; // Use authenticated sellerId
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query for supplier orders
    const supplierQuery: Record<string, unknown> = { sellerId: sellerObjectId };
    
    if (status && status !== 'all') {
      supplierQuery.orderStatus = status;
    }
    
    if (search) {
      supplierQuery.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Order.countDocuments(supplierQuery);

    const orders = await Order.find(supplierQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.productId', 'name sku images price')
      .lean<SupplierOrderDocument[]>();

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Unauthorized access to this supplier resource') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    console.error('[Orders API] Error fetching orders:', error);

    const debug = process.env.NODE_ENV !== 'production';
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: debug ? details : undefined },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Authenticate supplier and validate supplierId
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;

    const body = await request.json();

    // Create order
    const order = await Order.create({
      ...body,
      sellerId,
      orderNumber: generateOrderNumber()
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}
