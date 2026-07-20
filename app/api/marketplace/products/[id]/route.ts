import { NextRequest, NextResponse } from 'next/server';
import { Product as SupplierProduct, Seller } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    // Find product with seller information
    const product = await SupplierProduct.findById(id)
      .populate({
        path: 'sellerId',
        model: Seller,
        select: 'companyName email phone'
      })
      .lean();

    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('Product found:', product);
    console.log('SellerId:', product.sellerId);

    // Format product for marketplace
    const formattedProduct = {
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: Array.isArray(product.images) ? product.images.map((img: any) => ({
        url: img.url || '',
        alt: img.alt || product.name
      })) : [],
      category: product.category,
      seller: {
        _id: (product.sellerId as any)?._id || product.sellerId,
        companyName: (product.sellerId as any)?.companyName || 'Unknown Seller',
        email: (product.sellerId as any)?.email || 'Not available',
        phone: (product.sellerId as any)?.phone || 'Not available'
      },
      stock: product.stockQuantity || 0,
      rating: 0, // Not available in the supplier model
      reviews: 0, // Not available in the supplier model
      createdAt: product.createdAt,
      tags: Array.isArray(product.tags) ? product.tags : [],
      specifications: product.specifications || {},
      shippingInfo: product.dimensions ? {
        weight: product.dimensions.weight || 1,
        dimensions: {
          length: product.dimensions.length || 10,
          width: product.dimensions.width || 10,
          height: product.dimensions.height || 10
        }
      } : {
        weight: 1,
        dimensions: { length: 10, width: 10, height: 10 }
      },
      status: product.status || 'draft'
    };

    return NextResponse.json({
      product: formattedProduct
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
