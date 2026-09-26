import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SponsoredAd } from '@/lib/models/SponsoredAd';
import { Product, Seller } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose from 'mongoose';

// Ensure models are registered
import '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');
    const sellerId = searchParams.get('sellerId');

    const query: Record<string, unknown> = { status: 'active' };

    if (placement && placement !== 'all') {
      query.campaignType = placement;
    }

    if (sellerId) {
      if (mongoose.Types.ObjectId.isValid(sellerId)) {
        query.sellerId = new mongoose.Types.ObjectId(sellerId);
        // Allow sellers to see paused and expired ads too
        delete query.status;
      }
    }

    const ads = await SponsoredAd.find(query)
      .populate('productId', 'name price images category stockQuantity')
      .populate('sellerId', 'companyName verificationStatus')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ ads });
  } catch (error) {
    console.error('Error fetching sponsored ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;

    const body = await request.json();
    const { productId, campaignType, title, tagline, imageUrl, budget } = body;

    if (!productId || !campaignType || !title) {
      return NextResponse.json(
        { error: 'Product ID, campaign type, and title are required' },
        { status: 400 }
      );
    }

    // Verify product belongs to this seller
    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    const adImage = imageUrl || (Array.isArray(product.images) && product.images[0]?.url) || '';

    const ad = await SponsoredAd.create({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      productId: product._id,
      campaignType,
      title: title.trim(),
      tagline: tagline ? tagline.trim() : undefined,
      imageUrl: adImage,
      targetUrl: `/dashboard/farmer/marketplace/products/${product._id}`,
      budget: typeof budget === 'number' ? budget : 500,
      spent: 0,
      impressions: 0,
      clicks: 0,
      status: 'active',
      startDate: new Date(),
    });

    return NextResponse.json({ message: 'Sponsored ad created successfully', ad }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    console.error('Error creating sponsored ad:', error);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { adId, action } = body;

    if (!adId || !action) {
      return NextResponse.json({ error: 'adId and action are required' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (action === 'impression') {
      update.$inc = { impressions: 1 };
    } else if (action === 'click') {
      update.$inc = { clicks: 1, spent: 5 }; // ₹5 cost per click
    }

    const ad = await SponsoredAd.findByIdAndUpdate(adId, update, { new: true });
    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error('Error updating ad metrics:', error);
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
  }
}
