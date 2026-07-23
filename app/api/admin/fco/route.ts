import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { FcoService } from '@/lib/services/fco.service';

export async function GET(request: NextRequest) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const search = searchParams.get('search') || '';
      const status = (searchParams.get('status') || '') as 'active' | 'inactive' | '';
      const sortBy = searchParams.get('sortBy') || 'newest';

      const data = await FcoService.getFcoList({
        page,
        limit,
        search,
        status,
        sortBy
      });

      return NextResponse.json({
        success: true,
        data: data.fcos,
        pagination: data.pagination
      });
    } catch (error) {
      console.error('Error fetching FCOs:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const adminEmail = (req as any).admin?.email || 'admin@bpfis.com';

      // Validation
      const requiredFields = ['fullName', 'employeeId', 'email', 'phone', 'address', 'qualification', 'experience', 'username', 'password'];
      for (const field of requiredFields) {
        if (!body[field] && body[field] !== 0) {
          return NextResponse.json(
            { error: `${field} is a required field` },
            { status: 400 }
          );
        }
      }

      const fco = await FcoService.createFco(body, adminEmail);

      return NextResponse.json({
        success: true,
        data: fco
      });
    } catch (error) {
      console.error('Error creating FCO:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
