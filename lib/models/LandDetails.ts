import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILandDetails extends Document {
  user: Types.ObjectId;
  userId?: string;

  sketchImage?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  };

  landData?: {
    centroidLatitude: number;
    centroidLongitude: number;
    latitude?: number;
    longitude?: number;
    sideLengths: number[];
    vertices: Array<{
      latitude: number;
      longitude: number;
      order: number;
    }>;
    landSizeInAcres?: number;
    geojson?: string;
  };

  rtcDetails?: {
    surveyNumber: string;
    surnoc?: string;
    hissa?: string;
    extent: string;
    location: string;
    taluk?: string;
    hobli?: string;
    village?: string;
    soilType?: string;
    cropType?: string;
    
    // Detailed registry info
    ownerName?: string;
    fatherName?: string;
    khataNumber?: string;
    ownershipType?: string;
    
    // Revenue & Pot Kharab metrics
    potKharabA?: string;
    potKharabB?: string;
    revenue?: string;
    jodi?: string;
    cess?: string;
    waterRate?: string;
    
    // Land and Irrigation details
    landType?: string;
    irrigationSource?: string;
    trees?: string;
    allCrops?: any[];
  };

  processingStatus?: 'pending' | 'completed' | 'failed';
  processedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const LandDetailsSchema = new Schema<ILandDetails>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: String, index: true },

    sketchImage: {
      filename: { type: String },
      originalName: { type: String },
      path: { type: String },
      size: { type: Number },
      mimeType: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    },

    landData: {
      centroidLatitude: { type: Number },
      centroidLongitude: { type: Number },
      latitude: { type: Number },
      longitude: { type: Number },
      sideLengths: [{ type: Number }],
      vertices: [{
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        order: { type: Number, required: true }
      }],
      landSizeInAcres: { type: Number },
      geojson: { type: String }
    },

    rtcDetails: {
      surveyNumber: { type: String },
      surnoc: { type: String },
      hissa: { type: String },
      extent: { type: String },
      location: { type: String },
      taluk: { type: String },
      hobli: { type: String },
      village: { type: String },
      soilType: { type: String },
      cropType: { type: String },
      
      // Detailed registry info
      ownerName: { type: String },
      fatherName: { type: String },
      khataNumber: { type: String },
      ownershipType: { type: String },
      
      // Revenue & Pot Kharab metrics
      potKharabA: { type: String },
      potKharabB: { type: String },
      revenue: { type: String },
      jodi: { type: String },
      cess: { type: String },
      waterRate: { type: String },
      
      // Land and Irrigation details
      landType: { type: String },
      irrigationSource: { type: String },
      trees: { type: String },
      allCrops: { type: Schema.Types.Mixed }
    },

    processingStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'pending' 
    },
    processedAt: { type: Date }
  },
  { timestamps: true }
);

LandDetailsSchema.index({ userId: 1 });
LandDetailsSchema.index({ user: 1 });
LandDetailsSchema.index({ 'rtcDetails.surveyNumber': 1 });

export const LandDetails =
  mongoose.models.LandDetails || mongoose.model<ILandDetails>('LandDetails', LandDetailsSchema);
