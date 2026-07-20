import mongoose, { Document, Schema } from 'mongoose';

export type DocumentType = 'rtc' | 'aadhaar' | 'land-sketch' | 'other';

export interface IDocument extends Document {
  owner: mongoose.Types.ObjectId;
  type: DocumentType;
  originalName?: string;
  mimeType?: string;
  size?: number;
  path: string;
  cid?: string;
  cloudinaryId?: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    owner: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    type: { 
      type: String, 
      enum: ['rtc', 'aadhaar', 'land-sketch', 'other'], 
      required: true, 
      index: true 
    },
    originalName: { 
      type: String,
      trim: true
    },
    mimeType: { 
      type: String,
      trim: true
    },
    size: { 
      type: Number,
      min: 0
    },
    path: { 
      type: String, 
      required: true,
      trim: true
    },
    cid: { 
      type: String,
      trim: true
    },
    cloudinaryId: {
      type: String,
      trim: true,
      index: true,
      sparse: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true,
      index: true
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add text index for search
DocumentSchema.index(
  { 
    originalName: 'text',
    'metadata.text': 'text',
    tags: 'text'
  },
  {
    weights: {
      originalName: 10,
      'metadata.text': 5,
      tags: 3
    },
    name: 'document_text_search'
  }
);

// Compound indexes for common queries
DocumentSchema.index({ owner: 1, type: 1 });
DocumentSchema.index({ isPublic: 1, type: 1 });
DocumentSchema.index({ createdAt: -1 });
DocumentSchema.index({ updatedAt: -1 });

// Virtual for file URL
DocumentSchema.virtual('url').get(function() {
  if (this.cloudinaryId) {
    return this.path; // Cloudinary URL is already in path
  }
  return `/api/documents/${this._id}/download`;
});

// Pre-save hook to ensure timestamps
DocumentSchema.pre<IDocument>('save', function() {
  const now = new Date();
  if (!this.createdAt) {
    this.createdAt = now;
  }
  this.updatedAt = now;
});

// Static method to find by Cloudinary ID
DocumentSchema.statics.findByCloudinaryId = function(cloudinaryId: string) {
  return this.findOne({ cloudinaryId });
};

// Method to get public URL if available
DocumentSchema.methods.getPublicUrl = function() {
  if (this.isPublic && this.cloudinaryId) {
    return this.path;
  }
  return null;
};

const DocumentModel = mongoose.models.Document ||
  mongoose.model<IDocument>('Document', DocumentSchema);

export default DocumentModel;
