import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoolItem {
  productId: Types.ObjectId | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  unit?: string;
  sellerId?: Types.ObjectId | string;
  sellerName?: string;
}

export interface IMemberSplit {
  userId: Types.ObjectId | string;
  fullName: string;
  phone?: string;
  landSize: number;
  sharePercentage: number;
  amountDue: number;
  status: 'pending' | 'approved' | 'rejected';
  votedAt?: Date;
  rejectionReason?: string;
}

export interface IPoolPurchaseProposal extends Document {
  poolId: Types.ObjectId;
  poolName: string;
  proposedBy: Types.ObjectId;
  proposerName: string;
  items: IPoolItem[];
  totalAmount: number;
  memberSplits: IMemberSplit[];
  status: 'voting' | 'approved' | 'executed' | 'cancelled';
  executedOrderId?: Types.ObjectId | string;
  fcoExpenseId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PoolItemSchema = new Schema<IPoolItem>({
  productId: { type: Schema.Types.Mixed, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: Schema.Types.Mixed },
  category: { type: String },
  unit: { type: String },
  sellerId: { type: Schema.Types.Mixed },
  sellerName: { type: String },
}, { _id: false });

const MemberSplitSchema = new Schema<IMemberSplit>({
  userId: { type: Schema.Types.Mixed, required: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  landSize: { type: Number, required: true },
  sharePercentage: { type: Number, required: true },
  amountDue: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  votedAt: { type: Date },
  rejectionReason: { type: String },
}, { _id: false });

const PoolPurchaseProposalSchema = new Schema<IPoolPurchaseProposal>({
  poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool', required: true, index: true },
  poolName: { type: String, required: true },
  proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  proposerName: { type: String, required: true },
  items: { type: [PoolItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  memberSplits: { type: [MemberSplitSchema], required: true },
  status: { 
    type: String, 
    enum: ['voting', 'approved', 'executed', 'cancelled'], 
    default: 'voting', 
    index: true 
  },
  executedOrderId: { type: Schema.Types.Mixed },
  fcoExpenseId: { type: String },
  notes: { type: String },
}, { timestamps: true });

PoolPurchaseProposalSchema.index({ poolId: 1, createdAt: -1 });

export const PoolPurchaseProposal =
  mongoose.models.PoolPurchaseProposal ||
  mongoose.model<IPoolPurchaseProposal>('PoolPurchaseProposal', PoolPurchaseProposalSchema);
