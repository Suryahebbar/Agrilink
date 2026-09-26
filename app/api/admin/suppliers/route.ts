import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller, Order, Product } from '@/lib/models/supplier';
import { User } from '@/lib/models/User';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, ActivityStatus, LogModule, ResourceType } from '@/lib/auditTypes';

function extractDocStatus(doc: any): 'pending' | 'approved' | 'rejected' | 'uploaded' | 'missing' {
  if (!doc) return 'missing';
  if (typeof doc === 'string') return doc ? 'uploaded' : 'missing';
  if (doc.status === 'verified' || doc.status === 'approved') return 'approved';
  if (doc.status === 'rejected') return 'rejected';
  if (doc.status === 'pending') return 'pending';
  return doc.url ? 'uploaded' : 'missing';
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || searchParams.get('searchTerm') || '';
    const filter = searchParams.get('status') || searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Build query based on filters
    let supplierQuery: any = {};
    
    if (searchTerm) {
      supplierQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { companyName: { $regex: searchTerm, $options: 'i' } },
        { gstNumber: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (filter !== 'all') {
      supplierQuery.verificationStatus = filter;
    }
    
    // Get suppliers from Seller model (primary supplier store)
    const legacySuppliers = await Seller.find(supplierQuery)
      .select('name email phone companyName gstNumber businessDetails verificationStatus isActive createdAt updatedAt documents address settings')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get suppliers from User model (unified accounts)
    const userSuppliers = await User.find({ 
      role: 'supplier', 
      ...supplierQuery 
    })
      .select('email companyName businessEmail upiId phone emailVerified documentsUploaded verificationStatus verifiedAt rejectionReason status isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Prevent duplicate entries if a supplier has both records with the same email
    const seenEmails = new Set<string>();
    const allSuppliers: any[] = [];

    legacySuppliers.forEach((supplier: any) => {
      const emailLower = supplier.email?.toLowerCase();
      if (emailLower) seenEmails.add(emailLower);

      allSuppliers.push({
        ...supplier,
        source: 'seller',
        name: supplier.name || supplier.companyName,
        documentsUploaded: !!supplier.documents && Object.keys(supplier.documents).length > 0,
        documents: {
          businessLicense: extractDocStatus(supplier.documents?.businessCertificate || supplier.documents?.tradeLicense),
          gstCertificate: extractDocStatus(supplier.documents?.gstCertificate),
          fcoLicense: extractDocStatus(supplier.documents?.fcoLicense),
          seedLicense: extractDocStatus(supplier.documents?.seedLicense),
          pesticideLicense: extractDocStatus(supplier.documents?.pesticideLicense),
          ownerIdProof: extractDocStatus(supplier.documents?.ownerIdProof),
          bankDetails: extractDocStatus(supplier.documents?.bankDetails)
        },
        gstNumber: supplier.gstNumber || 'Not provided',
        status: supplier.isActive === false ? 'suspended' : (supplier.verificationStatus || 'pending')
      });
    });

    userSuppliers.forEach((supplier: any) => {
      const emailLower = supplier.email?.toLowerCase();
      if (emailLower && seenEmails.has(emailLower)) {
        return; // Skip duplicate
      }

      allSuppliers.push({
        ...supplier,
        source: 'user',
        name: supplier.companyName || supplier.email,
        documentsUploaded: supplier.documentsUploaded || false,
        documents: {
          businessLicense: supplier.documentsUploaded ? 'uploaded' : 'pending',
          gstCertificate: supplier.documentsUploaded ? 'uploaded' : 'pending',
          fcoLicense: 'pending',
          seedLicense: 'pending',
          pesticideLicense: 'pending',
          ownerIdProof: supplier.documentsUploaded ? 'uploaded' : 'pending',
          bankDetails: supplier.documentsUploaded ? 'uploaded' : 'pending'
        },
        gstNumber: 'Not provided',
        status: supplier.status === 'suspended' ? 'suspended' : (supplier.verificationStatus || 'pending')
      });
    });
    
    // Compute products count and total revenue for each supplier
    const suppliersWithStats = await Promise.all(
      allSuppliers.map(async (supplier: any) => {
        try {
          const productsCount = await Product.countDocuments({ 
            sellerId: supplier._id 
          });
          
          const revenueData = await Order.aggregate([
            { $match: { sellerId: supplier._id, paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]);
          
          return {
            ...supplier,
            productsCount: productsCount || 0,
            totalRevenue: revenueData[0]?.total || 0
          };
        } catch (err) {
          return {
            ...supplier,
            productsCount: 0,
            totalRevenue: 0
          };
        }
      })
    );

    // Sort by creation date descending
    suppliersWithStats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = suppliersWithStats.length;
    const startIndex = (page - 1) * limit;
    const paginatedSuppliers = suppliersWithStats.slice(startIndex, startIndex + limit);
    
    return NextResponse.json({ 
      success: true,
      data: paginatedSuppliers,
      suppliers: paginatedSuppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
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

    if (!supplierId || !action || !['verify', 'reject', 'suspend', 'activate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. supplierId and valid action (verify/reject/suspend/activate) required' },
        { status: 400 }
      );
    }

    // Check Seller first
    let supplier: any = await Seller.findById(supplierId);

    // Fallback to User
    if (!supplier) {
      supplier = await User.findById(supplierId);
    }

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const previousStatus = supplier.verificationStatus;

    if (action === 'verify' || action === 'activate') {
      supplier.verificationStatus = 'verified';
      supplier.verifiedAt = new Date();
      supplier.rejectionReason = undefined;
      supplier.isActive = true;
      if (supplier.status) supplier.status = 'active';
    } else if (action === 'reject') {
      supplier.verificationStatus = 'rejected';
      supplier.rejectionReason = reason || 'Rejected by platform admin after compliance review';
      supplier.verifiedAt = undefined;
      supplier.isActive = false;
      if (supplier.status) supplier.status = 'inactive';
    } else if (action === 'suspend') {
      supplier.verificationStatus = 'rejected';
      supplier.isActive = false;
      supplier.rejectionReason = reason || 'Account suspended for statutory/legal non-compliance';
      if (supplier.status) supplier.status = 'suspended';
    }

    await supplier.save();

    // Audit log this administrative legal decision
    void auditLog({
      action: action === 'verify' ? ActivityAction.VERIFY : ActivityAction.STATUS_CHANGE,
      module: LogModule.ADMIN,
      resourceType: ResourceType.SUPPLIER,
      resourceId: supplierId,
      resourceName: supplier.companyName || supplier.name || 'Supplier',
      oldValue: previousStatus,
      newValue: supplier.verificationStatus,
      remarks: reason || `Admin executed ${action} on supplier account`,
      request,
      status: ActivityStatus.SUCCESS
    });

    return NextResponse.json({
      success: true,
      message: `Supplier ${action}ed successfully`,
      verificationStatus: supplier.verificationStatus,
      verifiedAt: supplier.verifiedAt,
      rejectionReason: supplier.rejectionReason
    });
    
  } catch (error) {
    console.error('Error modifying supplier status:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier status' },
      { status: 500 }
    );
  }
}
