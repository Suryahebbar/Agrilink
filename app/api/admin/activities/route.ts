import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { AdminService } from '@/lib/services/admin.service';

async function getActivitiesHandler() {
  try {
    const activities = await AdminService.getRecentActivities(20);
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getActivitiesHandler);
