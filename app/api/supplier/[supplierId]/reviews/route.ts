import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review as SupplierReviewModel, Product as ProductModel } from '@/lib/models/supplier';
import { MarketplaceReview } from '@/lib/models/marketplace-review';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import { Types } from 'mongoose';

interface FormattedReview {
  _id: any;
  type: 'supplier' | 'farmer';
  rating: number;
  comment?: string;
  images: string[];
  status: string;
  product: {
    name: string;
    sku: string;
  } | null;
  order: {
    orderNumber: string;
  } | null;
  createdAt: Date;
}

interface Product {
  _id: Types.ObjectId;
  [key: string]: any; // For any additional properties
}

interface MarketplaceReview {
  _id: Types.ObjectId;
  rating: number;
  comment?: string;
  images?: string[];
  status: string;
  createdAt: Date;
  productId: Types.ObjectId | { name: string; sku: string };
  orderId: Types.ObjectId | { orderNumber: string };
  product?: {
    name: string;
    sku: string;
  };
  order?: {
    orderNumber: string;
  };
}

// GET /api/supplier/[supplierId]/reviews - Get supplier reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    // Authenticate supplier
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sentiment = searchParams.get('sentiment');
    const flagged = searchParams.get('flagged') === 'true';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Get supplier's products to find farmer reviews
    const supplierProducts = await ProductModel.find({ sellerId: sellerId as any }).select('_id').lean<Product[]>();
    const productIds = supplierProducts.map((p: Product) => p._id.toString());
    
    // Get both supplier reviews and farmer marketplace reviews
    const [supplierReviews, farmerReviews] = await Promise.all([
      // Get traditional supplier reviews
      SupplierReviewModel.find({ sellerId: sellerId as any })
        .populate('productId', 'name sku')
        .populate('orderId', 'orderNumber')
        .sort({ createdAt: -1 })
        .lean(),
      
      // Get farmer marketplace reviews for supplier's products
      MarketplaceReview.find({ 
        productId: { $in: productIds },
        status: 'approved'
      })
        .populate('productId', 'name sku')
        .populate('orderId', 'orderNumber')
        .sort({ createdAt: -1 })
        .lean()
    ]);
    
    // Format supplier reviews
    const formattedSupplierReviews = supplierReviews.map((review: any): FormattedReview => ({
      _id: review._id,
      type: 'supplier',
      rating: review.rating,
      comment: review.comment || review.body,
      images: review.images || [],
      status: review.status,
      product: review.productId ? {
        name: review.productId.name || '',
        sku: review.productId.sku || ''
      } : null,
      order: review.orderId ? {
        orderNumber: review.orderId.orderNumber || ''
      } : null,
      createdAt: review.createdAt
    }));

    // Format farmer reviews
    const formattedFarmerReviews = farmerReviews.map((review: any): FormattedReview => ({
      _id: review._id,
      type: 'farmer',
      rating: review.rating,
      comment: review.comment || review.body,
      images: review.images || [],
      status: review.status,
      product: review.productId ? {
        name: review.productId.name || '',
        sku: review.productId.sku || ''
      } : null,
      order: review.orderId ? {
        orderNumber: review.orderId.orderNumber || ''
      } : null,
      createdAt: review.createdAt
    }));

    // Combine reviews
    const allReviews = [...formattedSupplierReviews, ...formattedFarmerReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply filters
    let filteredReviews = allReviews;
    
    if (sentiment) {
      filteredReviews = filteredReviews.filter(review => {
        if (sentiment === 'positive') return review.rating >= 4;
        if (sentiment === 'negative') return review.rating <= 2;
        return review.rating === 3;
      });
    }
    
    if (flagged) {
      filteredReviews = filteredReviews.filter(review => review.status === 'flagged');
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReviews = filteredReviews.filter(review => 
        (review.comment?.toLowerCase() || '').includes(searchLower) ||
        (review.product?.name?.toLowerCase() || '').includes(searchLower) ||
        (review.product?.sku?.toLowerCase() || '').includes(searchLower) ||
        (review.order?.orderNumber?.toLowerCase() || '').includes(searchLower)
      );
    }
    
    // Apply pagination
    const paginatedReviews = filteredReviews.slice(skip, skip + limit);
    const totalCount = filteredReviews.length;
    
    // Get sentiment statistics for both review types
    const [supplierSentimentStats, farmerSentimentStats] = await Promise.all([
      SupplierReviewModel.aggregate([
        { $match: { sellerId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            averageRating: { $avg: "$rating" },
            positive: {
              $sum: {
                $cond: [{ $gte: ["$rating", 4] }, 1, 0]
              }
            },
            neutral: {
              $sum: {
                $cond: [{ $eq: ["$rating", 3] }, 1, 0]
              }
            },
            negative: {
              $sum: {
                $cond: [{ $lte: ["$rating", 2] }, 1, 0]
              }
            }
          }
        }
      ]),
      MarketplaceReview.aggregate([
        { $match: { productId: { $in: productIds } } },
        {
          $group: {
            _id: 'neutral', // Farmer reviews don't have sentiment analysis yet
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    // Get flagged count (only supplier reviews can be flagged)
    const flaggedCount = await SupplierReviewModel.countDocuments({ sellerId: sellerId as any, isFlagged: true });
    
    // Combine sentiment stats
    const combinedSentimentStats = [
      ...supplierSentimentStats,
      ...farmerSentimentStats
    ].reduce((acc, stat) => {
      acc[stat._id] = (acc[stat._id] || 0) + stat.count;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({ 
      reviews: paginatedReviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        sentiment: combinedSentimentStats,
        flagged: flaggedCount,
        totalReviews: totalCount,
        supplierReviews: supplierReviews.length,
        farmerReviews: farmerReviews.length
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
