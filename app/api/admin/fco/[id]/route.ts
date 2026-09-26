import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { FcoService } from '@/lib/services/fco.service';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      const fco = await FcoService.getFcoDetails(id);

      return NextResponse.json({
        success: true,
        data: fco
      });
    } catch (error) {
      console.error('Error fetching FCO details:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const adminEmail = (req as any).admin?.email || 'admin@bpfis.com';

      const fco = await FcoService.editFco(id, body, adminEmail);

      return NextResponse.json({
        success: true,
        data: fco
      });
    } catch (error) {
      console.error('Error updating FCO:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      
      const { connectDB } = await import('@/lib/db');
      const { User } = await import('@/lib/models/User');
      
      await connectDB();
      const fcoObjectId = new mongoose.Types.ObjectId(id);

      const user = await User.findOne({ _id: fcoObjectId, role: 'fco' });
      if (!user) {
        return NextResponse.json(
          { error: 'FCO user not found' },
          { status: 404 }
        );
      }

      await User.deleteOne({ _id: fcoObjectId });

      // Optional: Log to AdminAuditLog
      try {
        const { AdminAuditLog } = await import('@/lib/models/AdminAuditLog');
        const adminEmail = (req as any).admin?.email || 'admin@bpfis.com';
        await AdminAuditLog.create({
          action: 'delete_fco',
          entityType: 'fco',
          entityId: fcoObjectId,
          entityName: user.fullName || user.email,
          details: { performedBy: adminEmail, deletedAt: new Date() },
          performedBy: adminEmail,
          timestamp: new Date()
        });
      } catch (e) {
        console.warn('Failed to write admin audit log:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'FCO account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting FCO:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}
