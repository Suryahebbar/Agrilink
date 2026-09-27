import mongoose, { Schema, Document } from 'mongoose';

export interface IInsuranceClaimMedia {
  url: string;
  type: 'image' | 'video' | 'document';
  caption?: string;
  uploadedAt: Date;
}

export interface IInsuranceClaimInspection {
  inspectedBy: mongoose.Types.ObjectId | string;
  inspectorName: string;
  inspectedAt: Date;
  verifiedDamagePercent: number;
  assessedLossAmount: number;
  recommendation: 'approve' | 'reject' | 'revise';
  inspectionNotes: string;
  fieldPhotos?: string[];
  reportSignedHash?: string;
}

export interface IInsuranceClaim extends Document {
  poolId?: mongoose.Types.ObjectId | string;
  farmerId: mongoose.Types.ObjectId | string;
  farmerName: string;
  farmerPhone?: string;
  policyId?: string;
  policyName: string;
  policyType: 'government' | 'private';
  providerName: string;
  cropName: string;
  affectedAcres: number;
  totalFarmAcres: number;
  
  // Incident details
  calamityType: 'drought' | 'excess_rain' | 'flood' | 'hailstorm' | 'pest_outbreak' | 'wildfire' | 'cyclone' | 'disease_epidemic' | 'other';
  incidentDate: Date;
  estimatedLossPercentage: number;
  estimatedLossAmount: number;
  description: string;
  damageMedia: IInsuranceClaimMedia[];
  
  // Claim tracking
  claimNumber: string;
  status: 'submitted' | 'fco_assigned' | 'inspected' | 'insurer_review' | 'approved' | 'settled' | 'rejected';
  
  // FCO On-site inspection
  fcoInspection?: IInsuranceClaimInspection;
  
  // Payout / Settlement
  approvedPayoutAmount?: number;
  settlementDate?: Date;
  settlementReference?: string;
  payoutDistributionNotes?: string;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const InsuranceClaimSchema = new Schema<IInsuranceClaim>({
  poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool' },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String, required: true },
  farmerPhone: { type: String },
  policyId: { type: String },
  policyName: { type: String, required: true },
  policyType: { type: String, enum: ['government', 'private'], required: true },
  providerName: { type: String, required: true },
  cropName: { type: String, required: true },
  affectedAcres: { type: Number, required: true },
  totalFarmAcres: { type: Number, required: true },
  
  calamityType: { 
    type: String, 
    enum: ['drought', 'excess_rain', 'flood', 'hailstorm', 'pest_outbreak', 'wildfire', 'cyclone', 'disease_epidemic', 'other'],
    required: true 
  },
  incidentDate: { type: Date, required: true },
  estimatedLossPercentage: { type: Number, required: true },
  estimatedLossAmount: { type: Number, required: true },
  description: { type: String, required: true },
  damageMedia: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'document'], default: 'image' },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  claimNumber: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['submitted', 'fco_assigned', 'inspected', 'insurer_review', 'approved', 'settled', 'rejected'],
    default: 'submitted'
  },
  
  fcoInspection: {
    inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    inspectorName: { type: String },
    inspectedAt: { type: Date },
    verifiedDamagePercent: { type: Number },
    assessedLossAmount: { type: Number },
    recommendation: { type: String, enum: ['approve', 'reject', 'revise'] },
    inspectionNotes: { type: String },
    fieldPhotos: [{ type: String }],
    reportSignedHash: { type: String }
  },
  
  approvedPayoutAmount: { type: Number },
  settlementDate: { type: Date },
  settlementReference: { type: String },
  payoutDistributionNotes: { type: String },
  rejectionReason: { type: String }
}, {
  timestamps: true
});

if (mongoose.models.InsuranceClaim) {
  delete (mongoose.models as any).InsuranceClaim;
}

export const InsuranceClaim = mongoose.model<IInsuranceClaim>('InsuranceClaim', InsuranceClaimSchema);
export default InsuranceClaim;
