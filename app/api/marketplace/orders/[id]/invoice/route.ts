import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceOrder } from '@/lib/models/marketplace-order';
import { connectDB } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    
    await connectDB();

    const order = await MarketplaceOrder.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate invoice data
    const invoiceData = generateInvoiceData(order);

    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}

function generateInvoiceData(order: any) {
  const invoiceNumber = `INV${order.orderId.slice(3)}`;
  const invoiceDate = new Date(order.createdAt);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days due

  return {
    invoice: {
      number: invoiceNumber,
      date: invoiceDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: order.paymentStatus === 'completed' ? 'paid' : 'pending'
    },
    seller: {
      name: 'Demo Agricultural Supplies',
      address: '123 Market Street, Bangalore, Karnataka 560001',
      phone: '+91 98765 43210',
      email: 'info@demoagri.com',
      gst: '29AAAPL1234C1ZV'
    },
    customer: {
      name: order.shippingAddress?.fullName || 'Customer',
      address: `${order.shippingAddress?.address}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}`,
      phone: order.shippingAddress?.phone,
      email: order.customerInfo?.email || 'customer@example.com'
    },
    order: {
      id: order.orderId,
      date: order.createdAt,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus
    },
    items: order.items.map((item: any, index: number) => ({
      sno: index + 1,
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
      tax: item.tax || 0,
      total: item.price * item.quantity
    })),
    totals: {
      subtotal: order.subtotal || order.total,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      total: order.total
    },
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      transactionId: order.paymentDetails?.transactionId,
      paidAt: order.paymentDetails?.processedAt
    },
    terms: [
      'Payment is due within 30 days of invoice date',
      'Goods once sold will not be taken back or exchanged',
      'All disputes are subject to Bangalore jurisdiction',
      'GST is applicable as per government regulations'
    ]
  };
}
