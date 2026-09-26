import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AdminAuditLog } from '@/lib/models/AdminAuditLog';
import { adminAuthMiddleware } from '@/lib/admin-auth-middleware';

export async function GET(request: NextRequest) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();

      const { searchParams } = new URL(req.url);
      const page      = parseInt(searchParams.get('page')  || '1');
      const limit     = parseInt(searchParams.get('limit') || '50');
      const action    = searchParams.get('action');
      const module    = searchParams.get('module');
      const userRole  = searchParams.get('userRole');
      const status    = searchParams.get('status');
      const userId    = searchParams.get('userId');
      const resourceId = searchParams.get('resourceId');
      const search    = searchParams.get('search');
      const startDate = searchParams.get('startDate');
      const endDate   = searchParams.get('endDate');

      const query: any = {};

      if (action)   query.action = action;
      if (module)   query.module = module;
      if (userRole) query.userRole = userRole;
      if (status)   query.status  = status;
      if (userId)   query.userId  = userId;
      if (resourceId) query.resourceId = resourceId;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate)   query.timestamp.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }

      // Full-text-style search across key fields
      if (search) {
        query.$or = [
          { userName:     { $regex: search, $options: 'i' } },
          { userEmail:    { $regex: search, $options: 'i' } },
          { remarks:      { $regex: search, $options: 'i' } },
          { resourceName: { $regex: search, $options: 'i' } },
          { resourceId:   { $regex: search, $options: 'i' } },
          { referenceId:  { $regex: search, $options: 'i' } },
          { action:       { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AdminAuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AdminAuditLog.countDocuments(query),
      ]);

      return NextResponse.json({
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });

    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();

      const admin = (req as any).admin;
      const body = await req.json();
      const { action, resourceType, resourceId, resourceName, module: logModule,
              oldValue, newValue, remarks, status = 'success', errorMessage, metadata } = body;

      if (!action || !resourceType || !resourceId) {
        return NextResponse.json(
          { error: 'Missing required fields: action, resourceType, resourceId' },
          { status: 400 }
        );
      }

      const auditEntry = new AdminAuditLog({
        userId:    admin?.id,
        userEmail: admin?.email,
        userName:  admin?.name,
        userRole:  'admin',
        action,
        module:       logModule,
        resourceType,
        resourceId,
        resourceName,
        oldValue,
        newValue,
        remarks,
        metadata,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status,
        errorMessage,
      });

      await auditEntry.save();

      return NextResponse.json({ message: 'Audit log created successfully', log: auditEntry });

    } catch (error) {
      console.error('Error creating audit log:', error);
      return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
    }
  })(request);
}
