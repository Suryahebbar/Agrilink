import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';

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

    return NextResponse.json({
      success: true,
      data: {
        documents: supplier.documents || {},
        verificationStatus: supplier.verificationStatus
      }
    });

  } catch (error) {
    console.error('Error fetching supplier documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier documents' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Document Verification API Called ===');
    
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { documentType, status, rejectionReason } = body;
    
    console.log('Document verification request:', { id, documentType, status, rejectionReason });
    
    // Validate required fields
    if (!documentType || !status) {
      console.error('Missing required fields:', { documentType, status });
      return NextResponse.json(
        { error: 'Document type and status are required', details: `documentType: ${documentType}, status: ${status}` },
        { status: 400 }
      );
    }
    
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      console.error('Invalid status:', status);
      return NextResponse.json(
        { error: 'Invalid status. Must be verified, rejected, or pending', details: `Received: ${status}` },
        { status: 400 }
      );
    }
    
    // Verify admin token
    const token = request.headers.get('cookie')?.split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];

    console.log('Token found:', !!token);

    if (!token) {
      console.error('No admin token found');
      return NextResponse.json(
        { error: 'Unauthorized - No admin token found' },
        { status: 401 }
      );
    }

    console.log('Verifying admin token...');
    const payload = await verifyAdminToken(token);
    console.log('Token verification result:', !!payload);
    
    if (!payload) {
      console.error('Invalid or expired token');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
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

    // Initialize documents object if it doesn't exist
    if (!supplier.documents) {
      supplier.documents = {};
    }

    // Update specific document status
    const existingDoc = (supplier.documents as any)[documentType];
    let docUrl = '';
    
    // Handle both string URLs and document objects
    if (typeof existingDoc === 'string') {
      docUrl = existingDoc;
    } else if (existingDoc && typeof existingDoc === 'object' && existingDoc.url) {
      docUrl = existingDoc.url;
    } else {
      console.error('Invalid document format for:', documentType, existingDoc);
      return NextResponse.json(
        { error: `Invalid document format for ${documentType}` },
        { status: 400 }
      );
    }
    
    console.log('Updating document:', { documentType, status, existingDoc, docUrl });
    
    // Create new document object with verification status
    const newDocumentObject = {
      url: docUrl,
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      verifiedAt: status === 'verified' ? new Date() : undefined,
      verifiedBy: status === 'verified' ? 'admin' : undefined
    };
    
    // Use direct MongoDB update to bypass Mongoose schema validation
    const updateResult = await Seller.updateOne(
      { _id: supplier._id },
      { 
        $set: { 
          [`documents.${documentType}`]: newDocumentObject
        }
      }
    );
    
    console.log('MongoDB update result:', updateResult);
    
    // Refresh the supplier document to get updated data
    const updatedSupplier = await Seller.findById(id).select('-passwordHash');
    
    console.log('Updated documents object after refresh:', updatedSupplier.documents);

    // Check if all documents are verified to update supplier status
    const allDocuments = Object.keys(updatedSupplier.documents);
    const allDocumentsVerified = allDocuments.every(key => 
      (updatedSupplier.documents as any)[key]?.status === 'verified'
    );
    const anyDocumentRejected = allDocuments.some(key => 
      (updatedSupplier.documents as any)[key]?.status === 'rejected'
    );

    console.log('Document status check:', { allDocuments, allDocumentsVerified, anyDocumentRejected });

    if (allDocumentsVerified) {
      updatedSupplier.verificationStatus = 'verified';
    } else if (anyDocumentRejected) {
      updatedSupplier.verificationStatus = 'rejected';
    } else {
      updatedSupplier.verificationStatus = 'pending';
    }

    console.log('Updating supplier verification status to:', updatedSupplier.verificationStatus);

    // Update supplier verification status
    await Seller.updateOne(
      { _id: supplier._id },
      { 
        $set: { 
          verificationStatus: updatedSupplier.verificationStatus
        }
      }
    );

    const responseData = {
      success: true,
      message: `Document ${documentType} ${status} successfully`,
      data: {
        documents: updatedSupplier.documents,
        verificationStatus: updatedSupplier.verificationStatus
      }
    };
    
    console.log('Returning success response:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('=== ERROR IN DOCUMENT VERIFICATION API ===');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    // Ensure we always return a proper JSON response
    let errorMessage = 'Failed to update document status';
    let errorDetails = String(error);
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || String(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.log('Returning error response:', { error: errorMessage, details: errorDetails });
    
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}
