import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmPoolParticipant {
  userId: mongoose.Types.ObjectId | string;
  fullName: string;
  phone?: string;
  landId: mongoose.Types.ObjectId | string;
  landSize: number;
  surveyNumber: string;
  investmentContribution: number;
  labourContribution: number; // e.g. hours per week or percentage
  machineryContribution: string; // text description
  landContribution: number; // in acres
  signatureHash?: string;
  signedAt?: Date;
  signatureImage?: string;
  signatureMethod?: 'draw' | 'upload';
  signatureUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  collaborationModel?: number;
  labourChargePerDay?: number;
}

export interface IFarmPool extends Document {
  name: string;
  status: 'awaiting_counselor' | 'counseling_scheduled' | 'planning' | 'signing' | 'blockchain_storage' | 'active';
  participants: IFarmPoolParticipant[];
  counselorId?: mongoose.Types.ObjectId | string;
  counselorName?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  meetingDetails?: {
    meetingType: 'online' | 'offline';
    scheduledAt: Date;
    meetingLink?: string;
    location?: string;
    checklist?: {
      benefits: boolean;
      risks: boolean;
      profitSharing: boolean;
      lossSharing: boolean;
      responsibilities: boolean;
      exitConditions: boolean;
      investmentModel: boolean;
      insurance: boolean;
      resourceSharing: boolean;
      answersProvided: boolean;
    };
  };
  collaborationModel?: 1 | 2 | 3 | 4 | 5; // Models 1-5
  farmPlan?: {
    // Farm Information
    selectedCrop: string;
    cultivationPeriod: string; // e.g. "July 2026 - Nov 2026"
    farmArea: number; // total combined acres
    irrigationMethod: string;
    
    // Farm Management
    cropPlanning: string;
    sowingSchedule: string;
    fertilizerSchedule: string;
    irrigationSchedule: string;
    pestMonitoring: string;
    harvestSchedule: string;

    // Financial Details
    estimatedCost: number;
    expectedYield: string; // e.g. "50 tons"
    expectedRevenue: number;
    profitSharingRatio: string; // e.g. "Farmer A: 40%, Farmer B: 30%, AgriLink: 30%"
    lossSharingRatio: string;

    // Resource Allocation
    seeds: string;
    fertilizers: string;
    equipment: string;
    labour: string;
    storage: string;
    transportation: string;

    // Insurance
    insuranceType: 'government' | 'private' | 'none';
    insuranceProvider: string;
    coverageDetails: string;
    claimResponsibility: string;
    premiumSharing: string;
  };
  blockchain?: {
    contractHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: Date;
    version?: string;
    isImmutable?: boolean;
    sealedAt?: string;
    blocksProgress?: Array<{
      blockNumber: number;
      timestamp: Date;
      action: string;
      parentHash: string;
      blockHash: string;
      remarks: string;
      operator: string;
    }>;
  };
  startDate?: Date;
  endDate?: Date;
  isTerminated?: boolean;
  tasksList?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'completed';
    date: string;
  }>;
  expensesList?: Array<{
    id: string;
    category: string;
    amount: number;
    date: string;
    farmerId: string;
    farmerName: string;
    reason: string;
  }>;
  uploadedFiles?: Array<{
    id: string;
    name: string;
    url: string; // base64 payload
    uploadedAt: string;
  }>;
  proposedSchemes?: Array<{
    _id?: any;
    schemeId: mongoose.Types.ObjectId | string;
    schemeName: string;
    proposedBy: mongoose.Types.ObjectId | string;
    proposerName: string;
    status: 'voting' | 'approved' | 'rejected' | 'applied';
    votes: Array<{
      userId: mongoose.Types.ObjectId | string;
      vote: 'yes' | 'no';
      votedAt: Date;
    }>;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const FarmPoolParticipantSchema = new Schema<IFarmPoolParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  landId: { type: Schema.Types.ObjectId, ref: 'LandDetails', required: true },
  landSize: { type: Number, required: true },
  surveyNumber: { type: String, required: true },
  investmentContribution: { type: Number, default: 0 },
  labourContribution: { type: Number, default: 0 },
  machineryContribution: { type: String, default: '' },
  landContribution: { type: Number, default: 0 },
  signatureHash: { type: String },
  signedAt: { type: Date },
  signatureImage: { type: String },
  signatureMethod: { type: String },
  signatureUrl: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  collaborationModel: { type: Number, default: 1 },
  labourChargePerDay: { type: Number, default: 0 }
});

const FarmPoolSchema = new Schema<IFarmPool>({
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['awaiting_counselor', 'counseling_scheduled', 'planning', 'signing', 'blockchain_storage', 'active'], 
    default: 'awaiting_counselor',
    required: true 
  },
  participants: [FarmPoolParticipantSchema],
  counselorId: { type: Schema.Types.ObjectId, ref: 'User' },
  counselorName: { type: String },
  rejectionReason: { type: String },
  rejectedBy: { type: String },
  meetingDetails: {
    meetingType: { type: String, enum: ['online', 'offline'], default: 'online' },
    scheduledAt: { type: Date },
    meetingLink: { type: String },
    location: { type: String },
    checklist: {
      benefits: { type: Boolean, default: false },
      risks: { type: Boolean, default: false },
      profitSharing: { type: Boolean, default: false },
      lossSharing: { type: Boolean, default: false },
      responsibilities: { type: Boolean, default: false },
      exitConditions: { type: Boolean, default: false },
      investmentModel: { type: Boolean, default: false },
      insurance: { type: Boolean, default: false },
      resourceSharing: { type: Boolean, default: false },
      answersProvided: { type: Boolean, default: false }
    }
  },
  collaborationModel: { type: Number, enum: [1, 2, 3, 4, 5], default: 1 },
  farmPlan: {
    selectedCrop: { type: String },
    cultivationPeriod: { type: String },
    farmArea: { type: Number },
    irrigationMethod: { type: String },
    
    cropPlanning: { type: String },
    sowingSchedule: { type: String },
    fertilizerSchedule: { type: String },
    irrigationSchedule: { type: String },
    pestMonitoring: { type: String },
    harvestSchedule: { type: String },

    estimatedCost: { type: Number, default: 0 },
    expectedYield: { type: String },
    expectedRevenue: { type: Number, default: 0 },
    profitSharingRatio: { type: String },
    lossSharingRatio: { type: String },

    seeds: { type: String },
    fertilizers: { type: String },
    equipment: { type: String },
    labour: { type: String },
    storage: { type: String },
    transportation: { type: String },

    insuranceType: { type: String, enum: ['government', 'private', 'none'], default: 'none' },
    insuranceProvider: { type: String },
    coverageDetails: { type: String },
    claimResponsibility: { type: String },
    premiumSharing: { type: String }
  },
  blockchain: {
    contractHash: { type: String },
    transactionHash: { type: String },
    blockNumber: { type: Number },
    timestamp: { type: Date },
    version: { type: String, default: '1.0.0' },
    isImmutable: { type: Boolean, default: false },
    sealedAt: { type: String },
    blocksProgress: [{
      blockNumber: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      action: { type: String, required: true },
      parentHash: { type: String, required: true },
      blockHash: { type: String, required: true },
      remarks: { type: String },
      operator: { type: String, default: 'System' }
    }]
  },
  startDate: { type: Date },
  endDate: { type: Date },
  isTerminated: { type: Boolean, default: false },
  tasksList: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    date: { type: String, required: true }
  }],
  expensesList: [{
    id: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    reason: { type: String, required: true }
  }],
  uploadedFiles: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: String, required: true }
  }],
  proposedSchemes: [{
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    schemeName: { type: String, required: true },
    proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    proposerName: { type: String, required: true },
    status: { type: String, enum: ['voting', 'approved', 'rejected', 'applied'], default: 'voting' },
    votes: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      vote: { type: String, enum: ['yes', 'no'], required: true },
      votedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

if (mongoose.models.FarmPool) {
  delete (mongoose.models as any).FarmPool;
}
export const FarmPool = mongoose.model<IFarmPool>('FarmPool', FarmPoolSchema);
