import { NextRequest } from 'next/server';
import { AdminAuditLog, ActivityAction, ResourceType, ActivityStatus } from '@/lib/models/AdminAuditLog';
import { getClientInfo } from './client-info';

interface LogActivityParams {
  action: ActivityAction | string;
  resourceType: ResourceType | string;
  resourceId: string | any;
  resourceName?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  status?: ActivityStatus;
  error?: Error;
}

export class ActivityLogger {
  /**
   * Log an activity from a server component or API route
   */
  static async logActivity(params: LogActivityParams) {
    try {
      const clientInfo = await getClientInfo();
      
      const activityData = {
        ...params,
        ipAddress: clientInfo.req.ip,
        userAgent: clientInfo.req.headers['user-agent'] || '',
        status: params.status || ActivityStatus.SUCCESS,
        errorMessage: params.error?.message,
        stackTrace: params.error?.stack,
        timestamp: new Date(),
        metadata: {
          ...params.metadata,
          ...(params.error ? { error: params.error.message } : {})
        }
      };

      return await AdminAuditLog.logActivity(activityData);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw to avoid breaking the main operation
      return null;
    }
  }

  /**
   * Log an activity from an API route with request context
   */
  static async logApiActivity(
    req: NextRequest,
    params: Omit<LogActivityParams, 'ipAddress' | 'userAgent'>
  ) {
    try {
      const clientInfo = getClientInfoFromRequest(req);
      
      const activityData = {
        ...params,
        ipAddress: clientInfo.req.ip,
        userAgent: clientInfo.req.headers['user-agent'] || '',
        status: params.status || ActivityStatus.SUCCESS,
        errorMessage: params.error?.message,
        stackTrace: params.error?.stack,
        timestamp: new Date(),
        metadata: {
          ...params.metadata,
          ...(params.error ? { error: params.error.message } : {})
        }
      };

      return await AdminAuditLog.logActivity(activityData);
    } catch (error) {
      console.error('Failed to log API activity:', error);
      // Don't throw to avoid breaking the main operation
      return null;
    }
  }

  /**
   * Get recent activities with pagination
   */
  static async getRecentActivities({
    limit = 20,
    skip = 0,
    resourceType,
    resourceId,
    userId,
    action,
    status,
  }: {
    limit?: number;
    skip?: number;
    resourceType?: string;
    resourceId?: string;
    userId?: string;
    action?: string;
    status?: ActivityStatus;
  } = {}) {
    try {
      const query: any = {};
      
      if (resourceType) query.resourceType = resourceType;
      if (resourceId) query.resourceId = resourceId;
      if (userId) query.userId = userId;
      if (action) query.action = action;
      if (status) query.status = status;

      const [activities, total] = await Promise.all([
        AdminAuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AdminAuditLog.countDocuments(query)
      ]);

      return {
        data: activities,
        total,
        limit,
        skip,
        hasMore: skip + activities.length < total
      };
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats({
    startDate,
    endDate,
    groupBy = 'day',
    resourceType,
    action,
    userId,
  }: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month' | 'year';
    resourceType?: string;
    action?: string;
    userId?: string;
  } = {}) {
    try {
      const match: any = {};
      
      if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) match.timestamp.$gte = startDate;
        if (endDate) match.timestamp.$lte = endDate;
      }
      
      if (resourceType) match.resourceType = resourceType;
      if (action) match.action = action;
      if (userId) match.userId = userId;

      let groupFormat: string;
      switch (groupBy) {
        case 'day':
          groupFormat = '%Y-%m-%d';
          break;
        case 'week':
          groupFormat = '%Y-%U';
          break;
        case 'month':
          groupFormat = '%Y-%m';
          break;
        case 'year':
          groupFormat = '%Y';
          break;
        default:
          groupFormat = '%Y-%m-%d';
      }

      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupFormat,
                date: '$timestamp'
              }
            },
            count: { $sum: 1 },
            success: {
              $sum: {
                $cond: [{ $eq: ['$status', ActivityStatus.SUCCESS] }, 1, 0]
              }
            },
            failed: {
              $sum: {
                $cond: [{ $eq: ['$status', ActivityStatus.FAILED] }, 1, 0]
              }
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', ActivityStatus.PENDING] }, 1, 0]
              }
            },
            actions: { $addToSet: '$action' },
            resourceTypes: { $addToSet: '$resourceType' },
            users: { $addToSet: '$userId' },
          }
        },
        { $sort: { _id: 1 } }
      ];

      return await AdminAuditLog.aggregate(pipeline);
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      throw error;
    }
  }
}

// Helper function to get client info from a NextRequest
export function getClientInfoFromRequest(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') || 
            req.headers.get('x-forwarded-for')?.split(',')[0] || 
            '127.0.0.1';
  
  return {
    req: {
      ip,
      headers: {
        'user-agent': req.headers.get('user-agent') || '',
        'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
        'x-real-ip': req.headers.get('x-real-ip') || '',
      },
      get(header: string) {
        return req.headers.get(header);
      },
    },
  };
}

// Helper function to get a human-readable action label
export function getActionLabel(action: string): string {
  const actionLabels: Record<string, string> = {
    [ActivityAction.CREATE]: 'Created',
    [ActivityAction.UPDATE]: 'Updated',
    [ActivityAction.DELETE]: 'Deleted',
    [ActivityAction.LOGIN]: 'Logged in',
    [ActivityAction.LOGOUT]: 'Logged out',
    [ActivityAction.APPROVE]: 'Approved',
    [ActivityAction.REJECT]: 'Rejected',
    [ActivityAction.VERIFY]: 'Verified',
    [ActivityAction.SUBMIT]: 'Submitted',
    [ActivityAction.CANCEL]: 'Cancelled',
    [ActivityAction.PAYMENT]: 'Payment processed',
    [ActivityAction.REFUND]: 'Refund issued',
    [ActivityAction.STATUS_CHANGE]: 'Status changed',
    [ActivityAction.UPLOAD]: 'Uploaded',
    [ActivityAction.DOWNLOAD]: 'Downloaded',
    [ActivityAction.EXPORT]: 'Exported',
    [ActivityAction.IMPORT]: 'Imported',
  };

  return actionLabels[action] || action;
}

// Helper function to get a resource icon
export function getResourceIcon(resourceType: string): string {
  const icons: Record<string, string> = {
    [ResourceType.USER]: '👤',
    [ResourceType.ORDER]: '📦',
    [ResourceType.PRODUCT]: '🛍️',
    [ResourceType.DOCUMENT]: '📄',
    [ResourceType.INVENTORY]: '📊',
    [ResourceType.PAYMENT]: '💳',
    [ResourceType.NOTIFICATION]: '🔔',
    [ResourceType.SETTINGS]: '⚙️',
    [ResourceType.AUDIT_LOG]: '📝',
    [ResourceType.FARMER]: '👨‍🌾',
    [ResourceType.SUPPLIER]: '🏭',
    [ResourceType.MARKETPLACE]: '🛒',
  };

  return icons[resourceType] || '📌';
}

// Helper function to get a status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    [ActivityStatus.SUCCESS]: 'green',
    [ActivityStatus.FAILED]: 'red',
    [ActivityStatus.PENDING]: 'orange',
  };

  return colors[status] || 'gray';
}
