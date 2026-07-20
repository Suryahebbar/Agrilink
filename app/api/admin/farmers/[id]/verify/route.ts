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
      
      const user = await User.findByIdAndUpdate(
        id,
        { isVerified: true },
        { new: true }
      ).select('-password');

      if (!user) {
        return NextResponse.json(
          { error: 'Farmer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error verifying farmer:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request, { params });
}
