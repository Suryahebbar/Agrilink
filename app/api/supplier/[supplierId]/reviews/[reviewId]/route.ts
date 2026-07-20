import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// PUT /api/supplier/[supplierId]/reviews/[reviewId] - Update review (for seller response)
export async function PUT(
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
    const { response } = body;
    
    // Find and update review
    const review = await Review.findOneAndUpdate(
      { 
        _id: resolvedParams.reviewId, 
        sellerId: sellerId as any
      },
      {
        sellerResponse: response,
        respondedAt: new Date()
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
      message: 'Review response added successfully',
      review
    });
    
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    );
  }
}
