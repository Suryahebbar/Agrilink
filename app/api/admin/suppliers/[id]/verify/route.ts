import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Seller } from '@/lib/models/supplier';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, ActivityStatus, LogModule, ResourceType } from '@/lib/auditTypes';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      await connectDB();
      
      // Try Seller model first
      let supplier: any = await Seller.findById(id);

      // Fallback to User model
      if (!supplier) {
        supplier = await User.findOne({ _id: id, role: 'supplier' });
      }
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
      
      // Update supplier verification status
      supplier.verificationStatus = 'verified';
      supplier.verifiedAt = new Date();
      supplier.isActive = true;
      supplier.rejectionReason = undefined;
      if (supplier.status) supplier.status = 'active';

      await supplier.save();

      // Audit log
      void auditLog({
        action: ActivityAction.VERIFY,
        module: LogModule.ADMIN,
        resourceType: ResourceType.SUPPLIER,
        resourceId: id,
        resourceName: supplier.companyName || supplier.name || 'Supplier',
        remarks: 'Admin verified and activated supplier account for legal market trade',
        request: req,
        status: ActivityStatus.SUCCESS
      });
      
      return NextResponse.json({
        success: true,
        message: 'Supplier verified successfully',
        data: {
          id: supplier._id,
          verificationStatus: supplier.verificationStatus,
          verifiedAt: supplier.verifiedAt,
          isActive: supplier.isActive
        },
      });
    } catch (error) {
      console.error('Error verifying supplier:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}
