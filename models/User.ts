import mongoose, { Document, Schema, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the user roles
export enum UserRole {
  FARMER = 'farmer',
  SUPPLIER = 'supplier',
  ADMIN = 'admin',
  FCO = 'fco'
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  phone?: string;
  address?: string;
  profilePicture?: string;
  // FCO Profile details
  employeeId?: string;
  username?: string;
  qualification?: string;
  experience?: number;
  createdBy?: string;
  status?: string;
  firstLogin?: boolean;
  lastLoginAt?: Date;
  loginCount?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = any;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.FARMER,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    employeeId: { type: String, unique: true, sparse: true, index: true },
    username: { type: String, unique: true, sparse: true, index: true },
    qualification: { type: String },
    experience: { type: Number },
    createdBy: { type: String },
    status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
    // Login tracking & Welcome notification
    firstLogin: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { password, __v, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next: any) {
  const self = this as any;
  if (!self.isModified('password') || !self.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    self.password = await bcrypt.hash(self.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  this: any,
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create and export the model
if (mongoose.models.User) {
  delete (mongoose.models as any).User;
}
const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
