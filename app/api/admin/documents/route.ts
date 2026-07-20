import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';

interface Document {
  _id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: string;
  rejectionReason?: string;
  submittedBy: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    
    // Build query based on filters
    let documentQuery: any = {};
    
    if (searchTerm) {
      documentQuery.$or = [
        { fileName: { $regex: searchTerm, $options: 'i' } },
        { documentType: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (filter !== 'all') {
      documentQuery.status = filter;
    }
    
    // Get documents from suppliers
    const suppliers = await Seller.find({});
    const supplierDocuments: Document[] = [];
    
    suppliers.forEach((supplier: any) => {
      if (supplier.documents) {
        Object.entries(supplier.documents).forEach(([docType, docData]: [string, any]) => {
          if (docData && docData.fileUrl) {
            supplierDocuments.push({
              _id: `${supplier._id}_${docType}`,
              documentType: docType,
              fileName: docData.fileName || `${docType}.${docData.fileUrl?.split('.').pop()}`,
              fileSize: docData.fileSize || 0,
              uploadedAt: docData.uploadedAt || new Date(),
              status: docData.status || 'pending',
              rejectionReason: docData.rejectionReason,
              submittedBy: supplier._id
            });
          }
        });
      }
    });
    
    // Get documents from farmers
    const farmers = await FarmerProfile.find({});
    const farmerDocuments: Document[] = [];
    
    farmers.forEach((farmer: any) => {
      if (farmer.documents) {
        Object.entries(farmer.documents).forEach(([docType, docData]: [string, any]) => {
          if (docData && docData.fileUrl) {
            farmerDocuments.push({
              _id: `${farmer._id}_${docType}`,
              documentType: docType,
              fileName: docData.fileName || `${docType}.${docData.fileUrl?.split('.').pop()}`,
              fileSize: docData.fileSize || 0,
              uploadedAt: docData.uploadedAt || new Date(),
              status: docData.status || 'pending',
              rejectionReason: docData.rejectionReason,
              submittedBy: farmer._id
            });
          }
        });
      }
    });
    
    // Combine all documents
    const allDocuments = [...supplierDocuments, ...farmerDocuments];
    
    // Apply filters
    let filteredDocuments = allDocuments;
    
    if (searchTerm) {
      filteredDocuments = filteredDocuments.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filter !== 'all') {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === filter);
    }

    // Add user details to each document
    const documentsWithUsers = await Promise.all(
      filteredDocuments.map(async (doc) => {
        let submittedBy;
        
        const supplier = await Seller.findById(doc.submittedBy);
        if (supplier) {
          submittedBy = {
            id: supplier._id,
            name: (supplier as any).name,
            email: (supplier as any).email,
            role: 'supplier' as const,
            companyName: (supplier as any).companyName
          };
        } else {
          const farmer = await FarmerProfile.findById(doc.submittedBy);
          if (farmer) {
            submittedBy = {
              id: farmer._id,
              name: (farmer as any).name,
              email: (farmer as any).email,
              role: 'farmer' as const,
              farmName: (farmer as any).farmName
            };
          }
        }
        
        return {
          ...doc,
          submittedBy
        };
      })
    );

    return NextResponse.json({ documents: documentsWithUsers });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
