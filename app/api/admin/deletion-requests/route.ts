import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import { AdminAuditLog } from '@/lib/models/AdminAuditLog';
import { Types } from 'mongoose';

interface DeletionRequestLog {
  _id: Types.ObjectId;
  entityId: any; // Using any since it's populated with Seller document
  details?: {
    entityName?: string;
    requestedBy?: string;
    reason?: string;
    requestedAt?: Date;
    status?: string;
  };
  timestamp: Date;
}

export async function GET(request: Request) {
  try {
    // Verify admin token
    const token = request.headers.get('cookie')?.split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get all deletion requests
    const deletionRequests = await AdminAuditLog.find({
      action: 'delete_request',
      entityType: 'supplier'
    }).sort({ timestamp: -1 })
      .populate({
        path: 'entityId',
        select: 'companyName email phone',
        model: 'Seller'
      });

    const formattedRequests = deletionRequests.map((log: DeletionRequestLog) => ({
      _id: log._id,
      supplierId: log.entityId,
      supplierName: log.details?.entityName || 'Unknown',
      supplierEmail: log.details?.requestedBy || 'Unknown',
      reason: log.details?.reason,
      requestedAt: log.details?.requestedAt,
      status: log.details?.status || 'pending',
      supplier: log.entityId
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching deletion requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deletion requests' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Verify admin token
    const token = request.headers.get('cookie')?.split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { requestId, status, adminNote } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    // Update the deletion request
    const updatedRequest = await AdminAuditLog.findByIdAndUpdate(
      requestId,
      {
        'details.status': status,
        'details.adminNote': adminNote,
        'details.updatedBy': payload.email,
        'details.updatedAt': new Date()
      }
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deletion request ${status} successfully`,
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating deletion request:', error);
    return NextResponse.json(
      { error: 'Failed to update deletion request' },
      { status: 500 }
    );
  }
}
