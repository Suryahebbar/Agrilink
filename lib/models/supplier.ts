import mongoose, { Schema, model, Document, models } from 'mongoose';

// Document interface for verification tracking
interface IDocument {
  url: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
}

// Seller Document Schema
export interface ISeller extends Document {
  companyName: string;
  email: string;
  phone: string;
  passwordHash: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  gstNumber?: string;
  avatarUrl?: string;
  businessDetails?: {
    businessType: string;
    yearsInOperation: string;
    productCategories: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents: {
    businessCertificate?: IDocument | string;
    tradeLicense?: IDocument | string;
    ownerIdProof?: IDocument | string;
    gstCertificate?: IDocument | string;
  };
  settings?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderNotifications: boolean;
    lowStockAlerts: boolean;
    reviewNotifications: boolean;
    marketingEmails: boolean;
    autoConfirmOrders: boolean;
    defaultShippingMethod: string;
    returnPolicy: string;
    taxInclusive: boolean;
    taxRate: number; // e.g. 0.18 for 18% GST
    twoFactorAuth: boolean;
    sessionTimeout: string;
    currency: string;
    timezone: string;
    language: string;
  };
  isActive: boolean;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Document schema for verification tracking
const DocumentSchema = new Schema({
  url: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  verifiedAt: { type: Date },
  verifiedBy: { type: String },
  rejectionReason: { type: String }
}, { _id: false, discriminatorKey: 'type' });

// Allow both string and object types for documents
const MixedDocumentSchema = new Schema({
  type: { type: String, default: 'object' },
  url: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  verifiedAt: { type: Date },
  verifiedBy: { type: String },
  rejectionReason: { type: String }
}, { _id: false });

void mongoose;
void DocumentSchema;
void MixedDocumentSchema;

const SellerSchema = new Schema<ISeller>({
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  },
  gstNumber: { type: String },
  avatarUrl: { type: String },
  businessDetails: {
    businessType: { type: String, default: '' },
    yearsInOperation: { type: String, default: '' },
    productCategories: { type: String, default: '' },
  },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  documents: {
    businessCertificate: { type: Schema.Types.Mixed, default: null },
    tradeLicense: { type: Schema.Types.Mixed, default: null },
    ownerIdProof: { type: Schema.Types.Mixed, default: null },
    gstCertificate: { type: Schema.Types.Mixed, default: null }
  },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    orderNotifications: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true },
    reviewNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    autoConfirmOrders: { type: Boolean, default: false },
    defaultShippingMethod: { type: String, default: 'standard' },
    returnPolicy: { type: String, default: '30-days' },
    taxInclusive: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0.18 },
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: String, default: '24h' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' }
  },
  isActive: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiry: { type: Date }
}, {
  timestamps: true
});

// Product Document Schema
export interface IProduct extends Document {
  sellerId: Schema.Types.ObjectId;
  name: string;
  sku: string;
  category: 'seeds' | 'fertilizers' | 'pesticides' | 'tools' | 'equipment' | 'feed' | 'other';
  description: string;
  price: number;
  stockQuantity: number;
  reorderThreshold: number;
  images: {
    url: string;
    alt: string;
    position: number;
  }[];
  tags: string[];
  status: 'active' | 'inactive' | 'draft';
  specifications?: {
    [key: string]: string | number;
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: ['seeds', 'fertilizers', 'pesticides', 'tools', 'equipment', 'feed', 'other'], 
    required: true 
  },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, default: 0, min: 0 },
  reorderThreshold: { type: Number, required: true, default: 5, min: 0 },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    position: { type: Number, required: true }
  }],
  tags: [{ type: String }],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'draft'], 
    default: 'draft' 
  },
  specifications: { type: Schema.Types.Mixed },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    weight: { type: Number },
    unit: { type: String, default: 'cm' }
  }
}, {
  timestamps: true
});

// Inventory Log Document Schema
export interface IInventoryLog extends Document {
  productId: Schema.Types.ObjectId;
  sellerId: Schema.Types.ObjectId;
  change: number; // Positive for addition, negative for deduction
  reason: 'manual' | 'sale' | 'return' | 'restock' | 'adjustment';
  referenceId?: string; // Order ID, etc.
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  change: { type: Number, required: true },
  reason: { 
    type: String, 
    enum: ['manual', 'sale', 'return', 'restock', 'adjustment'], 
    required: true 
  },
  referenceId: { type: String },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  notes: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Order Document Schema
export interface IOrder extends Document {
  orderNumber: string;
  sellerId: Schema.Types.ObjectId;
  customer: {
    name: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
  };
  items: {
    productId: Schema.Types.ObjectId;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: {
    method?: 'card' | 'upi' | 'netbanking' | 'wallet';
    transactionId?: string;
    paidAt?: Date;
  };
  orderStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  shippingDetails?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' }
    }
  },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentDetails: {
    method: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet'] },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  orderStatus: { 
    type: String, 
    enum: ['new', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'], 
    default: 'new' 
  },
  shippingDetails: {
    trackingNumber: { type: String },
    carrier: { type: String },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date }
  },
  notes: { type: String }
}, {
  timestamps: true
});

// Review Document Schema
export interface IReview extends Document {
  productId: Schema.Types.ObjectId;
  sellerId: Schema.Types.ObjectId;
  orderId?: Schema.Types.ObjectId;
  customerName: string;
  rating: number; // 1-5
  title: string;
  body: string;
  sentiment: 'good' | 'moderate' | 'poor';
  isFlagged: boolean;
  flagReason?: string;
  flaggedAt?: Date;
  sellerResponse?: {
    response: string;
    respondedBy?: string;
    respondedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  body: { type: String, required: true },
  sentiment: { 
    type: String, 
    enum: ['good', 'moderate', 'poor'], 
    required: true 
  },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedAt: { type: Date },
  sellerResponse: {
    response: { type: String },
    respondedBy: { type: String },
    respondedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Daily Analytics Aggregates Schema
export interface IDailyAnalytics extends Document {
  sellerId: Schema.Types.ObjectId;
  date: Date;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  bestSellers: {
    productId: Schema.Types.ObjectId;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  categories: {
    seeds: { revenue: number; orders: number };
    fertilizers: { revenue: number; orders: number };
    pesticides: { revenue: number; orders: number };
    tools: { revenue: number; orders: number };
    equipment: { revenue: number; orders: number };
    feed: { revenue: number; orders: number };
    other: { revenue: number; orders: number };
  };
  createdAt: Date;
}

const DailyAnalyticsSchema = new Schema<IDailyAnalytics>({
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  date: { type: Date, required: true },
  revenue: { type: Number, required: true, default: 0 },
  orders: { type: Number, required: true, default: 0 },
  avgOrderValue: { type: Number, required: true, default: 0 },
  bestSellers: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    revenue: { type: Number, required: true }
  }],
  categories: {
    seeds: { revenue: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    fertilizers: { revenue: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    pesticides: { revenue: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    tools: { revenue: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    equipment: { revenue: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    feed: { revenue: { type: Number, default: 0 }, orders: { type: Number, default: 0 } },
    other: { revenue: { type: Number, default: 0 }, orders: { type: Number, default: 0 } }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Create indexes for better performance
SellerSchema.index({ verificationStatus: 1 });

ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

InventoryLogSchema.index({ productId: 1, createdAt: -1 });
InventoryLogSchema.index({ sellerId: 1, createdAt: -1 });

OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });

ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ sellerId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isFlagged: 1 });

DailyAnalyticsSchema.index({ sellerId: 1, date: -1 });
DailyAnalyticsSchema.index({ date: -1 });

// Export models (reuse if already compiled)
export const Seller = models.Supplier || model<ISeller>('Supplier', SellerSchema);
export const SupplierProduct = models.SupplierProduct || model<IProduct>('SupplierProduct', ProductSchema);
export const Product = models.Product || model<IProduct>('Product', ProductSchema, 'supplierproducts');
export const InventoryLog = models.SupplierInventoryLog || model<IInventoryLog>('SupplierInventoryLog', InventoryLogSchema);
export const Order = models.SupplierOrder || model<IOrder>('SupplierOrder', OrderSchema);
export const Review = models.SupplierReview || model<IReview>('SupplierReview', ReviewSchema);
export const DailyAnalytics = models.SupplierDailyAnalytics || model<IDailyAnalytics>('SupplierDailyAnalytics', DailyAnalyticsSchema);
