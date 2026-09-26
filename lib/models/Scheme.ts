import mongoose, { Schema, Document } from 'mongoose';

export interface IScheme extends Document {
  name: string;
  link?: string;
  category: string;
  isActive: boolean;
  raw: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SchemeSchema: Schema = new Schema({
  name: { type: String, required: true, index: true },
  link: String,
  category: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  raw: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.models.Scheme || mongoose.model<IScheme>('Scheme', SchemeSchema);
