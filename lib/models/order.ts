import mongoose, { Document, Schema } from 'mongoose';

// Order Item Interface
interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  discount?: number;
  tax?: number;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  discount: {
    type: Number,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  tax: {
    type: Number,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  }
});

// Shipping Address Interface
interface IShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
}

const ShippingAddressSchema = new Schema<IShippingAddress>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: 'India' },
  landmark: { type: String, trim: true }
});

// Shipping Details Interface
interface IShippingDetails {
  method: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingCost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

const ShippingDetailsSchema = new Schema<IShippingDetails>({
  method: { type: String, required: true },
  carrier: { type: String },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  shippingCost: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered'],
    default: 'pending'
  }
});

// Payment Details Interface
interface IPaymentDetails {
  method: string;
  transactionId?: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  amount: number;
  currency: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
}

const PaymentDetailsSchema = new Schema<IPaymentDetails>({
  method: { type: String, required: true },
  transactionId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  currency: { type: String, required: true, default: 'INR' },
  paidAt: { type: Date },
  refundedAt: { type: Date },
  refundAmount: {
    type: Number,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  refundReason: { type: String }
});

// Order Interface
export interface IOrder extends Document {
  orderNumber: string;
  sellerId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  billingAddress?: IShippingAddress;
  shippingDetails: IShippingDetails;
  paymentDetails: IPaymentDetails;
  orderStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  notes?: string;
  internalNotes?: string;
  timeline: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Order Schema
const OrderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^ORD-\d{8}-\d{4}$/, 'Order number must be in format ORD-YYYYMMDD-XXXX']
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true }
  },
  items: [OrderItemSchema],
  shippingAddress: {
    type: ShippingAddressSchema,
    required: true
  },
  billingAddress: {
    type: ShippingAddressSchema
  },
  shippingDetails: {
    type: ShippingDetailsSchema,
    required: true
  },
  paymentDetails: {
    type: PaymentDetailsSchema,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    required: true,
    default: 'new',
    index: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  internalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes
OrderSchema.index({ sellerId: 1, orderStatus: 1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ 'paymentDetails.status': 1 });
OrderSchema.index({ 'shippingDetails.status': 1 });

// Pre-save middleware
OrderSchema.pre('save', function(next: any) {
  this.updatedAt = new Date();
  
  // Auto-generate order number if not provided
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${dateStr}-${random}`;
  }
  
  // Add to timeline if status changed
  if (this.isModified('orderStatus')) {
    this.timeline.push({
      status: this.orderStatus,
      timestamp: new Date()
    });
  }
  
  next();
});

// Virtual for payment status
OrderSchema.virtual('paymentStatus').get(function() {
  return this.paymentDetails.status;
});

// Virtual for shipping status
OrderSchema.virtual('shippingStatus').get(function() {
  return this.shippingDetails.status;
});

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
