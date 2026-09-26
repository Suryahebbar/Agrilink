import mongoose, { Schema, Document } from 'mongoose';

export interface IMemberSettlement {
  userId: mongoose.Types.ObjectId | string;
  fullName: string;
  landAcres: number;
  equityPercentage: number;
  grossAllocation: number;
  expenseDeduction: number;
  labourReimbursement: number;
  machineryReimbursement: number;
  netPayout: number;
  payoutStatus: 'pending' | 'disbursed' | 'credited';
  breakdownNotes: string;
}

export interface IPoolSettlement extends Document {
  poolId: mongoose.Types.ObjectId | string;
  poolName: string;
  season: string; // e.g. "Kharif 2026"
  collaborationModel: 1 | 2 | 3 | 4 | 5;
  modelName: string;
  
  // Production Metrics
  harvestYield: number; // e.g. in Quintals
  yieldUnit: string; // 'Quintals' | 'Tons' | 'Kg'
  sellingPricePerUnit: number;
  buyerName?: string;
  
  // Financial Statement
  grossHarvestRevenue: number;
  totalInputExpenses: number;
  agriLinkCommissionOrFee: number;
  netDistributableMargin: number;
  
  // Member Allocations
  memberSettlements: IMemberSettlement[];
  
  // Settlement Metadata
  settledBy: mongoose.Types.ObjectId | string;
  settlerName: string;
  settledAt: Date;
  status: 'draft' | 'finalized' | 'audited';
  blockchainTxHash?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSettlementSchema = new Schema<IMemberSettlement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  landAcres: { type: Number, required: true },
  equityPercentage: { type: Number, required: true },
  grossAllocation: { type: Number, required: true },
  expenseDeduction: { type: Number, required: true, default: 0 },
  labourReimbursement: { type: Number, required: true, default: 0 },
  machineryReimbursement: { type: Number, required: true, default: 0 },
  netPayout: { type: Number, required: true },
  payoutStatus: { type: String, enum: ['pending', 'disbursed', 'credited'], default: 'credited' },
  breakdownNotes: { type: String }
});

const PoolSettlementSchema = new Schema<IPoolSettlement>(
  {
    poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool', required: true, index: true },
    poolName: { type: String, required: true },
    season: { type: String, default: 'Current Season' },
    collaborationModel: { type: Number, required: true, enum: [1, 2, 3, 4, 5] },
    modelName: { type: String, required: true },
    harvestYield: { type: Number, required: true },
    yieldUnit: { type: String, default: 'Quintals' },
    sellingPricePerUnit: { type: Number, required: true },
    buyerName: { type: String },
    grossHarvestRevenue: { type: Number, required: true },
    totalInputExpenses: { type: Number, required: true, default: 0 },
    agriLinkCommissionOrFee: { type: Number, required: true, default: 0 },
    netDistributableMargin: { type: Number, required: true },
    memberSettlements: [MemberSettlementSchema],
    settledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    settlerName: { type: String, required: true },
    settledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['draft', 'finalized', 'audited'], default: 'finalized' },
    blockchainTxHash: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export const PoolSettlement = 
  mongoose.models.PoolSettlement || 
  mongoose.model<IPoolSettlement>('PoolSettlement', PoolSettlementSchema);

export default PoolSettlement;
