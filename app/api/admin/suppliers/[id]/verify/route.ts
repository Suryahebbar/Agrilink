import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (request: NextRequest) => {
    try {
      const { id } = await params;
      await connectDB();
      
      // Find supplier by ID from User model (new registration system)
      const supplier = await User.findOne({ _id: id, role: 'supplier' })
        .select('-passwordHash');
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
      
      // Update supplier verification status
      supplier.verificationStatus = 'verified';
      await supplier.save();
      
      return NextResponse.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      console.error('Error verifying supplier:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}
