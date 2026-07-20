import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlistItem {
  productId: string;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>({
  productId: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const WishlistSchema = new Schema<IWishlist>({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  items: [WishlistItemSchema],
}, {
  timestamps: true
});

// Create indexes for better performance
WishlistSchema.index({ userId: 1 });
WishlistSchema.index({ 'items.productId': 1 });

export const FarmerWishlist = mongoose.models.FarmerWishlistNew || mongoose.model<IWishlist>('FarmerWishlistNew', WishlistSchema);
