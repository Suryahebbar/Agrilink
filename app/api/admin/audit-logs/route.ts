import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AdminAuditLog } from '@/lib/models/AdminAuditLog';
import { adminAuthMiddleware } from '@/lib/admin-auth-middleware';

export async function GET(request: NextRequest) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();
      
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const adminId = searchParams.get('adminId');
      const action = searchParams.get('action');
      const resourceType = searchParams.get('resourceType');
      const status = searchParams.get('status');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      
      // Build query
      let query: any = {};
      
      if (adminId) query.adminId = adminId;
      if (action) query.action = action;
      if (resourceType) query.resourceType = resourceType;
      if (status) query.status = status;
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      const skip = (page - 1) * limit;
      
      const [logs, total] = await Promise.all([
        AdminAuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AdminAuditLog.countDocuments(query)
      ]);
      
      return NextResponse.json({
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
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
      const { action, resourceType, resourceId, resourceDetails, status = 'success', errorMessage } = body;
      
      if (!action || !resourceType || !resourceId) {
        return NextResponse.json(
          { error: 'Missing required fields: action, resourceType, resourceId' },
          { status: 400 }
        );
      }
      
      const auditLog = new AdminAuditLog({
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        action,
        resourceType,
        resourceId,
        resourceDetails,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status,
        errorMessage
      });
      
      await auditLog.save();
      
      return NextResponse.json({ message: 'Audit log created successfully', log: auditLog });
      
    } catch (error) {
      console.error('Error creating audit log:', error);
      return NextResponse.json(
        { error: 'Failed to create audit log' },
        { status: 500 }
      );
    }
  })(request);
}
