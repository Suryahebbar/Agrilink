import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/models/supplier';
import { FarmerWishlist } from '@/lib/models/FarmerWishlist';
import { connectDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    await connectDB();

    // Get user's wishlist from database
    const wishlist = await FarmerWishlist.findOne({ userId });
    
    if (!wishlist || wishlist.items.length === 0) {
      return NextResponse.json({ products: [] });
    }
    
    // Extract product IDs from wishlist items
    const productIds = wishlist.items.map((item: any) => item.productId);
    
    // Fetch products by their IDs from supplier products
    const products = await Product.find({
      _id: { $in: productIds },
      status: 'active'
    })
    .populate('sellerId', 'companyName verificationStatus')
    .lean();

    // Format products for wishlist display
    const formattedProducts = products.map((product: any) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: undefined, // Can be added later
      discount: undefined, // Can be calculated later
      images: Array.isArray(product.images) ? product.images.map((img: any) => img.url || '') : [],
      seller: {
        _id: product.sellerId?._id || product.sellerId,
        companyName: (product.sellerId as any)?.companyName || 'Unknown Seller',
        verificationStatus: (product.sellerId as any)?.verificationStatus
      },
      stock: product.stockQuantity || 0,
      rating: 0, // Not available in supplier model yet
      reviewCount: 0, // Not available in supplier model yet
      category: product.category,
      createdAt: product.createdAt
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const body = await request.json();
    const { productId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
    
    await connectDB();

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Find or create user's wishlist
    let wishlist = await FarmerWishlist.findOne({ userId });
    
    if (!wishlist) {
      // Create new wishlist
      wishlist = new FarmerWishlist({
        userId,
        items: [{ productId, addedAt: new Date() }]
      });
    } else {
      // Check if product already exists in wishlist
      const existingItem = wishlist.items.find((item: any) => item.productId === productId);
      if (existingItem) {
        return NextResponse.json({ error: 'Product already in wishlist' }, { status: 400 });
      }
      
      // Add product to wishlist
      wishlist.items.push({ productId, addedAt: new Date() });
    }
    
    await wishlist.save();
    
    return NextResponse.json({ message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const body = await request.json();
    const { productId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
    
    await connectDB();

    // Find user's wishlist
    const wishlist = await FarmerWishlist.findOne({ userId });
    
    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }
    
    // Remove product from wishlist
    wishlist.items = wishlist.items.filter((item: any) => item.productId !== productId);
    
    // If wishlist is empty, delete the entire document
    if (wishlist.items.length === 0) {
      await FarmerWishlist.deleteOne({ userId });
    } else {
      await wishlist.save();
    }
    
    return NextResponse.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
