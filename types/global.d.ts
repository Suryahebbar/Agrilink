// Type declarations for the application
declare module '@/lib/utils/client-info' {
  export interface ClientInfo {
    req: {
      ip: string;
      headers: {
        'user-agent'?: string;
        'x-forwarded-for'?: string;
        'x-real-ip'?: string;
        [key: string]: string | undefined;
      };
      get: (header: string) => string | null;
    };
  }

  export function getClientInfo(): Promise<ClientInfo>;
  export function getClientInfoFromRequest(req: any): ClientInfo;
  export function getClientInfoFromBrowser(): ClientInfo;
}

declare module '@/lib/models/AdminAuditLog' {
  import { Document, Model, Schema } from 'mongoose';
  
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
    userId?: string;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    action: ActivityAction | string;
    resourceType: ResourceType | string;
    resourceId: string | Schema.Types.ObjectId;
    resourceName?: string;
    changes?: Record<string, { old: any; new: any }>;
    metadata?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };
    status: ActivityStatus;
    errorMessage?: string;
    stackTrace?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    generateMessage(): string;
  }

  export const AdminAuditLog: Model<IAdminAuditLog>;
  
  export function logActivity(activity: Partial<IAdminAuditLog>): Promise<IAdminAuditLog>;
}
