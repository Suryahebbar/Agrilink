import mongoose, { Document, Schema } from 'mongoose';

// Address Schema
interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' }
});

// Documents Schema
interface IDocuments {
  businessCertificate?: string;
  tradeLicense?: string;
  ownerIdProof?: string;
  gstCertificate?: string;
}

const DocumentsSchema = new Schema<IDocuments>({
  businessCertificate: { type: String },
  tradeLicense: { type: String },
  ownerIdProof: { type: String },
  gstCertificate: { type: String }
});

// Seller/Supplier Interface
export interface ISeller extends Document {
  companyName: string;
  email: string;
  phone: string;
  passwordHash: string;
  address: IAddress;
  gstNumber?: string;
  avatarUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents: IDocuments;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailOtp?: string;
  phoneOtp?: string;
  otpExpiresAt?: Date;
  settings: {
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
    twoFactorAuth: boolean;
    sessionTimeout: string;
    currency: string;
    timezone: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Seller Schema
const SellerSchema = new Schema<ISeller>({
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6
  },
  address: {
    type: AddressSchema,
    required: true
  },
  gstNumber: {
    type: String,
    trim: true,
    match: [/^[0-9A-Z]{15}$/, 'Please enter a valid GST number']
  },
  avatarUrl: {
    type: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  documents: {
    type: DocumentsSchema,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    type: String
  },
  phoneOtp: {
    type: String
  },
  otpExpiresAt: {
    type: Date
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
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: String, default: '24h' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
SellerSchema.index({ companyName: 1 });
SellerSchema.index({ verificationStatus: 1 });
SellerSchema.index({ isActive: 1 });
SellerSchema.index({ createdAt: -1 });

// Pre-save middleware
SellerSchema.pre('save', function(next: any) {
  this.updatedAt = new Date();
  next();
});

export const Seller = mongoose.models.Seller || mongoose.model<ISeller>('Seller', SellerSchema);
