import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import { uploadFile } from '@/lib/cloudinary';

// GET /api/supplier/[supplierId]/documents - Get supplier documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Get the supplier ID from the URL
    const { supplierId } = await params;
    
    // Authenticate supplier and verify they have access to this supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    
    // Get supplier documents
    const seller = await Seller.findById(auth.sellerId).select('documents').lean();
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ documents: seller.documents || [] });
    
  } catch (error: any) {
    console.error('Error fetching supplier documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: error.status || 500 }
    );
  }
}

// POST /api/supplier/[supplierId]/documents - Upload supplier documents
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Get the supplier ID from the URL
    const { supplierId } = await params;
    
    // Authenticate supplier and verify they have access to this supplierId
    const auth = await requireAuth(request, { params: { supplierId } });
    
    const formData = await request.formData();
    
    if (!formData) {
      return NextResponse.json(
        { error: 'No files were uploaded' },
        { status: 400 }
      );
    }

    const documentTypes = ['businessCertificate', 'tradeLicense', 'ownerIdProof', 'gstCertificate'];
    const uploadResults: Record<string, string | null> = {};
    let successfulUploads = 0;
    let failedUploads = 0;
    const failedDetails: string[] = [];

    // Process each document type
    for (const docType of documentTypes) {
      const file = formData.get(docType) as File | null;
      
      if (file && file.size > 0) {
        try {
          // Convert file to buffer
          const buffer = Buffer.from(await file.arrayBuffer());
          
          // Upload to Cloudinary
          const uploadResult = await uploadFile(
            buffer,
            'supplier-documents',
            `${auth.sellerId}-${docType}-${Date.now()}`
          );

          if (uploadResult.success && uploadResult.data) {
            uploadResults[docType] = uploadResult.data.url;
            successfulUploads++;
          } else {
            throw new Error(uploadResult.error || 'Upload failed');
          }
        } catch (error) {
          console.error(`Error uploading ${docType}:`, error);
          uploadResults[docType] = null;
          failedUploads++;
          failedDetails.push(`Failed to upload ${docType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // If we have any successful uploads, update the seller's document references
    if (successfulUploads > 0) {
      await Seller.findByIdAndUpdate(
        auth.sellerId,
        { 
          $set: { 
            documents: {
              ...uploadResults,
              verificationStatus: 'pending',
              lastUpdated: new Date()
            } 
          } 
        },
        { new: true, upsert: true }
      );
    }

    return NextResponse.json({
      success: successfulUploads > 0,
      message: successfulUploads > 0 
        ? 'Documents uploaded successfully' 
        : 'No documents were uploaded',
      uploadSummary: {
        successful: successfulUploads,
        failed: failedUploads,
        failedDetails: failedDetails.length > 0 ? failedDetails : undefined
      }
    });

  } catch (error: any) {
    console.error('Error processing document upload:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process documents',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
