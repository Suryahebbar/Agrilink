import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { Order } from '@/lib/models/supplier';
import { User } from '@/lib/models/User';
import { Types } from 'mongoose';

interface SupplierType {
  _id: Types.ObjectId;
  name?: string;
  email: string;
  phone?: string;
  companyName?: string;
  gstNumber?: string;
  verificationStatus?: string;
  createdAt: Date;
  documents?: any[];
  // Add other fields as needed
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const filter = searchParams.get('status') || 'all';
    
    // Build query based on filters
    let supplierQuery: any = {};
    
    if (searchTerm) {
      supplierQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { companyName: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (filter !== 'all') {
      supplierQuery.verificationStatus = filter;
    }
    
    // Get suppliers from Seller model (legacy)
    const legacySuppliers = await Seller.find(supplierQuery)
      .select('name email phone companyName gstNumber verificationStatus createdAt documents')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get suppliers from User model (new registration system)
    const userSuppliers = await User.find({ 
      role: 'supplier', 
      ...supplierQuery 
    })
      .select('email companyName businessEmail upiId emailVerified documentsUploaded verificationStatus verifiedAt rejectionReason createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    // Combine and format all suppliers
    const allSuppliers = [
      ...legacySuppliers.map((supplier: any) => ({
        ...supplier,
        source: 'legacy',
        documentsUploaded: true, // Legacy suppliers assumed to have documents
        documents: {
          businessLicense: supplier.documents?.businessLicense?.status || 'pending',
          gstCertificate: supplier.documents?.gstCertificate?.status || 'pending',
          bankDetails: supplier.documents?.bankDetails?.status || 'pending'
        }
      })),
      ...userSuppliers.map((supplier: any) => ({
        ...supplier,
        source: 'user',
        name: supplier.companyName, // Use companyName as name for consistency
        documents: {
          businessLicense: supplier.documentsUploaded ? 'uploaded' : 'pending',
          gstCertificate: supplier.documentsUploaded ? 'uploaded' : 'pending',
          bankDetails: supplier.documentsUploaded ? 'uploaded' : 'pending'
        }
      }))
    ];
    
    // Get products count and revenue for each supplier
    const suppliersWithStats = await Promise.all(
      allSuppliers.map(async (supplier: any) => {
        const productsCount = await require('@/lib/models/supplier').Product.countDocuments({ 
          sellerId: supplier._id 
        });
        
        const revenueData = await Order.aggregate([
          { $match: { sellerId: supplier._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        return {
          ...supplier,
          productsCount,
          totalRevenue: revenueData[0]?.total || 0
        };
      })
    );

    // Sort by creation date
    suppliersWithStats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({ 
      data: suppliersWithStats,
      pagination: {
        page: 1,
        limit: suppliersWithStats.length,
        total: suppliersWithStats.length,
        totalPages: 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST /api/admin/suppliers - Verify or reject a supplier
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { supplierId, action, reason } = body;

    if (!supplierId || !action || !['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. SupplierId and action (verify/reject) required' },
        { status: 400 }
      );
    }

    // Find supplier in User model (new registration system)
    let supplier = await User.findById(supplierId);
    
    // If not found in User model, try Seller model (legacy system)
    if (!supplier) {
      supplier = await Seller.findById(supplierId);
    }

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if supplier has uploaded documents (for User model)
    if (supplier instanceof User && !supplier.documentsUploaded) {
      return NextResponse.json(
        { error: 'Supplier has not uploaded documents yet' },
        { status: 400 }
      );
    }

    if (action === 'verify') {
      supplier.verificationStatus = 'verified';
      supplier.verifiedAt = new Date();
      supplier.rejectionReason = undefined;
    } else if (action === 'reject') {
      supplier.verificationStatus = 'rejected';
      supplier.rejectionReason = reason || 'Rejected by admin';
      supplier.verifiedAt = undefined;
    }

    await supplier.save();

    console.log(`👤 Supplier ${action}ed:`, {
      supplierId,
      companyName: supplier.companyName,
      verificationStatus: supplier.verificationStatus
    });

    return NextResponse.json({
      message: `Supplier ${action}ed successfully`,
      verificationStatus: supplier.verificationStatus,
      verifiedAt: supplier.verifiedAt,
      rejectionReason: supplier.rejectionReason
    });
    
  } catch (error) {
    console.error('Error verifying supplier:', error);
    return NextResponse.json(
      { error: 'Failed to verify supplier' },
      { status: 500 }
    );
  }
}
