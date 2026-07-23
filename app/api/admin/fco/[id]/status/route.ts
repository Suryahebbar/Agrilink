import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { FcoService } from '@/lib/services/fco.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { action, status, newPassword } = body;
      const adminEmail = (req as any).admin?.email || 'admin@bpfis.com';

      let result;

      if (action === 'reset_password') {
        if (!newPassword) {
          return NextResponse.json({ error: 'New password is required' }, { status: 400 });
        }
        result = await FcoService.resetPassword(id, adminEmail, newPassword);
      } else if (action === 'status') {
        if (!status || !['active', 'inactive'].includes(status)) {
          return NextResponse.json({ error: 'Valid status (active/inactive) is required' }, { status: 400 });
        }
        result = await FcoService.toggleStatus(id, status, adminEmail);
      } else {
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error changing FCO state:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}
