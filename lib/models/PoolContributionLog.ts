import mongoose, { Schema, Document } from 'mongoose';

export interface IPoolContributionLog extends Document {
  poolId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  farmerName: string;
  type: 'labour' | 'machinery' | 'capital';
  activityName: string; // e.g. "Weeding & Furrowing", "Tractor Ploughing", "Emergency Input Injection"
  quantity: number; // hours or currency amount
  unit: string; // 'hours' | 'days' | 'INR'
  unitRate?: number; // e.g. ₹100/hr labour or ₹800/hr tractor
  totalValue: number; // quantity * unitRate or capital amount
  date: Date;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: mongoose.Types.ObjectId | string;
  verifiedByName?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;

  // Blockchain Ledger Proofs
  blockchain?: {
    isAnchored: boolean;
    proofHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const PoolContributionLogSchema = new Schema<IPoolContributionLog>(
  {
    poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farmerName: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['labour', 'machinery', 'capital'], 
      required: true 
    },
    activityName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'hours' },
    unitRate: { type: Number, default: 0 },
    totalValue: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending' 
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedByName: { type: String },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
    blockchain: {
      isAnchored: { type: Boolean, default: false },
      proofHash: { type: String },
      transactionHash: { type: String },
      blockNumber: { type: Number },
      timestamp: { type: Date }
    }
  },
  { timestamps: true }
);

export const PoolContributionLog = 
  mongoose.models.PoolContributionLog || 
  mongoose.model<IPoolContributionLog>('PoolContributionLog', PoolContributionLogSchema);

export default PoolContributionLog;
