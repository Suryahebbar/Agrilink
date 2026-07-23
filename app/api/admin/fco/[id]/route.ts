import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { FcoService } from '@/lib/services/fco.service';

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
