import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { FarmerService } from '@/lib/services/farmer.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      const body = await req.json().catch(() => ({}));
      const { action = 'approve', reason = '', newPassword = '' } = body;
      
      const adminEmail = (req as any).admin?.email || 'admin@bpfis.com';

      let result;

      switch (action) {
        case 'reject':
          if (!reason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
          }
          result = await FarmerService.rejectFarmer(id, adminEmail, reason);
          break;
        case 'suspend':
          if (!reason) {
            return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 });
          }
          result = await FarmerService.suspendFarmer(id, adminEmail, reason);
          break;
        case 'reactivate':
          result = await FarmerService.reactivateFarmer(id, adminEmail);
          break;
        case 'reset_password':
          if (!newPassword) {
            return NextResponse.json({ error: 'New password is required' }, { status: 400 });
          }
          result = await FarmerService.resetPassword(id, adminEmail, newPassword);
          break;
        case 'approve':
        default:
          result = await FarmerService.approveFarmer(id, adminEmail);
          break;
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error in farmer admin action:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}
