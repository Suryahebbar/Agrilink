import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Re-export all enum types from the canonical auditTypes module
export { ActivityStatus, ActivityAction, ResourceType, LogModule } from '@/lib/auditTypes';
import { ActivityStatus, ActivityAction, ResourceType, LogModule } from '@/lib/auditTypes';

export interface IAdminAuditLog extends Document {
  // Actor
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;  // farmer | admin | system | fco | supplier

  // Action
  action: ActivityAction | string;
  module?: LogModule | string;  // which section (Agreement, Security, etc.)
  resourceType: ResourceType | string;
  resourceId: string | Types.ObjectId;
  resourceName?: string;
  referenceId?: string;   // secondary linked ID (e.g. agreementId when logging a signature)

  // Change tracking
  oldValue?: string;
  newValue?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  remarks?: string;

  // Device / Browser (parsed from userAgent)
  deviceType?: string;   // Mobile | Desktop | Tablet
  browser?: string;      // Chrome | Safari | Firefox | etc.
  os?: string;           // Windows | Android | iOS | etc.

  // Network
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

  // Virtuals / Methods
  message: string;
  generateMessage(): string;
}

// Intentionally not extending Model<> to avoid Mongoose 9 generic arity issues.
// The logActivity static is still registered via schema.static() and accessible at runtime.
interface IAdminAuditLogModel {
  logActivity(activity: Partial<IAdminAuditLog>): Promise<IAdminAuditLog>;
  new (doc?: any): IAdminAuditLog;
  create(doc: any): Promise<IAdminAuditLog>;
  find(filter?: any): any;
  findOne(filter?: any): any;
  countDocuments(filter?: any): any;
}

const LocationSchema = new Schema({
  country: { type: String },
  region: { type: String },
  city: { type: String },
}, { _id: false });

const AdminAuditLogSchema = new Schema<IAdminAuditLog>({
  userId:    { type: String, index: true },
  userEmail: { type: String, index: true },
  userName:  { type: String },
  userRole:  { type: String, index: true },

  action:       { type: String, required: true, index: true },
  module:       { type: String, index: true },
  resourceType: { type: String, required: true, index: true },
  resourceId:   { type: Schema.Types.Mixed, required: true, index: true },
  resourceName: { type: String },
  referenceId:  { type: String, index: true },

  oldValue:  { type: String },
  newValue:  { type: String },
  changes:   { type: Schema.Types.Mixed },
  metadata:  { type: Schema.Types.Mixed },
  remarks:   { type: String },

  deviceType: { type: String },
  browser:    { type: String },
  os:         { type: String },

  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  location:  { type: LocationSchema },

  status:       { type: String, enum: Object.values(ActivityStatus), default: ActivityStatus.SUCCESS, index: true },
  errorMessage: { type: String },
  stackTrace:   { type: String },

  timestamp: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for common dashboard queries
AdminAuditLogSchema.index({ userId: 1, timestamp: -1 });
AdminAuditLogSchema.index({ action: 1, timestamp: -1 });
AdminAuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AdminAuditLogSchema.index({ module: 1, timestamp: -1 });
AdminAuditLogSchema.index({ status: 1, timestamp: -1 });
AdminAuditLogSchema.index({ userRole: 1, timestamp: -1 });

// Virtual: human-readable summary
AdminAuditLogSchema.virtual('message').get(function (this: IAdminAuditLog) {
  return this.generateMessage();
});

AdminAuditLogSchema.methods.generateMessage = function (this: IAdminAuditLog): string {
  const who = this.userName || this.userRole || 'System';
  const what = this.action.replace(/_/g, ' ');
  const target = this.resourceName || this.resourceId?.toString().slice(0, 8) || '';
  if (this.remarks) return this.remarks;
  return `${who} — ${what}${target ? ` (${target})` : ''}`;
};

// Static: log an activity (fire-and-forget style — never throws)
AdminAuditLogSchema.static('logActivity', async function (
  activity: Partial<IAdminAuditLog>
): Promise<IAdminAuditLog> {
  try {
    const logData = {
      ipAddress: 'server',
      userAgent: 'server',
      timestamp: new Date(),
      status: ActivityStatus.SUCCESS,
      ...activity,
    };
    return (AdminAuditLog as any).create(logData);
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
});

if (mongoose.models.AdminAuditLog) {
  delete (mongoose.models as any).AdminAuditLog;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AdminAuditLog = (mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema)) as any;

export { AdminAuditLog };
export default AdminAuditLog;
