import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseCategory = 'seed' | 'fertilizer' | 'diesel_fuel' | 'labour' | 'irrigation_electricity' | 'machinery_rent' | 'pesticides' | 'transportation' | 'storage' | 'miscellaneous';

export interface IFarmerExpense extends Document {
  farmerId: mongoose.Types.ObjectId | string;
  farmerName: string;
  poolId?: mongoose.Types.ObjectId | string;
  poolName?: string;
  cropName: string; // e.g., "Arecanut", "Paddy", "Black Pepper"
  season: string; // e.g., "Kharif 2026", "Rabi 2026", "Annual 2026"
  plotSurveyNo?: string;
  plotAreaAcres: number;
  
  category: ExpenseCategory;
  title: string; // e.g., "NPK 19:19:19 Fertilizer 10 Bags", "Tractor diesel for land tilling"
  amount: number; // in INR
  quantity?: number;
  unit?: string; // "Bags", "Litres", "Hours", "Days", "Units"
  unitPrice?: number;
  
  expenseDate: Date;
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'credit' | 'kcc_loan';
  vendorName?: string;
  receiptNumber?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const FarmerExpenseSchema = new Schema<IFarmerExpense>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farmerName: { type: String, required: true },
    poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool' },
    poolName: { type: String },
    cropName: { type: String, required: true },
    season: { type: String, default: 'Kharif 2026' },
    plotSurveyNo: { type: String },
    plotAreaAcres: { type: Number, default: 1, min: 0.1 },

    category: {
      type: String,
      enum: ['seed', 'fertilizer', 'diesel_fuel', 'labour', 'irrigation_electricity', 'machinery_rent', 'pesticides', 'transportation', 'storage', 'miscellaneous'],
      required: true
    },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'Units' },
    unitPrice: { type: Number, default: 0 },

    expenseDate: { type: Date, default: Date.now },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'credit', 'kcc_loan'],
      default: 'cash'
    },
    vendorName: { type: String },
    receiptNumber: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export const FarmerExpense =
  mongoose.models.FarmerExpense ||
  mongoose.model<IFarmerExpense>('FarmerExpense', FarmerExpenseSchema);

export default FarmerExpense;
