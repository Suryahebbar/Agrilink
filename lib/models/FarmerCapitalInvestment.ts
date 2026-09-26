import mongoose, { Schema, Document } from 'mongoose';

export type InvestmentType = 'self_equity' | 'kcc_loan' | 'bank_agri_loan' | 'private_partner' | 'government_subsidy' | 'fpo_share';

export interface IFarmerCapitalInvestment extends Document {
  farmerId: mongoose.Types.ObjectId | string;
  farmerName: string;
  cropName: string; // e.g. "Arecanut Plantation", "Coffee Estate", "Paddy"
  season: string; // e.g. "Annual 2026", "Kharif 2026"
  plotAreaAcres: number;
  
  investmentType: InvestmentType;
  title: string; // e.g., "Drip Irrigation Setup", "Borewell Drilling & Pump", "Tractor Down Payment"
  capitalAmount: number; // in INR
  investmentDate: Date;
  tenureYears?: number;
  interestRateAnnual?: number; // e.g. 4% for KCC, 7% for Bank
  
  expectedRevenue: number; // in INR
  actualRevenueRealized: number; // in INR
  status: 'active' | 'amortized' | 'matured' | 'written_off';
  fundingSource?: string; // "Canara Bank KCC", "Self Savings", "NABARD Subsidy"
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const FarmerCapitalInvestmentSchema = new Schema<IFarmerCapitalInvestment>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farmerName: { type: String, required: true },
    cropName: { type: String, required: true },
    season: { type: String, default: 'Annual 2026' },
    plotAreaAcres: { type: Number, default: 1 },

    investmentType: {
      type: String,
      enum: ['self_equity', 'kcc_loan', 'bank_agri_loan', 'private_partner', 'government_subsidy', 'fpo_share'],
      default: 'self_equity'
    },
    title: { type: String, required: true },
    capitalAmount: { type: Number, required: true, min: 0 },
    investmentDate: { type: Date, default: Date.now },
    tenureYears: { type: Number, default: 1 },
    interestRateAnnual: { type: Number, default: 0 },

    expectedRevenue: { type: Number, default: 0 },
    actualRevenueRealized: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'amortized', 'matured', 'written_off'],
      default: 'active'
    },
    fundingSource: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export const FarmerCapitalInvestment =
  mongoose.models.FarmerCapitalInvestment ||
  mongoose.model<IFarmerCapitalInvestment>('FarmerCapitalInvestment', FarmerCapitalInvestmentSchema);

export default FarmerCapitalInvestment;
