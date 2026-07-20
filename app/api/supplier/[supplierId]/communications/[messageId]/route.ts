import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/supplier-auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; messageId: string }> }
) {
  try {
    const { supplierId, messageId } = await params;
    
    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    const sellerId = auth.sellerId;

    // In a real implementation, you would fetch from database:
    // const communication = await Communication.findOne({ _id: messageId, sellerId });
    
    // For now, return mock data
    const mockCommunication = {
      _id: messageId,
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
    };

    return NextResponse.json({ communication: mockCommunication });
  } catch (error) {
    console.error('Error fetching communication:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communication' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; messageId: string }> }
) {
  try {
    const { supplierId, messageId } = await params;
    
    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    const sellerId = auth.sellerId;

    const body = await request.json();
    const { status } = body;

    // In a real implementation, you would update in database:
    // const communication = await Communication.findOneAndUpdate(
    //   { _id: messageId, sellerId },
    //   { status, updatedAt: new Date() },
    //   { new: true }
    // );

    return NextResponse.json({ 
      message: 'Communication updated successfully',
      status 
    });
  } catch (error) {
    console.error('Error updating communication:', error);
    return NextResponse.json(
      { error: 'Failed to update communication' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; messageId: string }> }
) {
  try {
    const { supplierId, messageId } = await params;
    
    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    const sellerId = auth.sellerId;

    // In a real implementation, you would delete from database:
    // await Communication.findOneAndDelete({ _id: messageId, sellerId });

    return NextResponse.json({ message: 'Communication deleted successfully' });
  } catch (error) {
    console.error('Error deleting communication:', error);
    return NextResponse.json(
      { error: 'Failed to delete communication' },
      { status: 500 }
    );
  }
}
