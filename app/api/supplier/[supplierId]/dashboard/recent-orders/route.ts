import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose, { Types } from 'mongoose';

interface SupplierOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  customer?: {
    name: string;
  };
  totalAmount: number;
  orderStatus: string;
  createdAt: Date;
  items: Array<{
    productId: Types.ObjectId | {
      _id: Types.ObjectId;
      name: string;
      sku: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
}

interface FarmerOrderType {
  _id: Types.ObjectId;
  orderNumber: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  shipping?: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  items: Array<{
    productId: Types.ObjectId | string;
    sellerId: Types.ObjectId | string;
    quantity: number;
    price: number;
  }>;
}

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

    // Get recent supplier orders
    const supplierOrders = await Order.find({ sellerId: sellerObjectId as any })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('items.productId', 'name sku images')
      .lean();

    // Get recent farmer orders
    const farmerOrders = await FarmerOrder.find({
      'items.sellerId': { $in: [sellerId, sellerObjectId.toString()] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Combine and format orders
    const allOrders = [
      ...supplierOrders.map((order: SupplierOrder) => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || 'Customer',
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        createdAt: order.createdAt
      })),
      ...farmerOrders
        .map((order: FarmerOrderType) => {
          const supplierItems = order.items.filter((item: any) => 
            item.sellerId?.toString() === sellerId || 
            item.sellerId?.toString() === sellerObjectId.toString()
          );
          
          if (supplierItems.length === 0) return null;
          
          const supplierTotal = supplierItems.reduce((sum: number, item: any) => 
            sum + (item.price * item.quantity), 0
          );
          
          const statusMap: Record<string, string> = {
            'confirmed': 'new',
            'processing': 'processing',
            'shipped': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled'
          };
          
          return {
            _id: order._id.toString(),
            orderNumber: order.orderNumber,
            customerName: order.shipping?.name || 'Customer',
            totalAmount: supplierTotal,
            status: statusMap[order.status] || order.status,
            createdAt: order.createdAt
          };
        })
        .filter((order: any): order is NonNullable<typeof order> => order !== null)
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent orders' },
      { status: 500 }
    );
  }
}
