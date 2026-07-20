import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceReview } from '@/lib/models/marketplace-review';
import { connectDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'approved';

    await connectDB();

    // Build query
    const query: any = { status };
    
    if (productId) {
      query.productId = productId;
    }
    
    if (userId) {
      query.userId = userId;
    }

    // Get reviews
    const reviews = await MarketplaceReview.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await MarketplaceReview.countDocuments(query);

    // Calculate rating statistics
    let ratingStats = null;
    if (productId) {
      const stats = await MarketplaceReview.aggregate([
        { $match: { productId, status: 'approved' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      if (stats.length > 0) {
        const distribution = [0, 0, 0, 0, 0];
        stats[0].ratingDistribution.forEach((rating: number) => {
          distribution[rating - 1]++;
        });

        ratingStats = {
          averageRating: Math.round(stats[0].averageRating * 10) / 10,
          totalReviews: stats[0].totalReviews,
          ratingDistribution: distribution
        };
      }
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      ratingStats
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const reviewData = await request.json();
    const { productId, orderId, userId, userName, userEmail, rating, title, comment, images } = reviewData;

    await connectDB();

    // Validate required fields
    if (!productId || !orderId || !userId || !userName || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already reviewed this product
    const existingReview = await MarketplaceReview.findOne({
      productId,
      userId,
      orderId
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    // Create new review
    const review = new MarketplaceReview({
      productId,
      orderId,
      userId,
      userName,
      userEmail,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      images: images || [],
      verified: true, // Mark as verified since it's tied to an order
      status: 'approved' // Auto-approve for now
    });

    await review.save();

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: {
        id: review._id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified,
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
