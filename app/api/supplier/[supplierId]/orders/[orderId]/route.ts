import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, Product } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import mongoose from 'mongoose';

void Product;

interface UpdateData {
  updatedAt: Date;
  orderStatus?: string;
  paymentStatus?: string;
  shippingDetails?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  notes?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; orderId: string }> }
) {
  try {
    await connectDB();
    
    const { supplierId, orderId } = await params;
    
    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    const sellerId = auth.sellerId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const order = await Order.findOne({ _id: orderId, sellerId: sellerObjectId })
      .populate('items.productId', 'name sku images price')
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Unauthorized access to this supplier resource') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    console.error('Error fetching order:', error);

    const debug = process.env.NODE_ENV !== 'production';
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: 'Failed to fetch order', details: debug ? details : undefined },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; orderId: string }> }
) {
  try {
    await connectDB();
    
    const { supplierId, orderId } = await params;
    
    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    const sellerId = auth.sellerId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const body = await request.json();

    const updateData: UpdateData = {
      updatedAt: new Date()
    };

    if (typeof body.orderStatus === 'string') {
      updateData.orderStatus = body.orderStatus;
    }

    if (typeof body.paymentStatus === 'string') {
      updateData.paymentStatus = body.paymentStatus;
    }

    if (body.shippingDetails && typeof body.shippingDetails === 'object') {
      updateData.shippingDetails = {
        ...body.shippingDetails,
        estimatedDelivery: body.shippingDetails.estimatedDelivery ? new Date(body.shippingDetails.estimatedDelivery) : undefined,
        actualDelivery: body.shippingDetails.actualDelivery ? new Date(body.shippingDetails.actualDelivery) : undefined
      };
    }

    if (typeof body.notes === 'string') {
      updateData.notes = body.notes;
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, sellerId: sellerObjectId },
      updateData,
      { new: true, runValidators: true }
    ).populate('items.productId', 'name sku images price');

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Sync supplier-visible status into the customer order (FarmerOrder) when it exists.
    // This keeps customer and supplier views connected and consistent.
    try {
      const parentOrderNumber = typeof order.orderNumber === 'string' ? order.orderNumber.split('-')[0] : '';
      if (parentOrderNumber) {
        const statusMap: Record<string, string> = {
          new: 'confirmed',
          processing: 'processing',
          shipped: 'shipped',
          delivered: 'delivered',
          cancelled: 'cancelled'
        };

        const farmerUpdate: Record<string, unknown> = {};

        if (updateData.orderStatus) {
          farmerUpdate.status = statusMap[updateData.orderStatus] || updateData.orderStatus;
        }

        if (updateData.paymentStatus) {
          farmerUpdate.paymentStatus = updateData.paymentStatus;
        }

        if (updateData.shippingDetails) {
          farmerUpdate.tracking = {
            trackingNumber: updateData.shippingDetails.trackingNumber,
            carrier: updateData.shippingDetails.carrier,
            estimatedDelivery: updateData.shippingDetails.estimatedDelivery,
            actualDelivery: updateData.shippingDetails.actualDelivery,
            shippedAt: updateData.orderStatus === 'shipped' ? new Date() : undefined,
            deliveredAt: updateData.orderStatus === 'delivered' ? new Date() : undefined,
            currentLocation:
              updateData.orderStatus === 'delivered'
                ? 'Delivered'
                : updateData.orderStatus === 'shipped'
                  ? 'In Transit'
                  : 'Processing Center'
          };
        }

        if (Object.keys(farmerUpdate).length > 0) {
          await FarmerOrder.updateOne(
            { orderNumber: parentOrderNumber },
            { $set: farmerUpdate }
          );
        }
      }
    } catch (syncError) {
      console.error('Failed to sync supplier order update to FarmerOrder:', syncError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Unauthorized access to this supplier resource') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    console.error('Error updating order:', error);

    const debug = process.env.NODE_ENV !== 'production';
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: 'Failed to update order', details: debug ? details : undefined },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; orderId: string }> }
) {
  try {
    await connectDB();
    
    const { supplierId, orderId } = await params;
    
    // Authenticate supplier and validate supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    const sellerId = auth.sellerId;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Find and delete order
    const order = await Order.findOneAndDelete({ _id: orderId, sellerId: sellerObjectId });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Unauthorized access to this supplier resource') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    console.error('Error deleting order:', error);

    const debug = process.env.NODE_ENV !== 'production';
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: 'Failed to delete order', details: debug ? details : undefined },
      { status: 500 }
    );
  }
}
