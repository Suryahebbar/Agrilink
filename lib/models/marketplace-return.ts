import mongoose, { Schema, model, Document, models } from 'mongoose';

export interface IMarketplaceReturn extends Document {
  orderId: string;
  userId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
    condition: 'damaged' | 'wrong_item' | 'not_as_described' | 'defective' | 'other';
    images?: string[];
  }[];
  returnReason: string;
  refundMethod: 'original' | 'bank_transfer' | 'wallet' | 'store_credit';
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  status: 'requested' | 'approved' | 'rejected' | 'processing' | 'completed';
  refundAmount: number;
  trackingNumber?: string;
  pickupAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceReturnSchema = new Schema<IMarketplaceReturn>({
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    condition: { 
      type: String, 
      enum: ['damaged', 'wrong_item', 'not_as_described', 'defective', 'other'], 
      required: true 
    },
    images: [{ type: String }]
  }],
  returnReason: { type: String, required: true },
  refundMethod: { 
    type: String, 
    enum: ['original', 'bank_transfer', 'wallet', 'store_credit'], 
    default: 'original' 
  },
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String },
    bankName: { type: String }
  },
  status: { 
    type: String, 
    enum: ['requested', 'approved', 'rejected', 'processing', 'completed'], 
    default: 'requested' 
  },
  refundAmount: { type: Number, required: true },
  trackingNumber: { type: String },
  pickupAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  adminNotes: { type: String }
}, {
  timestamps: true
});

// Indexes for better performance
MarketplaceReturnSchema.index({ userId: 1, status: 1 });
MarketplaceReturnSchema.index({ orderId: 1 });
MarketplaceReturnSchema.index({ createdAt: -1 });

export const MarketplaceReturn = models.MarketplaceReturn || model<IMarketplaceReturn>('MarketplaceReturn', MarketplaceReturnSchema);
