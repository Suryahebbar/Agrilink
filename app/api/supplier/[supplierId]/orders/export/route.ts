import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose from 'mongoose';

// GET /api/supplier/[supplierId]/orders/export - Export supplier orders
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
    const range = searchParams.get('range') || '30d'; // Default to 30 days
    const format = searchParams.get('format') || 'csv'; // Default to CSV
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - parseInt(range) * 24 * 60 * 60 * 1000);
    
    // Get orders for date range
    const orders = await Order.find({ 
      sellerId: sellerObjectId as any,
      createdAt: { $gte: startDate },
      paymentStatus: 'paid'
    })
      .populate('items.productId', 'name sku')
      .sort({ createdAt: -1 })
      .lean();
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders found for the selected period' },
        { status: 404 }
      );
    }
    
    // Generate CSV content
    const csvHeaders = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Items',
      'Total Amount',
      'Payment Status',
      'Order Status',
      'Delivery Address',
      'Created At'
    ];
    
    const csvRows = orders.map((order: any) => {
      const items = order.items?.map((item: any) => 
        `${item.name} (${item.sku}) - ${item.quantity}x ₹${item.price}`
      ).join('; ') || '';
      
      return [
        order._id,
        order.createdAt?.toISOString().split('T')[0],
        order.customer?.name || 'N/A',
        order.customer?.email || 'N/A',
        order.customer?.phone || 'N/A',
        items,
        `₹${order.totalAmount}`,
        order.paymentStatus || 'N/A',
        order.orderStatus || 'N/A',
        `${order.customer?.address?.street || ''}, ${order.customer?.address?.city || ''}, ${order.customer?.address?.state || ''} ${order.customer?.address?.pincode || ''}` || 'N/A',
        order.createdAt?.toISOString().split('T')[0]
      ];
    });
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: string[]) => row.join(','))
    ].join('\n');
    
    // Set appropriate headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="orders-export-${range}-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return new NextResponse(csvContent, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
}
