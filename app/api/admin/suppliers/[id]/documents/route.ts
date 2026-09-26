import { NextResponse, NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { User } from '@/lib/models/User';
import DocumentModel from '@/lib/models/Document';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, ActivityStatus, LogModule, ResourceType } from '@/lib/auditTypes';

async function getAdminPayload(request: Request) {
  // 1. Check cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader.split('; ')
    .find(row => row.startsWith('admin-token='))
    ?.split('=')[1];

  if (token) {
    const payload = await verifyAdminToken(token);
    if (payload) return payload;
  }

  // 2. Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    const payload = await verifyAdminToken(bearerToken);
    if (payload) return payload;
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminPayload(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin credentials required' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    
    // Look up in Seller
    let supplier: any = await Seller.findById(id);
    let documentsObj: Record<string, any> = {};

    if (supplier) {
      documentsObj = supplier.documents || {};
    } else {
      // Look up in User
      supplier = await User.findOne({ _id: id, role: 'supplier' });
      if (supplier) {
        // Query Document model
        const docs = await DocumentModel.find({ owner: id }).lean();
        docs.forEach((d: any) => {
          documentsObj[d.type] = {
            url: d.path,
            status: d.metadata?.status || (supplier.verificationStatus === 'verified' ? 'verified' : 'pending'),
            rejectionReason: d.metadata?.rejectionReason
          };
        });
      }
    }

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: documentsObj,
        verificationStatus: supplier.verificationStatus || 'pending'
      }
    });

  } catch (error) {
    console.error('Error fetching supplier documents:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier documents' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminPayload(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin credentials required' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { documentType, status, rejectionReason } = body;
    
    if (!documentType || !status) {
      return NextResponse.json(
        { error: 'documentType and status are required' },
        { status: 400 }
      );
    }
    
    // Normalize status: 'approved' -> 'verified'
    const normalizedStatus = status === 'approved' ? 'verified' : status;

    if (!['verified', 'rejected', 'pending'].includes(normalizedStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be verified/approved, rejected, or pending' },
        { status: 400 }
      );
    }

    await connectDB();
    
    let supplier: any = await Seller.findById(id);
    let isSeller = true;

    if (!supplier) {
      supplier = await User.findOne({ _id: id, role: 'supplier' });
      isSeller = false;
    }

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    if (!supplier.documents) {
      supplier.documents = {};
    }

    const existingDoc = (supplier.documents as any)[documentType];
    let docUrl = '';

    if (typeof existingDoc === 'string') {
      docUrl = existingDoc;
    } else if (existingDoc && typeof existingDoc === 'object' && existingDoc.url) {
      docUrl = existingDoc.url;
    } else {
      // Default URL placeholder if document was flagged by type
      docUrl = `/api/supplier/documents/${id}/${documentType}`;
    }

    const updatedDocEntry = {
      url: docUrl,
      status: normalizedStatus,
      verifiedAt: normalizedStatus === 'verified' ? new Date() : undefined,
      verifiedBy: admin.email || 'admin@bpfis.com',
      rejectionReason: normalizedStatus === 'rejected' ? rejectionReason : undefined
    };

    supplier.documents[documentType] = updatedDocEntry;

    // Check if mandatory statutory documents are verified:
    // Mandatory: businessCertificate / tradeLicense, and if GST is provided, gstCertificate
    const docs = supplier.documents;
    const isTradeVerified = docs.businessCertificate?.status === 'verified' || docs.tradeLicense?.status === 'verified';
    const isGstVerified = !supplier.gstNumber || supplier.gstNumber === 'Not provided' || docs.gstCertificate?.status === 'verified';

    if (isTradeVerified && isGstVerified && normalizedStatus === 'verified') {
      // If core documents are verified, promote supplier to verified
      supplier.verificationStatus = 'verified';
      supplier.verifiedAt = new Date();
      supplier.isActive = true;
    } else if (normalizedStatus === 'rejected') {
      // If a statutory document is rejected, mark supplier verification as pending/rejected
      supplier.verificationStatus = 'pending';
    }

    supplier.markModified('documents');
    await supplier.save();

    // Audit log
    void auditLog({
      action: normalizedStatus === 'verified' ? ActivityAction.DOCUMENT_VERIFIED : ActivityAction.DOCUMENT_REJECTED,
      module: LogModule.DOCUMENT,
      resourceType: ResourceType.DOCUMENT,
      resourceId: id,
      resourceName: `${supplier.companyName || supplier.name || 'Supplier'} - ${documentType}`,
      remarks: `Admin statutory document verification: "${documentType}" marked as ${normalizedStatus}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
      request,
      status: ActivityStatus.SUCCESS
    });

    return NextResponse.json({
      success: true,
      message: `Document ${documentType} marked as ${normalizedStatus}`,
      data: {
        documents: supplier.documents,
        verificationStatus: supplier.verificationStatus
      }
    });

  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
  }
}
