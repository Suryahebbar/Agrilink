import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { Product } from '@/lib/models';
import { Types } from 'mongoose';

interface DeletionRequest {
  _id: Types.ObjectId;
  details?: {
    reason?: string;
    requestedBy?: string;
    requestedAt?: Date;
  };
}
import { Order } from '@/lib/models/order';
import { Cart } from '@/lib/models/Cart';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { AdminAuditLog } from '@/lib/models/AdminAuditLog';
import mongoose from 'mongoose';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = await params;
    
    // Verify admin token
    const token = request.headers.get('cookie')?.split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];

    if (!token) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    await connectDB();
    
    // Find supplier and their related data
    const supplier = await Seller.findById(id).session(session);
    if (!supplier) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Get supplier info for audit log
    const supplierInfo = {
      id: supplier._id,
      name: supplier.companyName || supplier.email,
      email: supplier.email,
      phone: supplier.phone
    };

    // Delete all products associated with this supplier
    const deletedProducts = await Product.deleteMany(
      { sellerId: supplier._id as any },
      { session }
    );

    // Delete all orders from this supplier
    const deletedOrders = await Order.deleteMany(
      { sellerId: supplier._id as any },
      { session }
    );

    // Delete all cart items containing this supplier's products
    const deletedCartItems = await Cart.updateMany(
      { 
        'items.productId': { 
          $in: await Product.find({ sellerId: supplier._id as any }).distinct('_id').session(session)
        }
      },
      { 
        $pull: { 
          items: { 
            productId: { 
              $in: await Product.find({ sellerId: supplier._id as any }).distinct('_id').session(session)
            }
          }
        }
      },
      { session }
    );

    // Delete all farmer orders containing this supplier's products
    const deletedFarmerOrders = await FarmerOrder.deleteMany(
      { 
        'items.sellerId': supplier._id
      },
      { session }
    );

    // Delete the supplier account
    await Seller.findByIdAndDelete(id, { session });

    // Log the deletion
    await AdminAuditLog.create([{
      action: 'delete_supplier',
      entityType: 'supplier',
      entityId: supplier._id,
      entityName: supplier.companyName || supplier.email,
      details: {
        deletedProducts: deletedProducts.deletedCount,
        deletedOrders: deletedOrders.deletedCount,
        deletedFarmerOrders: deletedFarmerOrders.deletedCount,
        performedBy: payload.email,
        deletedAt: new Date()
      },
      performedBy: payload.email,
      timestamp: new Date()
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: 'Supplier account and all related data deleted successfully',
      deletedData: {
        supplier: supplierInfo,
        products: deletedProducts.deletedCount,
        orders: deletedOrders.deletedCount,
        farmerOrders: deletedFarmerOrders.deletedCount,
        cartItems: 'cleared'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier account' },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify admin token
    const token = request.headers.get('cookie')?.split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const supplier = await Seller.findById(id);
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Get counts of related data
    const [productCount, orderCount, farmerOrderCount] = await Promise.all([
      Product.countDocuments({ sellerId: supplier._id as any }),
      Order.countDocuments({ sellerId: supplier._id as any }),
      FarmerOrder.countDocuments({ 'items.sellerId': supplier._id as any })
    ]);

    // Check for deletion requests
    const deletionRequests = await AdminAuditLog.find({
      action: 'delete_request',
      entityId: supplier._id,
      entityType: 'supplier'
    }).sort({ timestamp: -1 });

    return NextResponse.json({
      success: true,
      data: {
        supplier: {
          id: supplier._id,
          name: supplier.companyName || supplier.email,
          email: supplier.email,
          phone: supplier.phone,
          createdAt: supplier.createdAt,
          verificationStatus: supplier.verificationStatus
        },
        relatedData: {
          products: productCount,
          orders: orderCount,
          farmerOrders: farmerOrderCount
        },
        deletionRequests: deletionRequests.map((req: DeletionRequest) => ({
          id: req._id,
          reason: req.details?.reason,
          requestedBy: req.details?.requestedBy,
          requestedAt: req.details?.requestedAt,
          status: 'pending'
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching supplier deletion info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier information' },
      { status: 500 }
    );
  }
}
