import { NextResponse } from 'next/server';
import { extractTokenFromRequest, verifyAuthToken } from '@/lib/auth';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models/User';
import DocumentModel from '../../../../lib/models/Document';

// GET /api/supplier/documents - List all documents and verification status for the authenticated supplier
export async function GET(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifyAuthToken(token);
    if (!user || user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Access denied. Supplier role required.' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get supplier's verification status
    const supplierUser = await User.findById(user._id).select('documentsUploaded verificationStatus verifiedAt rejectionReason');
    
    // Get supplier's documents
    const documents = await DocumentModel.find({ owner: user._id })
      .select('filename type originalName createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      documents,
      verificationStatus: {
        documentsUploaded: supplierUser?.documentsUploaded || false,
        verificationStatus: supplierUser?.verificationStatus || 'pending',
        verifiedAt: supplierUser?.verifiedAt,
        rejectionReason: supplierUser?.rejectionReason
      }
    });
  } catch (error) {
    console.error('Failed to fetch supplier documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier documents' },
      { status: 500 }
    );
  }
}

// POST /api/supplier/documents - Mark documents as uploaded for verification
export async function POST(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifyAuthToken(token);
    if (!user || user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Access denied. Supplier role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: 'Document IDs array required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify all documents exist and belong to the user
    const documents = await DocumentModel.find({
      _id: { $in: documentIds },
      owner: user._id
    });

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { error: 'Some documents not found or do not belong to user' },
        { status: 400 }
      );
    }

    // Mark supplier as having uploaded documents
    const supplierUser = await User.findById(user._id);
    if (supplierUser) {
      supplierUser.documentsUploaded = true;
      supplierUser.verificationStatus = 'pending'; // Reset to pending if re-uploading
      await supplierUser.save();
    }

    console.log('📄 Supplier documents uploaded:', {
      userId: user._id,
      documentIds,
      documentsUploaded: true
    });

    return NextResponse.json({
      message: 'Documents uploaded successfully. Awaiting admin verification.',
      documentsUploaded: true,
      verificationStatus: 'pending'
    });
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}