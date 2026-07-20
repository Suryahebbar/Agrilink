import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFarmerProfile extends Document {
  user: Types.ObjectId;
  userId?: string; // For easier lookup

  // Farmer Profile - matches extraction output
  verifiedName?: string;
  kannadaName?: string; // RTC Kannada name
  aadhaarKannadaName?: string; // Aadhaar Kannada name
  rtcAddress?: string; // RTC address (land location)
  nameVerificationStatus?: 'verified' | 'not_verified' | 'pending';
  age?: number;
  gender?: string;
  homeAddress?: string; // Aadhaar address
  idProof?: string;
  contactNumber?: string;
  dob?: string;

  // Land Profile - matches extraction output
  landParcelIdentity?: string;
  ownershipVerified?: boolean;
  soilProperties?: string;
  irrigationPotential?: string;
  croppingHistory?: string;
  totalCultivableArea?: string;
  revenueObligations?: string;
  mutationTraceability?: string;

  // Documents & OCR - new structure
  documents?: {
    rtc?: {
      uploaded?: boolean;
      extractedText?: string;
      uploadedAt?: Date;
    };
    aadhaar?: {
      uploaded?: boolean;
      extractedText?: string;
      uploadedAt?: Date;
    };
  };

  // Legacy fields for backward compatibility
  rtcDocumentPath?: string;
  aadharDocumentPath?: string;
  rtcOcrText?: string;
  aadharOcrText?: string;

  // Land Integration fields
  readyToIntegrate?: boolean;
  readyToIntegrateDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const FarmerProfileSchema = new Schema<IFarmerProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    userId: { type: String, index: true },

    verifiedName: { type: String },
    kannadaName: { type: String }, // RTC Kannada name
    aadhaarKannadaName: { type: String }, // Aadhaar Kannada name
    rtcAddress: { type: String }, // RTC address (land location)
    nameVerificationStatus: { type: String, enum: ['verified', 'not_verified', 'pending'], default: 'pending' },
    age: { type: Number },
    gender: { type: String },
    homeAddress: { type: String }, // Aadhaar address
    idProof: { type: String },
    contactNumber: { type: String },
    dob: { type: String },

    landParcelIdentity: { type: String },
    ownershipVerified: { type: Boolean },
    soilProperties: { type: String },
    irrigationPotential: { type: String },
    croppingHistory: { type: String },
    totalCultivableArea: { type: String },
    revenueObligations: { type: String },
    mutationTraceability: { type: String },

    documents: {
      rtc: {
        uploaded: { type: Boolean },
        extractedText: { type: String },
        uploadedAt: { type: Date }
      },
      aadhaar: {
        uploaded: { type: Boolean },
        extractedText: { type: String },
        uploadedAt: { type: Date }
      }
    },

    // Legacy fields for backward compatibility
    rtcDocumentPath: { type: String },
    aadharDocumentPath: { type: String },
    rtcOcrText: { type: String },
    aadharOcrText: { type: String },

    // Land Integration fields
    readyToIntegrate: { type: Boolean, default: false },
    readyToIntegrateDate: { type: Date }
  },
  { timestamps: true }
);

export const FarmerProfile =
  mongoose.models.FarmerProfile || mongoose.model<IFarmerProfile>('FarmerProfile', FarmerProfileSchema);
