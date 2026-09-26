import mongoose, { Schema, Document } from 'mongoose';

export interface ISchemeRecommendation extends Document {
  schemeId: mongoose.Types.ObjectId | string;
  fcoId: mongoose.Types.ObjectId | string;
  targetFilters: Record<string, any>;
  farmerResponses: Array<{
    userId: mongoose.Types.ObjectId | string;
    fullName: string;
    status: 'pending' | 'interested' | 'not_interested';
    updatedAt: Date;
  }>;
  bulkApplied: boolean;
  bulkAppliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SchemeRecommendationSchema = new Schema({
  schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
  fcoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetFilters: { type: Schema.Types.Mixed, default: {} },
  farmerResponses: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    status: { type: String, enum: ['pending', 'interested', 'not_interested'], default: 'pending' },
    updatedAt: { type: Date, default: Date.now }
  }],
  bulkApplied: { type: Boolean, default: false },
  bulkAppliedAt: Date
}, { timestamps: true });

export default mongoose.models.SchemeRecommendation || mongoose.model<ISchemeRecommendation>('SchemeRecommendation', SchemeRecommendationSchema);
