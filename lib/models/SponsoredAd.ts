import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISponsoredAd extends Document {
  sellerId: Types.ObjectId;
  productId: Types.ObjectId;
  campaignType: 'farmer_dashboard_banner' | 'marketplace_featured';
  title: string;
  tagline?: string;
  imageUrl: string;
  targetUrl?: string;
  status: 'active' | 'paused' | 'expired';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SponsoredAdSchema = new Schema<ISponsoredAd>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    campaignType: {
      type: String,
      enum: ['farmer_dashboard_banner', 'marketplace_featured'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    tagline: { type: String, trim: true, maxlength: 200 },
    imageUrl: { type: String, required: true },
    targetUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'paused', 'expired'],
      default: 'active',
      index: true,
    },
    budget: { type: Number, default: 500, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true }
);

SponsoredAdSchema.index({ status: 1, campaignType: 1, createdAt: -1 });

export const SponsoredAd =
  mongoose.models.SponsoredAd || mongoose.model<ISponsoredAd>('SponsoredAd', SponsoredAdSchema);

export default SponsoredAd;
