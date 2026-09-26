import { NextResponse, NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/supplier';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, ActivityStatus, LogModule, ResourceType } from '@/lib/auditTypes';

async function getAdminToken(request: Request) {
  const cookieToken = request.headers.get('cookie')?.split('; ')
    .find(row => row.startsWith('admin-token='))
    ?.split('=')[1];
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const token = await getAdminToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    await connectDB();
    
    // Find products by seller ID
    const products = await Product.find({ sellerId: id as any })
      .select('name sku category price stockQuantity status description createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const token = await getAdminToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, status, complianceNote } = body;

    if (!productId || !status) {
      return NextResponse.json({ error: 'productId and status required' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findOne({ _id: productId, sellerId: id as any });
    if (!product) {
      return NextResponse.json({ error: 'Product not found for this supplier' }, { status: 404 });
    }

    const oldStatus = product.status;
    product.status = status;
    await product.save();

    void auditLog({
      action: ActivityAction.UPDATE,
      module: LogModule.ADMIN,
      resourceType: ResourceType.PRODUCT,
      resourceId: productId,
      resourceName: product.name,
      oldValue: oldStatus,
      newValue: status,
      remarks: complianceNote || `Admin updated product compliance status to ${status}`,
      request,
      status: ActivityStatus.SUCCESS
    });

    return NextResponse.json({
      success: true,
      message: `Product compliance status updated to ${status}`,
      data: product
    });
  } catch (error) {
    console.error('Error updating product compliance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
