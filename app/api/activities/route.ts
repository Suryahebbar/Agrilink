import { NextResponse } from 'next/server';
import { ActivityLogger } from '@/lib/utils/activity-helper';
import { extractTokenFromRequest, verifyAuthToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    
    // Get filter parameters
    const resourceType = searchParams.get('resourceType') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const status = searchParams.get('status') as any || undefined;
    
    // Get activities with pagination and filters
    const activities = await ActivityLogger.getRecentActivities({
      limit,
      skip,
      resourceType,
      resourceId,
      userId,
      action,
      status,
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

// Handle POST request to log a new activity
export async function POST(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Log the activity
    const activity = await ActivityLogger.logActivity({
      ...body,
      userId: user.sub,
      userEmail: user.email || body.userEmail,
      userName: user.name || body.userName,
      userRole: user.role || body.userRole,
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Failed to log activity:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
