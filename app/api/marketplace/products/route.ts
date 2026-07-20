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
        sort = { rating: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { featured: -1, createdAt: -1 };
    }

    // Fetch products with seller information
    const products = await Product.find({
      ...query
    })
      .populate({
        path: 'sellerId',
        select: 'companyName verificationStatus',
        model: 'Seller'
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

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

      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        images,
        category: product.category,
        seller: {
          _id: sellerDoc?._id || product.sellerId,
          companyName: (sellerDoc?.companyName as string) || 'Unknown Seller'
        },
        stock: (product.stockQuantity as number) || 0,
        rating: 0,
        reviews: 0,
        createdAt: product.createdAt,
        tags: Array.isArray(product.tags) ? product.tags : [],
        status: (product.status as string) || 'draft'
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
