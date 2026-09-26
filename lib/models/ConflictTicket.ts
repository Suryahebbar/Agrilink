import mongoose, { Schema, Document } from 'mongoose';

export interface IConflictTicket extends Document {
  poolId: mongoose.Types.ObjectId;
  poolName: string;
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  category: 'labour' | 'water' | 'financial' | 'boundary' | 'others';
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  visibility: 'public' | 'private';
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConflictTicketSchema = new Schema<IConflictTicket>({
  poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool', required: true },
  poolName: { type: String, required: true },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['labour', 'water', 'financial', 'boundary', 'others'], 
    required: true,
    default: 'others'
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending', required: true },
  visibility: { type: String, enum: ['public', 'private'], default: 'public', required: true },
  resolution: { type: String },
  resolvedAt: { type: Date },
  resolvedBy: { type: String }
}, {
  timestamps: true
});

if (mongoose.models.ConflictTicket) {
  delete (mongoose.models as any).ConflictTicket;
}

export const ConflictTicket = mongoose.model<IConflictTicket>('ConflictTicket', ConflictTicketSchema);
