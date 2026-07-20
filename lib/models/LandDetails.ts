import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILandDetails extends Document {
  user: Types.ObjectId;
  userId?: string; // For easier lookup

  // Land sketch image
  sketchImage?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  };

  // Land coordinates and measurements
  landData?: {
    centroidLatitude: number;
    centroidLongitude: number;
    sideLengths: number[]; // in meters
    vertices: Array<{
      latitude: number;
      longitude: number;
      order: number;
    }>;
    landSizeInAcres?: number; // land size from RTC document in acres
    geojson?: string; // GeoJSON string
  };

  // RTC land details
  rtcDetails?: {
    surveyNumber: string;
    extent: string; // acres
    location: string; // village, hobli, taluk
    taluk?: string;
    hobli?: string;
    village?: string;
    soilType?: string;
    cropType?: string;
  };

  // Processing status
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
      filename: { type: String, required: false },
      originalName: { type: String, required: false },
      path: { type: String, required: false },
      size: { type: Number, required: false },
      mimeType: { type: String, required: false },
      uploadedAt: { type: Date, default: Date.now }
    },

    landData: {
      centroidLatitude: { type: Number, required: false },
      centroidLongitude: { type: Number, required: false },
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
      extent: { type: String },
      location: { type: String },
      taluk: { type: String },
      hobli: { type: String },
      village: { type: String },
      soilType: { type: String },
      cropType: { type: String }
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

// Index for faster queries
LandDetailsSchema.index({ userId: 1 });
LandDetailsSchema.index({ user: 1 });
LandDetailsSchema.index({ 'rtcDetails.surveyNumber': 1 });

export const LandDetails =
  mongoose.models.LandDetails || mongoose.model<ILandDetails>('LandDetails', LandDetailsSchema);
