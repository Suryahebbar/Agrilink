import { NextRequest, NextResponse } from 'next/server';
import { Product as SupplierProduct } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    // Build query
    const query: any = { sellerId: id, status: 'active' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    // Build sort
    let sort: any = {};
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

    // Fetch products
    const products = await SupplierProduct.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Format products
    const formattedProducts = products.map((product: any) => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: Array.isArray(product.images) ? product.images.map((img: any) => ({
        url: img.url || '',
        alt: img.alt || product.name
      })) : [],
      category: product.category,
      stock: product.stockQuantity || 0,
      rating: 0, // Not available in the supplier model
      reviews: 0, // Not available in the supplier model
      createdAt: product.createdAt,
      tags: Array.isArray(product.tags) ? product.tags : [],
      status: product.status || 'draft'
    }));

    const total = await SupplierProduct.countDocuments(query);

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
    console.error('Error fetching seller products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
