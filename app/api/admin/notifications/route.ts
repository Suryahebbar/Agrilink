import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AdminNotification } from '@/lib/models/AdminNotification';
import { adminAuthMiddleware } from '@/lib/admin-auth-middleware';

export async function GET(request: NextRequest) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();
      
      const admin = (req as any).admin;
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const category = searchParams.get('category');
      
      // Build query
      let query: any = {
        $or: [
          { adminId: null }, // Notifications for all admins
          { adminId: admin.id } // Notifications for this specific admin
        ]
      };
      
      if (unreadOnly) {
        query.read = false;
      }
      
      if (category) {
        query.category = category;
      }
      
      const skip = (page - 1) * limit;
      
      const [notifications, total, unreadCount] = await Promise.all([
        AdminNotification.find(query)
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AdminNotification.countDocuments(query),
        AdminNotification.countDocuments({ 
          $or: [
            { adminId: null, read: false },
            { adminId: admin.id, read: false }
          ]
        })
      ]);
      
      return NextResponse.json({
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      });
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();
      
      const admin = (req as any).admin;
      const body = await req.json();
      const { title, message, type, category, priority, adminId, actionUrl, actionText, metadata } = body;
      
      if (!title || !message || !type || !category || !priority) {
        return NextResponse.json(
          { error: 'Missing required fields: title, message, type, category, priority' },
          { status: 400 }
        );
      }
      
      const notification = new AdminNotification({
        title,
        message,
        type,
        category,
        priority,
        adminId: adminId || null, // null means for all admins
        actionUrl,
        actionText,
        metadata,
        createdAt: new Date()
      });
      
      await notification.save();
      
      return NextResponse.json({ 
        message: 'Notification created successfully', 
        notification 
      });
      
    } catch (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();
      
      const admin = (req as any).admin;
      const body = await req.json();
      const { notificationIds, read } = body;
      
      if (!notificationIds || !Array.isArray(notificationIds) || typeof read !== 'boolean') {
        return NextResponse.json(
          { error: 'Missing required fields: notificationIds (array), read (boolean)' },
          { status: 400 }
        );
      }
      
      const updateData = { 
        read, 
        readAt: read ? new Date() : undefined 
      };
      
      const result = await AdminNotification.updateMany(
        { 
          _id: { $in: notificationIds },
          $or: [
            { adminId: null },
            { adminId: admin.id }
          ]
        },
        updateData
      );
      
      return NextResponse.json({ 
        message: `${result.modifiedCount} notifications updated`,
        modifiedCount: result.modifiedCount
      });
      
    } catch (error) {
      console.error('Error updating notifications:', error);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }
  })(request);
}
