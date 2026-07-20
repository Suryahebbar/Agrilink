import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICart extends Document {
  user: Types.ObjectId;
  userId?: string;
  items: Array<{
    productId: Types.ObjectId | string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    sellerId?: Types.ObjectId | string;
    sellerName?: string;
  }>;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: String, index: true },
  items: [{
    productId: { type: Schema.Types.Mixed, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    sellerId: { type: Schema.Types.Mixed },
    sellerName: { type: String }
  }],
  totalAmount: { type: Number, default: 0, min: 0 }
}, { 
  timestamps: true,
  collection: 'carts'
});

CartSchema.index({ user: 1 });
CartSchema.index({ userId: 1 });

export const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
