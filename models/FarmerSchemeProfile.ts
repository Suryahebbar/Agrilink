import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmerSchemeProfile extends Document {
  userId: string;
  profileData: {
    scheme_name?: string;
    official_link?: string;
    land_size?: string;
    farmer_category?: string;
    location_state?: string;
    location_district?: string;
    location_taluk?: string;
    village_rtc_data?: string;
    crop_type?: string;
    season?: string;
    irrigation_type?: string;
    water_source_capacity?: string;
    organic_certification?: string;
    farmer_age?: string;
    gender?: string;
    income_catogory?: string;
    pm_kisan_registration?: string;
    equipment_ownership?: string;
    fpo_membership?: string;
    insurance_status_pmfby?: string;
    disaster_affected_region?: string;
    soil_type?: string;
  };
  searchResults: {
    eligibleSchemes: Array<{
      name: string;
      link?: string;
      raw: Record<string, any>;
    }>;
    count: number;
    searchedAt: Date;
  }[];
  isActive: boolean;
  isDefault: boolean;
  profileName: string;
  createdAt: Date;
  updatedAt: Date;
}

const FarmerSchemeProfileSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  profileData: {
    scheme_name: String,
    official_link: String,
    land_size: String,
    farmer_category: String,
    location_state: String,
    location_district: String,
    location_taluk: String,
    village_rtc_data: String,
    crop_type: String,
    season: String,
    irrigation_type: String,
    water_source_capacity: String,
    organic_certification: String,
    farmer_age: String,
    gender: String,
    income_catogory: String,
    pm_kisan_registration: String,
    equipment_ownership: String,
    fpo_membership: String,
    insurance_status_pmfby: String,
    disaster_affected_region: String,
    soil_type: String
  },
  searchResults: [{
    eligibleSchemes: [{
      name: { type: String, required: true },
      link: String,
      raw: { type: Schema.Types.Mixed, default: {} }
    }],
    count: { type: Number, default: 0 },
    searchedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  profileName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  }
}, {
  timestamps: true
});

// Indexes for performance
FarmerSchemeProfileSchema.index({ userId: 1, isActive: 1 });
FarmerSchemeProfileSchema.index({ userId: 1, isDefault: 1 });
FarmerSchemeProfileSchema.index({ createdAt: -1 });

// Ensure only one default profile per user
FarmerSchemeProfileSchema.pre('save', async function(next: any) {
  if (this.isDefault && this.isModified('isDefault')) {
    await (this.constructor as any).updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.models.FarmerSchemeProfile || mongoose.model<IFarmerSchemeProfile>('FarmerSchemeProfile', FarmerSchemeProfileSchema);
