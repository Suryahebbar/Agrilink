import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// Communication model (you may need to create this model)
interface Communication {
  _id: string;
  orderId?: string;
  productId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  subject: string;
  message: string;
  type: 'inquiry' | 'complaint' | 'feedback' | 'order_update' | 'product_question';
  status: 'unread' | 'read' | 'replied' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  supplierResponse?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const resolvedParams = await params;

    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { sellerId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // For now, return mock data since we don't have a Communication model
    // In a real implementation, you would:
    // 1. Create a Communication model in your models directory
    // 2. Use Communication.find(query) to fetch from database
    
    const mockCommunications: Communication[] = [
      {
        _id: '1',
        customerId: 'cust1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        subject: 'Question about organic seeds',
        message: 'I would like to know if your tomato seeds are certified organic?',
        type: 'inquiry',
        status: 'unread',
        priority: 'medium',
        sellerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        orderId: 'order123',
        customerId: 'cust2',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        subject: 'Order delivery issue',
        message: 'My order #123 hasn\'t arrived yet. Can you check the status?',
        type: 'order_update',
        status: 'replied',
        priority: 'high',
        supplierResponse: {
          message: 'Your order has been shipped and should arrive within 2-3 business days.',
          respondedAt: new Date().toISOString(),
          respondedBy: sellerId
        },
        sellerId,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Filter mock data based on query
    let filteredCommunications = mockCommunications;
    
    if (status && status !== 'all') {
      filteredCommunications = filteredCommunications.filter(c => c.status === status);
    }
    
    if (type && type !== 'all') {
      filteredCommunications = filteredCommunications.filter(c => c.type === type);
    }
    
    if (priority && priority !== 'all') {
      filteredCommunications = filteredCommunications.filter(c => c.priority === priority);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCommunications = filteredCommunications.filter(c => 
        c.subject.toLowerCase().includes(searchLower) ||
        c.customerName.toLowerCase().includes(searchLower) ||
        c.message.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const total = filteredCommunications.length;
    const communications = filteredCommunications.slice(skip, skip + limit);

    return NextResponse.json({
      communications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const resolvedParams = await params;

    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;

    const body = await request.json();

    // Create communication
    const communication = {
      ...body,
      sellerId,
      status: 'unread',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, you would save to database:
    // const newCommunication = await Communication.create(communication);

    return NextResponse.json({ communication }, { status: 201 });
  } catch (error) {
    console.error('Error creating communication:', error);
    return NextResponse.json(
      { error: 'Failed to create communication' },
      { status: 500 }
    );
  }
}
