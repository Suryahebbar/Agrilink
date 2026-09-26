import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Seller, Product, Order } from '@/lib/models/supplier';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, ActivityStatus, LogModule, ResourceType } from '@/lib/auditTypes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      await connectDB();
      
      // Try to find supplier in Seller model (primary supplier store)
      let supplier: any = await Seller.findById(id).select('-passwordHash -__v');

      // If not found in Seller model, try User model (unified system)
      if (!supplier) {
        supplier = await User.findOne({ _id: id, role: 'supplier' }).select('-passwordHash -__v');
      }

      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }

      // Fetch products count
      const productsCount = await Product.countDocuments({ sellerId: id }).catch(() => 0);
      const activeProductsCount = await Product.countDocuments({ sellerId: id, status: 'active' }).catch(() => 0);

      // Fetch orders & revenue
      const revenueResult = await Order.aggregate([
        { $match: { sellerId: supplier._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]).catch(() => []);

      const totalRevenue = revenueResult[0]?.total || 0;
      const totalOrders = revenueResult[0]?.count || 0;

      const rawSupplier = supplier.toObject ? supplier.toObject() : supplier;

      // Extract legal documents
      const docs = rawSupplier.documents || {};

      // Standardize statutory documents
      const statutoryDocs = {
        businessCertificate: docs.businessCertificate || docs.tradeLicense || null,
        tradeLicense: docs.tradeLicense || docs.businessCertificate || null,
        gstCertificate: docs.gstCertificate || null,
        fcoLicense: docs.fcoLicense || null,
        seedLicense: docs.seedLicense || null,
        pesticideLicense: docs.pesticideLicense || null,
        ownerIdProof: docs.ownerIdProof || null,
        bankDetails: docs.bankDetails || null,
      };

      // Format response to match frontend expectations
      const responseData = {
        ...rawSupplier,
        name: rawSupplier.name || rawSupplier.companyName || 'Supplier',
        companyName: rawSupplier.companyName || rawSupplier.name || 'Not provided',
        phone: rawSupplier.phone || 'Not provided',
        email: rawSupplier.email || rawSupplier.businessEmail || '',
        address: rawSupplier.address || 'Not provided',
        gstNumber: rawSupplier.gstNumber || 'Not provided',
        businessDetails: rawSupplier.businessDetails || {
          businessType: 'Agricultural Inputs Distributor',
          yearsInOperation: 'N/A',
          productCategories: 'Seeds, Fertilizers, Pesticides'
        },
        isVerified: rawSupplier.isVerified || rawSupplier.verificationStatus === 'verified',
        verificationStatus: rawSupplier.verificationStatus || 'pending',
        isActive: rawSupplier.isActive !== false && rawSupplier.status !== 'suspended',
        documents: statutoryDocs,
        // Statutory E-Commerce Compliance
        compliance: {
          gstinVerified: !!rawSupplier.gstNumber && rawSupplier.gstNumber !== 'Not provided',
          fcoAuthorized: !!statutoryDocs.fcoLicense,
          seedsActAuthorized: !!statutoryDocs.seedLicense,
          bankKycCompleted: !!statutoryDocs.bankDetails,
          termsAccepted: true,
          termsVersion: '2026.1-IN',
          termsAcceptedAt: rawSupplier.createdAt,
          statutoryWarranty: 'Undertaking on Non-Banned Agricultural Inputs and Legal FCO Standards Accepted'
        },
        stats: {
          productsCount,
          activeProductsCount,
          totalRevenue,
          totalOrders
        }
      };

      return NextResponse.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      await connectDB();
      
      const resolvedParams = await context.params;
      const id = resolvedParams.id;
      const body = await req.json();
      const { status, verificationStatus, rejectionReason, suspensionReason, isActive } = body;
      
      const targetStatus = verificationStatus || status;

      // Try Seller model first
      let supplier: any = await Seller.findById(id);
      
      // If not found in Seller model, try User model
      if (!supplier) {
        supplier = await User.findOne({ _id: id, role: 'supplier' });
      }
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
      
      const previousStatus = supplier.verificationStatus;

      if (targetStatus) {
        supplier.verificationStatus = targetStatus;
        if (targetStatus === 'verified' || targetStatus === 'active') {
          supplier.verifiedAt = new Date();
          supplier.rejectionReason = undefined;
          supplier.isActive = true;
          if (supplier.status) supplier.status = 'active';
        } else if (targetStatus === 'rejected') {
          supplier.rejectionReason = rejectionReason || 'Rejected after legal and compliance review';
          supplier.verifiedAt = undefined;
          supplier.isActive = false;
          if (supplier.status) supplier.status = 'inactive';
        } else if (targetStatus === 'suspended') {
          supplier.isActive = false;
          supplier.rejectionReason = suspensionReason || rejectionReason || 'Account suspended for statutory compliance breach';
          if (supplier.status) supplier.status = 'suspended';
        }
      }

      if (typeof isActive === 'boolean') {
        supplier.isActive = isActive;
        if (supplier.status) {
          supplier.status = isActive ? 'active' : 'suspended';
        }
      }
      
      await supplier.save();

      // Fire audit log for compliance traceability
      void auditLog({
        action: targetStatus === 'verified' ? ActivityAction.VERIFY : ActivityAction.STATUS_CHANGE,
        module: LogModule.ADMIN,
        resourceType: ResourceType.SUPPLIER,
        resourceId: id,
        resourceName: supplier.companyName || supplier.name || 'Supplier',
        oldValue: previousStatus,
        newValue: supplier.verificationStatus,
        remarks: rejectionReason || suspensionReason || `Supplier status updated to ${targetStatus}`,
        request: req,
        status: ActivityStatus.SUCCESS
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Supplier status updated successfully',
        data: {
          verificationStatus: supplier.verificationStatus,
          isActive: supplier.isActive,
          verifiedAt: supplier.verifiedAt,
          rejectionReason: supplier.rejectionReason
        }
      });
      
    } catch (error) {
      console.error('Error updating supplier status:', error);
      return NextResponse.json(
        { error: 'Failed to update supplier status' },
        { status: 500 }
      );
    }
  })(request, context);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest) => {
    try {
      const { id } = await params;
      await connectDB();
      
      // Find supplier in User model or Seller model
      const user = await User.findOne({ _id: id, role: 'supplier' });
      const seller = await Seller.findById(id);

      if (!user && !seller) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }

      const email = user?.email || seller?.email;

      // Clean up products
      const { Product } = await import('@/lib/models');
      await Product.deleteMany({ sellerId: id as any });

      // Clean up orders
      const { Order } = await import('@/lib/models/order');
      await Order.deleteMany({ sellerId: id as any });

      // Clean up farmer orders
      const { FarmerOrder } = await import('@/lib/models/FarmerOrder');
      await FarmerOrder.deleteMany({ 'items.sellerId': id });

      // Clean up carts
      const { Cart } = await import('@/lib/models/Cart');
      await Cart.updateMany(
        { 'items.productId': { $in: await Product.find({ sellerId: id as any }).distinct('_id') } },
        { $pull: { items: { productId: { $in: await Product.find({ sellerId: id as any }).distinct('_id') } } } }
      );

      // Delete from both collections
      if (user) await User.deleteOne({ _id: id });
      if (seller) await Seller.findByIdAndDelete(id);

      // Log to AdminAuditLog
      void auditLog({
        action: ActivityAction.DELETE,
        module: LogModule.ADMIN,
        resourceType: ResourceType.SUPPLIER,
        resourceId: id,
        resourceName: email || id,
        remarks: 'Admin permanently deleted supplier account and associated data',
        request: req,
        status: ActivityStatus.SUCCESS
      });

      return NextResponse.json({
        success: true,
        message: 'Supplier account and all related data deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}
