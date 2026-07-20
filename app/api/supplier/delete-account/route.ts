import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { AdminAuditLog } from '@/lib/models/AdminAuditLog';

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { reason, password } = body;

    if (!reason || !password) {
      return NextResponse.json(
        { error: 'Deletion reason and password are required' },
        { status: 400 }
      );
    }

    // Get supplier from session/token (you'll need to implement supplier auth)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find supplier and verify password
    const supplier = await Seller.findOne({ email: token }); // Simplified auth - you may need to adjust
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Verify password (you'll need to implement proper password verification)
    // For now, we'll skip password verification as it depends on your auth system
    
    // Create deletion request
    const deletionRequest = {
      supplierId: supplier._id,
      supplierName: supplier.companyName || supplier.email,
      supplierEmail: supplier.email,
      reason,
      requestedAt: new Date(),
      status: 'pending'
    };

    // Store deletion request in AdminAuditLog
    await AdminAuditLog.create({
      action: 'delete_request',
      entityType: 'supplier',
      entityId: supplier._id,
      entityName: supplier.companyName || supplier.email,
      details: {
        reason,
        requestedBy: supplier.email,
        requestedAt: new Date()
      },
      performedBy: 'system',
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion request submitted. Admin will review and confirm the deletion.',
      request: deletionRequest
    });

  } catch (error) {
    console.error('Error creating deletion request:', error);
    return NextResponse.json(
      { error: 'Failed to submit deletion request' },
      { status: 500 }
    );
  }
}
