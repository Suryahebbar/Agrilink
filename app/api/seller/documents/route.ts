import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/seller';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// GET /api/seller/documents - Get seller documents
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;
    
    // Get seller documents
    const seller = await Seller.findById(sellerId).select('documents');
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ documents: seller.documents || [] });
    
  } catch (error) {
    console.error('Error fetching seller documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/seller/documents - Upload seller documents
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;
    
    const body = await request.json();
    const { documentType, documentUrl, documentName } = body;
    
    if (!documentType || !documentUrl) {
      return NextResponse.json(
        { error: 'Document type and URL are required' },
        { status: 400 }
      );
    }
    
    // Update seller documents
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      {
        $push: {
          documents: {
            type: documentType,
            url: documentUrl,
            name: documentName || `${documentType}_${Date.now()}`,
            uploadedAt: new Date(),
            status: 'pending'
          }
        }
      },
      { new: true }
    );
    
    if (!updatedSeller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Document uploaded successfully',
      documents: updatedSeller.documents
    });
    
  } catch (error) {
    console.error('Error uploading seller documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
