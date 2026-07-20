import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ActivityLogger } from '@/lib/utils/activity-helper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const activities = await ActivityLogger.getRecentActivities({
      limit: 3,
      userId,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
