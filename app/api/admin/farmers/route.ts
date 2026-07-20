import { NextResponse, NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/withAdminAuth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'all' | 'verified' | 'pending';
  sortBy?: 'newest' | 'oldest' | 'name';
}

export async function GET(request: NextRequest) {
  return withAdminAuth(async (request: NextRequest) => {
    try {
      await connectDB();
      
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const params: QueryParams = Object.fromEntries(searchParams.entries());
      
      const page = parseInt(params.page || '1', 10);
      const limit = parseInt(params.limit || '10', 10);
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { role: 'farmer' };

      // Apply search filter
      if (params.search) {
        const searchRegex = new RegExp(params.search, 'i');
        query.$or = [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { phone: { $regex: searchRegex } },
          { address: { $regex: searchRegex } }
        ];
      }

      // Apply status filter
      if (params.status === 'verified') {
        query.isVerified = true;
      } else if (params.status === 'pending') {
        query.isVerified = false;
      }

      // Build sort
      let sort = {};
      switch (params.sortBy) {
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        case 'name':
          sort = { name: 1 };
          break;
        case 'newest':
        default:
          sort = { createdAt: -1 };
          break;
      }

      // Execute count and find queries in parallel
      const [total, farmers] = await Promise.all([
        User.countDocuments(query),
        User.find(query)
          .select('-password -__v')
          .sort(sort)
          .skip(skip)
          .limit(limit)
      ]);

      return NextResponse.json({
        success: true,
        data: farmers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching farmers:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
