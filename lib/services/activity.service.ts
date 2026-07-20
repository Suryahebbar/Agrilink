import { AdminAuditLog } from '@/lib/models/AdminAuditLog';
import { Document, Model, Schema } from 'mongoose';
import { getClientInfo } from '@/lib/utils/client-info';

export interface IActivityLog {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId: string | Schema.Types.ObjectId;
  resourceDetails?: any;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class ActivityService {
  static async logActivity(activity: IActivityLog) {
    try {
      const { req } = await getClientInfo();
      
      const logData = {
        userId: activity.userId,
        userEmail: activity.userEmail || 'system@bpfis.com',
        userName: activity.userName || 'System',
        action: activity.action,
        resourceType: activity.resourceType,
        resourceId: activity.resourceId,
        resourceDetails: activity.resourceDetails,
        ipAddress: req?.ip || '127.0.0.1',
        userAgent: req?.headers['user-agent'] || 'system',
        timestamp: new Date(),
        status: activity.status,
        errorMessage: activity.errorMessage,
        metadata: activity.metadata || {}
      };

      await AdminAuditLog.create(logData);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getRecentActivities(limit = 10, resourceType?: string) {
    const query: any = {};
    if (resourceType) {
      query.resourceType = resourceType;
    }

    return AdminAuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  static formatActivityMessage(activity: any): string {
    const { action, resourceType, resourceDetails, userName } = activity;
    const resourceId = activity.resourceId?.toString().substring(0, 8) || '';
    
    const messages: Record<string, Record<string, string>> = {
      user: {
        create: `${userName} created a new user account`,
        update: `${userName} updated user profile`,
        delete: `${userName} deleted a user account`,
        login: `${userName} logged in`,
        logout: `${userName} logged out`,
      },
      order: {
        create: `New order #${resourceId} placed`,
        update: `Order #${resourceId} status updated to ${resourceDetails?.status || 'updated'}`,
        cancel: `Order #${resourceId} was cancelled`,
        payment: `Payment received for order #${resourceId}`,
      },
      product: {
        create: `New product added: ${resourceDetails?.name || ''}`,
        update: `Product updated: ${resourceDetails?.name || resourceId}`,
        delete: `Product removed: ${resourceId}`,
      },
      document: {
        upload: `New document uploaded: ${resourceDetails?.documentType || 'Document'}`,
        verify: `Document verified: ${resourceDetails?.documentType || 'Document'}`,
        reject: `Document rejected: ${resourceDetails?.documentType || 'Document'}`,
      },
      inventory: {
        update: `Inventory updated for product ${resourceId}`,
        low: `Low stock alert for product ${resourceId}`,
      },
      default: {
        create: `${resourceType} created`,
        update: `${resourceType} updated`,
        delete: `${resourceType} deleted`,
      },
    };

    const resourceMessages = messages[resourceType] || messages.default;
    return resourceMessages[action] || `${resourceType} ${action}`;
  }
}

// Auto-logging middleware for Mongoose schemas
export function withActivityLogging<T extends Document>(
  model: any,
  resourceType: string
) {
  const modelName = model.modelName;

  // Log after document is saved
  model.schema.post('save', async function (this: any, doc: any) {
    const action = this.isNew ? 'create' : 'update';
    
    await ActivityService.logActivity({
      userId: doc.userId || doc.createdBy,
      action,
      resourceType,
      resourceId: doc._id,
      resourceDetails: doc.toObject ? doc.toObject() : doc,
      status: 'success',
    });
  });

  // Log before document is removed
  model.schema.pre('remove', async function (this: any, next: any) {
    try {
      await ActivityService.logActivity({
        userId: this.userId || this.createdBy,
        action: 'delete',
        resourceType,
        resourceId: this._id,
        resourceDetails: this.toObject ? this.toObject() : this,
        status: 'success',
      });
      next();
    } catch (error) {
      next(error);
    }
  });

  return model;
}
