import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { AdminService } from '@/lib/services/admin.service';

async function getStatsHandler() {
  try {
    const stats = await AdminService.getDashboardStats();
    const recentActivities = await AdminService.getRecentActivities(10);

    return NextResponse.json({
      ...stats,
      recentActivities,
      recentActivity: recentActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getStatsHandler);

