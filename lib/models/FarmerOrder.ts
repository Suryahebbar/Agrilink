import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFarmerOrderItem {
  productId: Types.ObjectId | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sellerId?: Types.ObjectId | string;
  sellerName?: string;
}

export interface IFarmerOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  userId?: string;
  items: IFarmerOrderItem[];
  totalAmount: number;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: {
    method?: 'card' | 'upi' | 'netbanking' | 'wallet';
    transactionId?: string;
    paidAt?: Date;
  };
  shipping: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  tracking: {
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    carrier?: string;
    currentLocation?: string;
  };
  statusHistory: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const FarmerOrderItemSchema = new Schema<IFarmerOrderItem>({
  productId: { type: Schema.Types.Mixed, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  sellerId: { type: Schema.Types.Mixed },
  sellerName: { type: String },
}, { _id: false });

const FarmerOrderSchema = new Schema<IFarmerOrder>({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: String, index: true },
  items: { type: [FarmerOrderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentDetails: {
    method: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet'] },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  shipping: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  tracking: {
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    carrier: { type: String, default: 'AgroConnect Express' },
    currentLocation: { type: String },
  },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

FarmerOrderSchema.index({ user: 1, createdAt: -1 });
FarmerOrderSchema.index({ userId: 1, createdAt: -1 });

export const FarmerOrder =
  mongoose.models.FarmerOrder ||
  mongoose.model<IFarmerOrder>('FarmerOrder', FarmerOrderSchema);
