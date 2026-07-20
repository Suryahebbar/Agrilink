import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'farmer' | 'supplier';

export interface IUser extends Document {
  role: UserRole;
  fullName?: string; // farmer
  email: string;
  phone?: string; // farmer
  companyName?: string; // supplier
  businessEmail?: string; // supplier (can reuse email too)
  upiId?: string; // supplier
  passwordHash: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailOtp?: string;
  phoneOtp?: string;
  otpExpiresAt?: Date;
  // Farmer verification field
  isVerified?: boolean; // Admin verification status for farmers
  // Supplier verification fields
  documentsUploaded?: boolean; // Whether supplier has uploaded required documents
  verificationStatus?: 'pending' | 'verified' | 'rejected'; // Admin verification status
  verifiedAt?: Date; // When admin verified the supplier
  rejectionReason?: string; // Reason for rejection if applicable
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['farmer', 'supplier'], required: true },
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    companyName: { type: String },
    businessEmail: { type: String },
    upiId: { type: String },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    emailOtp: { type: String },
    phoneOtp: { type: String },
    otpExpiresAt: { type: Date },
    // Farmer verification field
    isVerified: { type: Boolean, default: false },
    // Supplier verification fields
    documentsUploaded: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
