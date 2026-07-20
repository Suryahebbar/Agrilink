import mongoose, { Schema, model, Document, models } from 'mongoose';

export interface IMarketplaceReview extends Document {
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  images?: string[];
  helpful: number; // Number of people who found this helpful
  verified: boolean; // Verified purchase
  sellerResponse?: {
    response: string;
    respondedAt: Date;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceReviewSchema = new Schema<IMarketplaceReview>({
  productId: { type: String, required: true, index: true },
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  images: [{ type: String }],
  helpful: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  sellerResponse: {
    response: { type: String, maxlength: 500 },
    respondedAt: { type: Date }
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

// Indexes for better performance
MarketplaceReviewSchema.index({ productId: 1, status: 1 });
MarketplaceReviewSchema.index({ userId: 1, productId: 1 });
MarketplaceReviewSchema.index({ createdAt: -1 });
MarketplaceReviewSchema.index({ rating: 1 });

export const MarketplaceReview = models.MarketplaceReview || model<IMarketplaceReview>('MarketplaceReview', MarketplaceReviewSchema);
