import mongoose, { Schema, model, Document, models } from 'mongoose';

export interface IMarketplaceAddress extends Document {
  userId: string;
  type: 'shipping' | 'billing' | 'both';
  fullName: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  isDefault: boolean;
  landmark?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceAddressSchema = new Schema<IMarketplaceAddress>({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['shipping', 'billing', 'both'], 
    default: 'shipping' 
  },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  },
  isDefault: { type: Boolean, default: false },
  landmark: { type: String },
  instructions: { type: String, maxlength: 200 }
}, {
  timestamps: true
});

// Indexes for better performance
MarketplaceAddressSchema.index({ userId: 1, isDefault: 1 });
MarketplaceAddressSchema.index({ userId: 1, type: 1 });

export const MarketplaceAddress = models.MarketplaceAddress || model<IMarketplaceAddress>('MarketplaceAddress', MarketplaceAddressSchema);
