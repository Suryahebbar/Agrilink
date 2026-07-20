import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    await connectDB();
    
    const resolvedParams = await context.params;
    const documentId = resolvedParams.documentId;
    const body = await request.json();
    const { action, reason } = body;
    
    // Parse document ID to get user and document type
    const [userId, documentType] = documentId.split('_');
    
    // Try supplier first
    const supplier = await Seller.findById(userId);
    if (supplier && supplier.documents) {
      const docData = (supplier.documents as any)[documentType];
      if (docData) {
        (supplier.documents as any)[documentType] = {
          ...docData,
          status: action === 'approve' ? 'approved' : 'rejected',
          rejectionReason: action === 'reject' ? reason : undefined
        };
        await supplier.save();
        return NextResponse.json({ message: 'Document status updated successfully' });
      }
    }
    
    // Try farmer
    const farmer = await FarmerProfile.findById(userId);
    if (farmer && farmer.documents) {
      const docData = (farmer.documents as any)[documentType];
      if (docData) {
        (farmer.documents as any)[documentType] = {
          ...docData,
          status: action === 'approve' ? 'approved' : 'rejected',
          rejectionReason: action === 'reject' ? reason : undefined
        };
        await farmer.save();
        return NextResponse.json({ message: 'Document status updated successfully' });
      }
    }
    
    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json(
      { error: 'Failed to update document status' },
      { status: 500 }
    );
  }
}
