import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    
    // Build query based on filters
    let orderQuery: any = {};
    
    if (searchTerm) {
      orderQuery.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { 'customer.name': { $regex: searchTerm, $options: 'i' } },
        { 'customer.email': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (filter !== 'all') {
      orderQuery.status = filter;
    }
    
    // Get supplier orders
    const supplierOrders = await Order.find(orderQuery)
      .populate('sellerId', 'name companyName')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get farmer orders
    const farmerOrders = await FarmerOrder.find(orderQuery)
      .populate('items.sellerId', 'name companyName')
      .sort({ createdAt: -1 })
      .lean();
    
    // Combine and format orders
    const orders = [
      ...supplierOrders.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
        type: 'supplier' as const,
        customerName: (order as any).customer?.name || 'Guest',
        customerEmail: (order as any).customer?.email || 'N/A',
        totalAmount: order.totalAmount || 0,
        status: (order as any).status || 'pending',
        createdAt: order.createdAt,
        items: order.items || [],
        seller: order.sellerId
      })),
      ...farmerOrders.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber || `FRM-${order._id.toString().slice(-6)}`,
        type: 'farmer' as const,
        customerName: (order as any).customer?.name || 'Guest',
        customerEmail: (order as any).customer?.email || 'N/A',
        totalAmount: order.items?.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0) || 0,
        status: (order as any).status || 'pending',
        createdAt: order.createdAt,
        items: order.items || [],
        seller: order.items?.[0]?.sellerId
      }))
    ];

    return NextResponse.json({ orders });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
