import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// GET /api/supplier/[supplierId]/notifications - Get supplier notifications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Authenticate supplier and validate supplierId
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Get notifications (mock data for now)
    const notifications = [
      {
        id: 'notif_1',
        type: 'order_new',
        title: 'New Order Received',
        message: 'You have received a new order #ORD-001',
        priority: 'high',
        status: 'unread',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actionUrl: `/dashboard/supplier/orders/ord_001`
      },
      {
        id: 'notif_2',
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Product "Organic Fertilizer" is running low on stock (5 units remaining)',
        priority: 'medium',
        status: 'unread',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        actionUrl: `/dashboard/supplier/inventory`
      },
      {
        id: 'notif_3',
        type: 'payment_received',
        title: 'Payment Received',
        message: 'Payment of ₹2,500 received for order #ORD-002',
        priority: 'high',
        status: 'unread',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        actionUrl: `/dashboard/supplier/orders/ord_002`
      }
    ];
    
    // Filter notifications based on query parameters
    let filteredNotifications = notifications;
    if (unreadOnly) {
      filteredNotifications = notifications.filter(n => n.status === 'unread');
    }
    
    // Limit results
    if (limit && limit > 0) {
      filteredNotifications = filteredNotifications.slice(0, limit);
    }
    
    return NextResponse.json({ 
      notifications: filteredNotifications,
      total: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/supplier/[supplierId]/notifications/read - Mark notifications as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Authenticate supplier and validate supplierId
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    const body = await request.json();
    const { notificationIds } = body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      );
    }
    
    // Mock: Mark notifications as read
    // In a real implementation, this would update the database
    console.log('Marking notifications as read:', notificationIds);
    
    return NextResponse.json({ 
      message: 'Notifications marked as read',
      marked: notificationIds.length
    });
    
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
