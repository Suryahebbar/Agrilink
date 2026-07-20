import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { uploadFile } from '@/lib/cloudinary';

// GET /api/supplier/[supplierId]/products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { sellerId } = await requireAuth(request, { params: resolvedParams });
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    
    // Convert sellerId string to ObjectId for query
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const query: any = { sellerId: sellerObjectId as any };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    console.log(`[Products API] Found ${products.length} products for seller ${sellerId} (total: ${total})`);
    
    return NextResponse.json({
      products: products || [],
      pagination: {
        total: total || 0,
        page,
        pages: Math.ceil((total || 0) / limit),
        limit
      }
    });
    
  } catch (error: any) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error', details: error.stack },
      { status: error.status || 500 }
    );
  }
}

// POST /api/supplier/[supplierId]/products
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { sellerId } = await requireAuth(request, { params: resolvedParams });
    
    // Convert sellerId string to ObjectId
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    
    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get('content-type') || '';
    let productData: any;
    let imageFiles: File[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract form fields
      productData = {
        name: formData.get('name') as string,
        sku: (formData.get('sku') as string)?.toUpperCase().trim(),
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string || '0'),
        stockQuantity: parseInt(formData.get('stockQuantity') as string || '0'),
        reorderThreshold: parseInt(formData.get('reorderThreshold') as string || '5'),
        status: 'draft' // Default to draft, can be activated later
      };
      
      // Parse tags
      const tagsStr = formData.get('tags') as string;
      if (tagsStr) {
        try {
          productData.tags = JSON.parse(tagsStr);
        } catch {
          productData.tags = tagsStr.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        }
      } else {
        productData.tags = [];
      }
      
      // Parse dimensions
      const dimensionsStr = formData.get('dimensions') as string;
      if (dimensionsStr) {
        try {
          const dims = JSON.parse(dimensionsStr);
          productData.dimensions = {
            length: dims.length ? parseFloat(dims.length) : undefined,
            width: dims.width ? parseFloat(dims.width) : undefined,
            height: dims.height ? parseFloat(dims.height) : undefined,
            weight: dims.weight ? parseFloat(dims.weight) : undefined
          };
        } catch {
          productData.dimensions = {};
        }
      } else {
        productData.dimensions = {};
      }
      
      // Extract image files
      const images = formData.getAll('images') as File[];
      imageFiles = images.filter(file => file && file.size > 0);
      
    } else {
      // Handle JSON request (backwards compatibility)
      productData = await request.json();
    }
    
    // Upload images to Cloudinary
    const uploadedImages: { url: string; alt: string; position: number }[] = [];
    if (imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadFile(buffer, 'products', `${productData.sku}-${i}`);
        
        if (uploadResult.success && uploadResult.data) {
          uploadedImages.push({
            url: uploadResult.data.url,
            alt: productData.name || `Product image ${i + 1}`,
            position: i
          });
        }
      }
    }
    
    // Validate required fields
    if (!productData.name || !productData.sku || !productData.category || !productData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, category, and description are required' },
        { status: 400 }
      );
    }

    // Ensure images array is not empty (at least one image required)
    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: 'At least one product image is required' },
        { status: 400 }
      );
    }

    // Create product with uploaded images
    const product = new Product({
      name: productData.name,
      sku: productData.sku || `SKU-${Date.now()}`,
      category: productData.category,
      description: productData.description,
      price: productData.price || 0,
      stockQuantity: productData.stockQuantity || 0,
      reorderThreshold: productData.reorderThreshold || 5,
      sellerId: sellerObjectId as any,
      images: uploadedImages,
      status: productData.status || 'draft',
      tags: productData.tags || [],
      specifications: productData.specifications || {},
      dimensions: productData.dimensions || {}
    });
    
    await product.save();
    
    return NextResponse.json(product, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    );
  }
}
