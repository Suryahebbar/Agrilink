import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, signAuthToken } from '@/lib/auth';
import { Seller } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await connectDB();
    
    // Check if mock supplier already exists
    let mockSeller = await Seller.findOne({ email: 'test@supplier.com' });
    
    if (!mockSeller) {
      // Create a mock supplier if it doesn't exist
      const hashedPassword = await bcrypt.hash('test123', 12);
      mockSeller = new Seller({
        companyName: 'Test Supplier Company',
        email: 'test@supplier.com',
        phone: '9876543210',
        passwordHash: hashedPassword,
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        },
        verificationStatus: 'verified',
        isActive: true
      });
      
      await mockSeller.save();
      console.log('Mock supplier created:', mockSeller.email);
    }

    const sellerData = {
      id: mockSeller._id.toString(),
      _id: mockSeller._id.toString(),
      companyName: mockSeller.companyName,
      email: mockSeller.email,
      phone: mockSeller.phone,
      verificationStatus: mockSeller.verificationStatus,
      emailVerified: true,
      phoneVerified: true,
      isActive: mockSeller.isActive
    };

    // Create a real JWT token for the mock supplier
    const token = await signAuthToken({
      sub: sellerData.id,
      role: 'supplier',
      email: sellerData.email
    });

    const response = NextResponse.json({
      success: true,
      message: 'Supplier login simulated successfully',
      seller: sellerData
    });

    // Set the authentication cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production'
    });

    return response;

  } catch (error) {
    console.error('Error simulating login:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to simulate login'
    }, { status: 500 });
  }
}
