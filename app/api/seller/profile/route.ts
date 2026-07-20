import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/seller';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// GET /api/seller/profile - Get seller profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;
    
    // Get seller profile
    const seller = await Seller.findById(sellerId).select('-passwordHash');
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ seller });
    
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/seller/profile - Update seller profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;
    
    const body = await request.json();
    const { companyName, email, phone, website, description } = body;
    
    // Update seller profile
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      {
        $set: {
          companyName,
          email,
          phone,
          website,
          description
        }
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!updatedSeller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      seller: updatedSeller
    });
    
  } catch (error) {
    console.error('Error updating seller profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
