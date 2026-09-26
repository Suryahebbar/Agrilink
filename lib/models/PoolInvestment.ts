import mongoose, { Schema, Document } from 'mongoose';

export interface IPoolInvestment extends Document {
  poolId: mongoose.Types.ObjectId | string;
  poolName: string;
  investorId?: mongoose.Types.ObjectId | string;
  investorName: string;
  investorType: 'farmer_partner' | 'third_party' | 'institutional' | 'fpo_grant' | 'agri_tech_fund';
  investorContact?: string;
  investorAadhaarOrPan?: string;
  
  amount: number; // in INR
  investmentDate: Date;
  terms: string; // e.g., "15% equity preference share", "Fixed 8% annual return upon harvest"
  expectedReturnRate?: number; // percentage
  tenureMonths?: number;
  
  status: 'active' | 'matured' | 'returned' | 'cancelled';
  disbursementMode: 'bank_transfer' | 'cheque' | 'smart_contract_vault';
  referenceTransactionId?: string;

  recordedBy: mongoose.Types.ObjectId | string;
  recordedByName: string;
  notes?: string;

  // Blockchain Investment Proofs
  blockchain?: {
    isAnchored: boolean;
    investmentHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const PoolInvestmentSchema = new Schema<IPoolInvestment>(
  {
    poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool', required: true, index: true },
    poolName: { type: String, required: true },
    investorId: { type: Schema.Types.ObjectId, ref: 'User' },
    investorName: { type: String, required: true },
    investorType: { 
      type: String, 
      enum: ['farmer_partner', 'third_party', 'institutional', 'fpo_grant', 'agri_tech_fund'], 
      default: 'third_party' 
    },
    investorContact: { type: String },
    investorAadhaarOrPan: { type: String },

    amount: { type: Number, required: true, min: 0 },
    investmentDate: { type: Date, default: Date.now },
    terms: { type: String, required: true },
    expectedReturnRate: { type: Number, default: 0 },
    tenureMonths: { type: Number, default: 12 },

    status: { 
      type: String, 
      enum: ['active', 'matured', 'returned', 'cancelled'], 
      default: 'active' 
    },
    disbursementMode: { 
      type: String, 
      enum: ['bank_transfer', 'cheque', 'smart_contract_vault'], 
      default: 'bank_transfer' 
    },
    referenceTransactionId: { type: String },

    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordedByName: { type: String, required: true },
    notes: { type: String },

    blockchain: {
      isAnchored: { type: Boolean, default: false },
      investmentHash: { type: String },
      transactionHash: { type: String },
      blockNumber: { type: Number },
      timestamp: { type: Date }
    }
  },
  { timestamps: true }
);

export const PoolInvestment = 
  mongoose.models.PoolInvestment || 
  mongoose.model<IPoolInvestment>('PoolInvestment', PoolInvestmentSchema);

export default PoolInvestment;
