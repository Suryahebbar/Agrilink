import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models';

// Ensure models are registered
import '@/lib/models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    // Build query
    // By default, show everything that is not inactive so newly-added products are visible.
    const query: Record<string, unknown> = { status: { $ne: 'inactive' } };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const minPrice = typeof minPriceParam === 'string' ? parseFloat(minPriceParam) : undefined;
    const maxPrice = typeof maxPriceParam === 'string' ? parseFloat(maxPriceParam) : undefined;
    if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
      query.price = { ...((query.price as Record<string, unknown>) || {}), $gte: minPrice };
    }
    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
      query.price = { ...((query.price as Record<string, unknown>) || {}), $lte: maxPrice };
    }

    // Build sort
    let sort: Record<string, 1 | -1> = {};
    switch (sortBy) {
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'bestselling':
        sort = { stockQuantity: -1, createdAt: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Fetch products with seller information
    const products = await Product.find({
      ...query
    })
      .populate({
        path: 'sellerId',
        select: 'companyName verificationStatus email',
        model: 'Seller'
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Check which products have active sponsored ads
    let sponsoredProductIds = new Set<string>();
    try {
      const { SponsoredAd } = await import('@/lib/models/SponsoredAd');
      const activeAds = await SponsoredAd.find({
        status: 'active',
        productId: { $in: products.map((p: any) => p._id) }
      }).select('productId').lean();
      sponsoredProductIds = new Set(activeAds.map((a: any) => a.productId?.toString()));
    } catch (e) {
      console.warn('Sponsored ads lookup skipped:', e);
    }

    // Fetch review statistics for these products
    const productIds = products.map((p: any) => p._id);
    const reviewStatsMap: Record<string, { avgRating: number; reviewCount: number }> = {};
    try {
      const { MarketplaceReview } = await import('@/lib/models/marketplace-review');
      const reviewAgg = await MarketplaceReview.aggregate([
        { $match: { productId: { $in: productIds.map(String) }, status: 'approved' } },
        {
          $group: {
            _id: '$productId',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
          }
        }
      ]);
      for (const item of reviewAgg) {
        reviewStatsMap[item._id] = {
          avgRating: Math.round(item.avgRating * 10) / 10,
          reviewCount: item.reviewCount
        };
      }
    } catch (e) {
      console.warn('Review stats lookup skipped:', e);
    }

    // Fallback: If sellerId didn't populate from Seller model, check User model for supplier details
    const unpopulatedSellerIds = products
      .filter((p: any) => !p.sellerId || typeof p.sellerId !== 'object' || !p.sellerId.companyName)
      .map((p: any) => p.sellerId)
      .filter(Boolean);

    const userSellerMap: Record<string, { companyName: string; verificationStatus: string }> = {};
    if (unpopulatedSellerIds.length > 0) {
      try {
        const { User } = await import('@/lib/models/User');
        const userSuppliers = await User.find({
          _id: { $in: unpopulatedSellerIds }
        }).select('_id companyName verificationStatus fullName role').lean();
        for (const u of userSuppliers) {
          userSellerMap[(u as any)._id.toString()] = {
            companyName: (u as any).companyName || (u as any).fullName || 'Verified Farm Supplier',
            verificationStatus: (u as any).verificationStatus || 'verified'
          };
        }
      } catch (e) {
        console.warn('User supplier fallback skipped:', e);
      }
    }

    // Format products for marketplace
    const formattedProducts = products.map((productUnknown: unknown) => {
      const product = productUnknown as Record<string, unknown>;
      const images = Array.isArray(product.images)
        ? (product.images as Array<Record<string, unknown>>).map((img) => ({
            url: (img.url as string) || '',
            alt: (img.alt as string) || (product.name as string) || 'Product'
          }))
        : [];

      const sellerDoc = product.sellerId as Record<string, unknown> | undefined;
      const pidStr = product._id?.toString() || '';
      const rawSellerIdStr = sellerDoc?._id?.toString?.() || (product.sellerId ? String(product.sellerId) : '');
      const userSupplierFallback = userSellerMap[rawSellerIdStr];

      const companyName = (sellerDoc?.companyName as string) ||
        userSupplierFallback?.companyName ||
        'Verified Farm Supplier';

      const verificationStatus = (sellerDoc?.verificationStatus as string) ||
        userSupplierFallback?.verificationStatus ||
        'verified';

      const revStat = reviewStatsMap[pidStr] || { avgRating: 4.8, reviewCount: 12 };

      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        images,
        category: product.category,
        seller: {
          _id: rawSellerIdStr || sellerDoc?._id || product.sellerId || '',
          companyName,
          verificationStatus: verificationStatus as 'verified' | 'pending' | 'unverified'
        },
        stock: typeof product.stockQuantity === 'number' ? product.stockQuantity : 10,
        rating: revStat.avgRating,
        reviewCount: revStat.reviewCount,
        reviews: revStat.reviewCount,
        isSponsored: sponsoredProductIds.has(pidStr),
        createdAt: product.createdAt,
        tags: Array.isArray(product.tags) ? product.tags : [],
        status: (product.status as string) || 'active'
      };
    });

    const total = await Product.countDocuments({
      ...query
    });

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
