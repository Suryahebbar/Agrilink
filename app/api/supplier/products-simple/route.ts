import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

// Simple product schema without getters
interface SimpleProduct {
  sellerId: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  status: string;
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const sellerId = request.headers.get('x-seller-id');
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 401 });
    }

    if (sellerId === 'temp-seller-id') {
      return NextResponse.json(
        { error: 'Cannot create products with temporary seller ID' },
        { status: 400 }
      );
    }

    // For testing, allow mock seller IDs
    if (sellerId !== '65a1b2c3d4e5f6789012345') {
      return NextResponse.json({ error: 'Invalid seller ID for testing' }, { status: 404 });
    }

    // Handle FormData
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const price = parseFloat(formData.get('price') as string);
    const stockQuantity = parseInt(formData.get('stockQuantity') as string);

    // Validate required fields
    if (!name || !sku || !description || !category || !price || stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-]+|[-]+$/g, '');

    // Create simple product object (without saving to database for now)
    const product: SimpleProduct = {
      sellerId,
      name,
      sku,
      slug,
      description,
      category,
      price,
      stockQuantity,
      status: 'draft',
      createdAt: new Date()
    };

    console.log('✅ Simple product created:', product);

    return NextResponse.json({
      message: 'Product created successfully (simple test)',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating simple product:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
