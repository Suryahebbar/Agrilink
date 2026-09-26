import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmLifecyclePlan extends Document {
  poolId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  farmerName: string;
  cropKey: string;
  cropName: string;
  variety?: string;
  sowingDate: Date;
  acreage: number;
  expectedHarvestDate: Date;
  status: 'active' | 'harvested' | 'cancelled';
  notes?: string;

  // Real-time task checklist
  tasks: {
    _id?: mongoose.Types.ObjectId | string;
    taskId: string;
    category: 'irrigation' | 'fertilizer' | 'pest_scouting' | 'labour' | 'harvest';
    title: string;
    description: string;
    dueDayOffset: number;
    dueDate: Date;
    stageName: string;
    dosage?: string;
    completed: boolean;
    completedAt?: Date;
    completedBy?: string;
  }[];

  // Pest incident reports logged by farmer or FCO
  pestIncidents: {
    _id?: mongoose.Types.ObjectId | string;
    pestName: string;
    severity: 'low' | 'medium' | 'high';
    symptoms: string;
    advisory: string;
    photoUrl?: string;
    status: 'reported' | 'treated' | 'resolved';
    reportedAt: Date;
    reportedBy: string;
    resolutionNotes?: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const FarmLifecyclePlanSchema = new Schema<IFarmLifecyclePlan>(
  {
    poolId: { type: Schema.Types.ObjectId, ref: 'FarmPool', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farmerName: { type: String, required: true },
    cropKey: { type: String, required: true },
    cropName: { type: String, required: true },
    variety: { type: String, default: 'Standard Hybrid' },
    sowingDate: { type: Date, required: true },
    acreage: { type: Number, required: true, min: 0.1 },
    expectedHarvestDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'harvested', 'cancelled'], default: 'active' },
    notes: { type: String },

    tasks: [
      {
        taskId: { type: String, required: true },
        category: { 
          type: String, 
          enum: ['irrigation', 'fertilizer', 'pest_scouting', 'labour', 'harvest'],
          required: true 
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        dueDayOffset: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        stageName: { type: String, required: true },
        dosage: { type: String },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        completedBy: { type: String }
      }
    ],

    pestIncidents: [
      {
        pestName: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        symptoms: { type: String, required: true },
        advisory: { type: String, required: true },
        photoUrl: { type: String },
        status: { type: String, enum: ['reported', 'treated', 'resolved'], default: 'reported' },
        reportedAt: { type: Date, default: Date.now },
        reportedBy: { type: String, required: true },
        resolutionNotes: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export const FarmLifecyclePlan =
  mongoose.models.FarmLifecyclePlan ||
  mongoose.model<IFarmLifecyclePlan>('FarmLifecyclePlan', FarmLifecyclePlanSchema);

export default FarmLifecyclePlan;
