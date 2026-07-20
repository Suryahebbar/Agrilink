import mongoose, { Document, Schema } from 'mongoose';

// Review Response Interface
interface IReviewResponse {
  response: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt: Date;
}

const ReviewResponseSchema = new Schema<IReviewResponse>({
  response: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Seller'
  },
  respondedAt: {
    type: Date,
    default: Date.now
  }
});

// Review Interface
export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  sentiment: 'good' | 'moderate' | 'poor';
  isVerified: boolean;
  isFlagged: boolean;
  flagReason?: string;
  sellerResponse?: IReviewResponse;
  helpful: number;
  notHelpful: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationNotes?: string;
  orderId?: mongoose.Types.ObjectId;
  purchaseVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Review Schema
const ReviewSchema = new Schema<IReview>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  customerEmail: {
    type: String,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  images: [{
    type: String
  }],
  sentiment: {
    type: String,
    enum: ['good', 'moderate', 'poor'],
    required: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  isFlagged: {
    type: Boolean,
    default: false,
    index: true
  },
  flagReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  sellerResponse: {
    type: ReviewResponseSchema
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  notHelpful: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true
  },
  moderationNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  purchaseVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes
ReviewSchema.index({ sellerId: 1, status: 1 });
ReviewSchema.index({ sellerId: 1, rating: -1 });
ReviewSchema.index({ sellerId: 1, sentiment: 1 });
ReviewSchema.index({ sellerId: 1, isFlagged: 1 });
ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ productId: 1, rating: -1 });
ReviewSchema.index({ customerId: 1, productId: 1 });
ReviewSchema.index({ createdAt: -1 });

// Pre-save middleware
ReviewSchema.pre('save', function(next: any) {
  this.updatedAt = new Date();
  
  // Auto-determine sentiment based on rating
  if (this.isModified('rating')) {
    if (this.rating >= 4) {
      this.sentiment = 'good';
    } else if (this.rating >= 3) {
      this.sentiment = 'moderate';
    } else {
      this.sentiment = 'poor';
    }
  }
  
  // Auto-approve verified reviews
  if (this.isModified('isVerified') && this.isVerified && this.status === 'pending') {
    this.status = 'approved';
  }
  
  next();
});

// Virtual methods
ReviewSchema.methods.addResponse = function(response: string, respondedBy?: mongoose.Types.ObjectId) {
  this.sellerResponse = {
    response,
    respondedBy,
    respondedAt: new Date()
  };
  return this.save();
};

ReviewSchema.methods.flagReview = function(reason: string) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.status = 'flagged';
  return this.save();
};

ReviewSchema.methods.unflagReview = function() {
  this.isFlagged = false;
  this.flagReason = undefined;
  this.status = 'approved';
  return this.save();
};

ReviewSchema.methods.markHelpful = function() {
  this.helpful += 1;
  return this.save();
};

ReviewSchema.methods.markNotHelpful = function() {
  this.notHelpful += 1;
  return this.save();
};

// Static methods
ReviewSchema.statics.getReviewsBySeller = function(sellerId: mongoose.Types.ObjectId, options: any = {}) {
  const query: any = { sellerId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.sentiment) {
    query.sentiment = options.sentiment;
  }
  
  if (options.isFlagged !== undefined) {
    query.isFlagged = options.isFlagged;
  }
  
  return this.find(query)
    .populate('productId', 'name sku images')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

ReviewSchema.statics.getReviewsByProduct = function(productId: mongoose.Types.ObjectId, options: any = {}) {
  const query: any = { productId, status: 'approved' };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 20);
};

ReviewSchema.statics.getFlaggedReviews = function(sellerId: mongoose.Types.ObjectId) {
  return this.find({
    sellerId,
    isFlagged: true
  }).populate('productId', 'name sku');
};

ReviewSchema.statics.getAverageRating = function(productId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { productId, status: 'approved' } },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $addFields: {
        ratingCounts: {
          $reduce: {
            input: [1, 2, 3, 4, 5],
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{ k: { $toString: '$$this' }, v: {
                      $size: {
                        $filter: {
                          input: '$ratingDistribution',
                          cond: { $eq: ['$$item', '$$this'] }
                        }
                      }
                    }}]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

ReviewSchema.statics.getReviewStats = function(sellerId: mongoose.Types.ObjectId, timeRange?: string) {
  const matchQuery: any = { sellerId };
  
  if (timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        matchQuery.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        matchQuery.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        matchQuery.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
    }
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        sentimentCounts: {
          good: { $sum: { $cond: [{ $eq: ['$sentiment', 'good'] }, 1, 0] } } as any,
          moderate: { $sum: { $cond: [{ $eq: ['$sentiment', 'moderate'] }, 1, 0] } } as any,
          poor: { $sum: { $cond: [{ $eq: ['$sentiment', 'poor'] }, 1, 0] } } as any
        } as any,
        flaggedCount: { $sum: { $cond: ['$isFlagged', 1, 0] } },
        respondedCount: { $sum: { $cond: [{ $ne: ['$sellerResponse', null] }, 1, 0] } },
        verifiedCount: { $sum: { $cond: ['$isVerified', 1, 0] } }
      }
    }
  ]);
};

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
