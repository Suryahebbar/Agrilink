import mongoose, { Document, Schema } from 'mongoose';

export interface IOcrResult extends Document {
  document: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  status: 'pending' | 'completed' | 'error';
  text?: string;
  fields: {
    // RTC fields
    location?: {
      taluk?: string;
      hobli?: string;
      village?: string;
    };
    land_identification?: {
      survey_number?: string;
      hissa_number?: string;
      valid_from?: string;
    };
    land_details?: {
      total_extent?: string;
      phut_kharab_a?: string;
      phut_kharab_b?: string;
      remaining_extent?: string;
      land_tax?: string;
      soil_type?: string;
    };
    ownership?: {
      owners?: string[];
      extent?: string;
      account_no?: string;
      mutation_no?: string;
      mutation_date?: string;
    };
    cultivation?: Array<{
      year?: string;
      season?: string;
      crop?: string;
      extent?: string;
    }>;
    
    // Aadhaar fields
    aadhaar_number?: string;
    name_english?: string;
    name_kannada?: string;
    mobile?: string;
    
    // Legacy fields for backward compatibility
    ownerName?: string;
    surveyNumber?: string;
    address?: string;
    village?: string;
    hobli?: string;
    taluk?: string;
    district?: string;
    extent?: string;
    khataNumber?: string;
    aadhaarLast4?: string;
    dob?: string;
    gender?: string;
    pincode?: string;
  };
  confidence?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OcrResultSchema = new Schema<IOcrResult>(
  {
    document: { type: Schema.Types.ObjectId, ref: 'Document', required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'completed', 'error'], default: 'pending' },
    text: { type: String },
    fields: {
      // RTC nested structure
      location: {
        taluk: { type: String },
        hobli: { type: String },
        village: { type: String },
      },
      land_identification: {
        survey_number: { type: String },
        hissa_number: { type: String },
        valid_from: { type: String },
      },
      land_details: {
        total_extent: { type: String },
        phut_kharab_a: { type: String },
        phut_kharab_b: { type: String },
        remaining_extent: { type: String },
        land_tax: { type: String },
        soil_type: { type: String },
      },
      ownership: {
        owners: [{ type: String }],
        extent: { type: String },
        account_no: { type: String },
        mutation_no: { type: String },
        mutation_date: { type: String },
      },
      cultivation: [{
        year: { type: String },
        season: { type: String },
        crop: { type: String },
        extent: { type: String },
      }],
      
      // Aadhaar fields
      aadhaar_number: { type: String },
      name_english: { type: String },
      name_kannada: { type: String },
      mobile: { type: String },
      address: { type: String },
      
      // Legacy fields for backward compatibility
      ownerName: { type: String },
      surveyNumber: { type: String },
      village: { type: String },
      hobli: { type: String },
      taluk: { type: String },
      district: { type: String },
      extent: { type: String },
      khataNumber: { type: String },
      aadhaarLast4: { type: String },
      dob: { type: String },
      gender: { type: String },
      pincode: { type: String },
    },
    confidence: { type: Number },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.OcrResult || mongoose.model<IOcrResult>('OcrResult', OcrResultSchema);
