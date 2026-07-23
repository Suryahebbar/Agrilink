import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { FarmerService } from '@/lib/services/farmer.service';

export async function GET(request: NextRequest) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const aadhaarStatus = searchParams.get('aadhaarStatus') || '';
      const rtcStatus = searchParams.get('rtcStatus') || '';
      const district = searchParams.get('district') || '';
      const taluk = searchParams.get('taluk') || '';
      const village = searchParams.get('village') || '';
      const sortBy = searchParams.get('sortBy') || 'newest';

      const data = await FarmerService.getFarmers({
        page,
        limit,
        search,
        status,
        aadhaarStatus,
        rtcStatus,
        district,
        taluk,
        village,
        sortBy
      });

      return NextResponse.json({
        success: true,
        data: data.farmers,
        pagination: data.pagination
      });
    } catch (error) {
      console.error('Error fetching farmers:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
