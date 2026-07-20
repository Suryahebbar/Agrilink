import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Seller } from '@/lib/models/supplier';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (request: NextRequest) => {
    try {
      const { id } = await params;
      await connectDB();
      
      // Try to find supplier in User model first (new registration system)
      let supplier = await User.findOne({ _id: id, role: 'supplier' })
        .select('-password -__v');

      // If not found in User model, try Seller model (legacy system)
      if (!supplier) {
        supplier = await Seller.findById(id)
          .select('-__v');
      }

      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }

      // Format response to match frontend expectations
      const responseData = {
        ...supplier.toObject(),
        // Ensure consistent field names for frontend
        name: supplier.name || supplier.companyName,
        companyName: supplier.companyName || supplier.name,
        phone: supplier.phone || '',
        address: supplier.address || '',
        isVerified: supplier.isVerified || supplier.verificationStatus === 'verified',
        verificationStatus: supplier.verificationStatus || 'pending'
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
  return withAdminAuth(async (request: NextRequest) => {
    try {
      await connectDB();
      
      const resolvedParams = await context.params;
      const id = resolvedParams.id;
      const body = await request.json();
      const { status } = body;
      
      // Try to find supplier in User model first (new registration system)
      let supplier = await User.findOne({ _id: id, role: 'supplier' });
      
      // If not found in User model, try Seller model (legacy system)
      if (!supplier) {
        supplier = await Seller.findById(id);
      }
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
      
      // Update status field based on model type
      if (supplier instanceof User) {
        supplier.verificationStatus = status;
      } else {
        supplier.verificationStatus = status;
      }
      
      await supplier.save();
      
      return NextResponse.json({ message: 'Supplier status updated successfully' });
      
    } catch (error) {
      console.error('Error updating supplier status:', error);
      return NextResponse.json(
        { error: 'Failed to update supplier status' },
        { status: 500 }
      );
    }
  })(request, context);
}
