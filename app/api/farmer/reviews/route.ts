import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import '@/lib/models'; // Ensure all models are registered
import { MarketplaceReview } from '@/lib/models/marketplace-review';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Types } from 'mongoose';

interface IMarketplaceReview {
  _id: Types.ObjectId;
  orderId: string | Types.ObjectId;
  productId: string | Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  helpful?: number;
  verified?: boolean;
  sellerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, orderId, productId, rating, title, comment, images, userName, userEmail } = body || {};

    if (!userId || !orderId || !productId || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await connectDB();

    // Verify the order belongs to the user and is delivered
    const order = await FarmerOrder.findOne({ 
      _id: orderId, 
      userId: userId,
      status: 'delivered' 
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not delivered' }, { status: 400 });
    }

    // Check if review already exists
    const existingReview = await MarketplaceReview.findOne({
      userId,
      orderId,
      productId
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Review already submitted for this order' }, { status: 400 });
    }

    // Create the review
    const review = await MarketplaceReview.create({
      userId,
      orderId,
      productId,
      userName: userName || 'Anonymous Farmer',
      userEmail: userEmail || 'anonymous@example.com',
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      images: images || [],
      verified: true, // Mark as verified since we confirmed the order
      status: 'approved', // Auto-approve since order is verified
      helpful: 0
    });

    console.log('Review created:', review._id);

    return NextResponse.json({
      message: 'Review submitted successfully',
      data: {
        reviewId: review._id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    console.error('POST /api/farmer/reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    let query: any = { userId };

    if (orderId) {
      query.orderId = orderId;
    }

    if (productId) {
      query.productId = productId;
    }

    const reviews = await MarketplaceReview.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      message: 'Reviews fetched successfully',
      data: {
        reviews: reviews.map((review: IMarketplaceReview) => ({
          id: review._id,
          orderId: review.orderId,
          productId: review.productId,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          images: review.images,
          helpful: review.helpful,
          verified: review.verified,
          sellerResponse: review.sellerResponse,
          status: review.status,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        })),
        total: reviews.length
      }
    });

  } catch (error) {
    console.error('GET /api/farmer/reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
