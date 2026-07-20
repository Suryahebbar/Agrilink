import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceReview } from '@/lib/models/marketplace-review';
import { connectDB } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reviewId } = await params;
    
    await connectDB();

    const review = await MarketplaceReview.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    return NextResponse.json({ error: 'Failed to mark review as helpful' }, { status: 500 });
  }
}
