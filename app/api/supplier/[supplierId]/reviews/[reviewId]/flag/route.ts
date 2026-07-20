import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// POST /api/supplier/[supplierId]/reviews/[reviewId]/flag - Flag/unflag review
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ supplierId: string; reviewId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await context.params;
    
    // Authenticate supplier
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    const body = await request.json();
    const { isFlagged, flagReason } = body;
    
    // Find and update review
    const review = await Review.findOneAndUpdate(
      { 
        _id: resolvedParams.reviewId, 
        sellerId: sellerId as any
      },
      {
        isFlagged,
        flagReason: isFlagged ? flagReason : undefined,
        flaggedAt: isFlagged ? new Date() : undefined
      },
      { new: true }
    ).lean();
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: `Review ${isFlagged ? 'flagged' : 'unflagged'} successfully`,
      review
    });
    
  } catch (error: any) {
    console.error('Error flagging review:', error);
    return NextResponse.json(
      { error: 'Failed to flag review' },
      { status: 500 }
    );
  }
}
