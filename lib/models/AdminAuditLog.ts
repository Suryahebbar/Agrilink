import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum ActivityStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending'
}

export enum ActivityAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  VERIFY = 'verify',
  SUBMIT = 'submit',
  CANCEL = 'cancel',
  PAYMENT = 'payment',
  REFUND = 'refund',
  STATUS_CHANGE = 'status_change',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  EXPORT = 'export',
  IMPORT = 'import'
}

export enum ResourceType {
  USER = 'user',
  ORDER = 'order',
  PRODUCT = 'product',
  DOCUMENT = 'document',
  INVENTORY = 'inventory',
  PAYMENT = 'payment',
  NOTIFICATION = 'notification',
  SETTINGS = 'settings',
  AUDIT_LOG = 'audit_log',
  FARMER = 'farmer',
  SUPPLIER = 'supplier',
  MARKETPLACE = 'marketplace'
}

export interface IAdminAuditLog extends Document {
  // User who performed the action
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  
  // Action details
  action: ActivityAction | string;
  resourceType: ResourceType | string;
  resourceId: string | Types.ObjectId;
  resourceName?: string;
  
  // Change details
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  
  // System info
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  
  // Status
  status: ActivityStatus;
  errorMessage?: string;
  stackTrace?: string;
  
  // Timestamps
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  message: string;
  
  // Methods
  generateMessage(): string;
}

interface IAdminAuditLogModel {
  logActivity(activity: Partial<IAdminAuditLog>): Promise<IAdminAuditLog>;
}

const LocationSchema = new Schema({
  country: { type: String },
  region: { type: String },
  city: { type: String },
}, { _id: false });

const AdminAuditLogSchema = new Schema<IAdminAuditLog, IAdminAuditLogModel>({
  userId: { type: String, index: true },
  userEmail: { type: String, index: true },
  userName: { type: String },
  userRole: { type: String, index: true },
  
  action: { 
    type: String, 
    required: true,
    enum: Object.values(ActivityAction),
    index: true 
  },
  resourceType: { 
    type: String, 
    required: true,
    enum: Object.values(ResourceType),
    index: true 
  },
  resourceId: { 
    type: Schema.Types.Mixed, 
    required: true,
    index: true 
  },
  resourceName: { type: String },
  
  changes: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
  
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  location: { type: LocationSchema },
  
  status: { 
    type: String, 
    enum: Object.values(ActivityStatus), 
    default: ActivityStatus.SUCCESS,
    index: true 
  },
  errorMessage: { type: String },
  stackTrace: { type: String },
  
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
AdminAuditLogSchema.index({ userId: 1, timestamp: -1 });
AdminAuditLogSchema.index({ action: 1, timestamp: -1 });
AdminAuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AdminAuditLogSchema.index({ status: 1, timestamp: -1 });
AdminAuditLogSchema.index({ 'location.country': 1 });
AdminAuditLogSchema.index({ 'location.region': 1 });
AdminAuditLogSchema.index({ 'location.city': 1 });

// Virtual for formatted message
AdminAuditLogSchema.virtual('message').get(function(this: IAdminAuditLog) {
  return this.generateMessage();
});

// Method to generate human-readable message
AdminAuditLogSchema.methods.generateMessage = function(this: IAdminAuditLog): string {
  const { action, resourceType, resourceName, userName } = this;
  const resourceId = this.resourceId?.toString().substring(0, 8) || '';
  
  // Define message templates
  type MessageTemplates = Record<string, Record<string, string>>;
  
  const messages: MessageTemplates = {
    [ResourceType.USER]: {
      [ActivityAction.CREATE]: `${userName || 'System'} created a new user account`,
      [ActivityAction.UPDATE]: `${userName || 'System'} updated user profile`,
      [ActivityAction.DELETE]: `${userName || 'System'} deleted a user account`,
      [ActivityAction.LOGIN]: `${userName || 'User'} logged in`,
      [ActivityAction.LOGOUT]: `${userName || 'User'} logged out`,
    },
    [ResourceType.ORDER]: {
      [ActivityAction.CREATE]: `New order #${resourceId} placed`,
      [ActivityAction.UPDATE]: `Order #${resourceId} was updated`,
      [ActivityAction.STATUS_CHANGE]: `Order #${resourceId} status changed to ${(this.metadata as any)?.status || 'updated'}`,
      [ActivityAction.CANCEL]: `Order #${resourceId} was cancelled`,
      [ActivityAction.PAYMENT]: `Payment received for order #${resourceId}`,
    },
    [ResourceType.PRODUCT]: {
      [ActivityAction.CREATE]: `New product added: ${resourceName || resourceId}`,
      [ActivityAction.UPDATE]: `Product updated: ${resourceName || resourceId}`,
      [ActivityAction.DELETE]: `Product removed: ${resourceName || resourceId}`,
    },
    [ResourceType.DOCUMENT]: {
      [ActivityAction.UPLOAD]: `New document uploaded: ${resourceName || 'Document'}`,
      [ActivityAction.VERIFY]: `Document verified: ${resourceName || 'Document'}`,
      [ActivityAction.REJECT]: `Document rejected: ${resourceName || 'Document'}`,
    },
    [ResourceType.INVENTORY]: {
      [ActivityAction.UPDATE]: `Inventory updated for ${resourceName || 'product'}`,
      [ActivityAction.CREATE]: `New inventory item added: ${resourceName || resourceId}`,
      [ActivityAction.DELETE]: `Inventory item removed: ${resourceName || resourceId}`,
    },
    [ResourceType.PAYMENT]: {
      [ActivityAction.CREATE]: `New payment initiated: ${resourceId}`,
      [ActivityAction.UPDATE]: `Payment status updated: ${(this.metadata as any)?.status || 'updated'}`,
      [ActivityAction.REFUND]: `Refund processed: ${resourceId}`,
    },
  };

  // Get messages for the current resource type or an empty object
  const resourceMessages = messages[resourceType] || {};
  
  // Default messages for basic CRUD operations
  const defaultMessages: Record<string, string> = {
    [ActivityAction.CREATE]: `${resourceType} created`,
    [ActivityAction.UPDATE]: `${resourceType} updated`,
    [ActivityAction.DELETE]: `${resourceType} deleted`,
  };

  // Return the most specific message available, or fall back to a generic one
  return resourceMessages[action] || 
         defaultMessages[action] || 
         `${resourceType} ${action}`;
};

// Static method to log a new activity
AdminAuditLogSchema.static('logActivity', async function(this: any, activity: Partial<IAdminAuditLog>): Promise<IAdminAuditLog> {
  try {
    const { getClientInfo } = await import('@/lib/utils/client-info');
    const clientInfo = await getClientInfo();
    
    const logData = {
      ...activity,
      ipAddress: activity.ipAddress || clientInfo.req.ip,
      userAgent: activity.userAgent || clientInfo.req.headers['user-agent'],
      timestamp: activity.timestamp || new Date(),
      status: activity.status || ActivityStatus.SUCCESS,
    };

    return this.create(logData);
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
});

// Create and export the model
const AdminAuditLog = mongoose.models.AdminAuditLog ||
                     mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);

export { AdminAuditLog };
export default AdminAuditLog;
