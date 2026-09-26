import mongoose, { Schema, Document } from 'mongoose';

export interface ICropSale extends Document {
  poolId: mongoose.Types.ObjectId | string;
  poolName: string;
  cropName: string;
  variety?: string;
  harvestDate?: Date;
  saleDate: Date;
  quantity: number; // e.g. 50
  unit: string; // 'Quintals' | 'Tons' | 'Kg'
  pricePerUnit: number; // in INR
  totalAmount: number; // in INR
  
  // Buyer Details
  buyerName: string;
  buyerType: 'trader' | 'apmc_buyer' | 'retailer' | 'exporter' | 'fpo' | 'direct_consumer';
  buyerContact?: string;
  buyerGstOrAadhaar?: string;
  destinationLocation?: string;

  // Escrow & Payment Logistics
  paymentStatus: 'in_escrow' | 'released' | 'pending' | 'failed';
  escrowReleaseConditions?: string;
  escrowReleaseDate?: Date;
  paymentMode: 'bank_transfer' | 'upi' | 'cash' | 'smart_contract_escrow';
  referenceTransactionId?: string;

  // Recorded / Supervised By
  recordedBy: mongoose.Types.ObjectId | string;
  recordedByName: string;
  status: 'draft' | 'completed' | 'cancelled';
  notes?: string;

  // Blockchain Ledger Proofs
  blockchain?: {
    isAnchored: boolean;
    receiptHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const CropSaleSchema = new Schema<ICropSale>(
  {
    poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool', required: true, index: true },
    poolName: { type: String, required: true },
    cropName: { type: String, required: true },
    variety: { type: String },
    harvestDate: { type: Date },
    saleDate: { type: Date, default: Date.now },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'Quintals' },
    pricePerUnit: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    buyerName: { type: String, required: true },
    buyerType: { 
      type: String, 
      enum: ['trader', 'apmc_buyer', 'retailer', 'exporter', 'fpo', 'direct_consumer'], 
      default: 'trader' 
    },
    buyerContact: { type: String },
    buyerGstOrAadhaar: { type: String },
    destinationLocation: { type: String },

    paymentStatus: { 
      type: String, 
      enum: ['in_escrow', 'released', 'pending', 'failed'], 
      default: 'released' 
    },
    escrowReleaseConditions: { type: String },
    escrowReleaseDate: { type: Date },
    paymentMode: { 
      type: String, 
      enum: ['bank_transfer', 'upi', 'cash', 'smart_contract_escrow'], 
      default: 'bank_transfer' 
    },
    referenceTransactionId: { type: String },

    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordedByName: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['draft', 'completed', 'cancelled'], 
      default: 'completed' 
    },
    notes: { type: String },

    blockchain: {
      isAnchored: { type: Boolean, default: false },
      receiptHash: { type: String },
      transactionHash: { type: String },
      blockNumber: { type: Number },
      timestamp: { type: Date }
    }
  },
  { timestamps: true }
);

export const CropSale = 
  mongoose.models.CropSale || 
  mongoose.model<ICropSale>('CropSale', CropSaleSchema);

export default CropSale;
