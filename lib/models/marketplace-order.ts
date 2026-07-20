import mongoose, { Document, Schema } from 'mongoose';

// Marketplace Order Item Schema
interface IMarketplaceOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  image?: string;
  subtotal: number;
}

const MarketplaceOrderItemSchema = new Schema<IMarketplaceOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  sellerName: { type: String, required: true },
  image: { type: String },
  subtotal: { type: Number, required: true }
});

// Customer Details Schema
interface IMarketplaceCustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

const MarketplaceCustomerDetailsSchema = new Schema<IMarketplaceCustomerDetails>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  }
});

// Payment Details Schema
interface IMarketplacePaymentDetails {
  method: 'cod' | 'card' | 'upi';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Date;
}

const MarketplacePaymentDetailsSchema = new Schema<IMarketplacePaymentDetails>({
  method: { type: String, enum: ['cod', 'card', 'upi'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  transactionId: { type: String },
  paidAt: { type: Date }
});

// Status History Schema
interface IMarketplaceStatusHistory {
  status: string;
  timestamp: Date;
  updatedBy: string;
  comment: string;
}

const MarketplaceStatusHistorySchema = new Schema<IMarketplaceStatusHistory>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: String, required: true },
  comment: { type: String, required: true }
});

// Shipping Details Schema
interface IMarketplaceShippingDetails {
  method: string;
  estimatedDelivery: Date;
  trackingNumber?: string;
  status: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

const MarketplaceShippingDetailsSchema = new Schema<IMarketplaceShippingDetails>({
  method: { type: String, default: 'standard' },
  estimatedDelivery: { type: Date, required: true },
  trackingNumber: { type: String },
  status: { type: String, default: 'processing' },
  shippedAt: { type: Date },
  deliveredAt: { type: Date }
});

// Main Marketplace Order Schema
interface IMarketplaceOrder extends Document {
  orderId: string;
  customerDetails: IMarketplaceCustomerDetails;
  items: IMarketplaceOrderItem[];
  totalAmount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  status: string;
  statusHistory: IMarketplaceStatusHistory[];
  paymentDetails: IMarketplacePaymentDetails;
  shippingDetails: IMarketplaceShippingDetails;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceOrderSchema = new Schema<IMarketplaceOrder>({
  orderId: { 
    type: String, 
    required: true, 
    unique: true
  },
  customerDetails: { 
    type: MarketplaceCustomerDetailsSchema, 
    required: true 
  },
  items: { 
    type: [MarketplaceOrderItemSchema], 
    required: true 
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  shipping: { 
    type: Number, 
    required: true,
    default: 0
  },
  tax: { 
    type: Number, 
    required: true,
    default: 0
  },
  status: { 
    type: String, 
    enum: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'confirmed',
    index: true
  },
  statusHistory: { 
    type: [MarketplaceStatusHistorySchema], 
    default: [] 
  },
  paymentDetails: { 
    type: MarketplacePaymentDetailsSchema, 
    required: true 
  },
  shippingDetails: { 
    type: MarketplaceShippingDetailsSchema, 
    required: true 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MarketplaceOrderSchema.index({ 'customerDetails.email': 1 });
MarketplaceOrderSchema.index({ createdAt: -1 });
MarketplaceOrderSchema.index({ 'items.sellerId': 1 });

export const MarketplaceOrder = mongoose.models.MarketplaceOrder || mongoose.model<IMarketplaceOrder>('MarketplaceOrder', MarketplaceOrderSchema);
