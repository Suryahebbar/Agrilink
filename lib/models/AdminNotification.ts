import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminNotification extends Document {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'user' | 'order' | 'document' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  adminId?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  createdAt: Date;
  readAt?: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], required: true },
  category: { type: String, enum: ['system', 'user', 'order', 'document', 'security'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], required: true },
  read: { type: Boolean, default: false },
  adminId: { type: String, index: true }, // null means notification for all admins
  actionUrl: { type: String },
  actionText: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for better query performance
AdminNotificationSchema.index({ adminId: 1, read: 1, createdAt: -1 });
AdminNotificationSchema.index({ category: 1, createdAt: -1 });
AdminNotificationSchema.index({ priority: 1, read: 1 });

export const AdminNotification = mongoose.models.AdminNotification || mongoose.model<IAdminNotification>('AdminNotification', AdminNotificationSchema);
