import { NextResponse } from 'next/server';
import { Seller } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { AUTH_COOKIE_NAME, signAuthToken } from '@/lib/auth';

// POST /api/supplier/login - Login supplier
export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Supplier Login Request:', { email, hasPassword: !!password });

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      console.log('❌ Seller not found:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if account is verified
    if (seller.verificationStatus !== 'verified') {
      console.log('❌ Account not verified:', seller.verificationStatus);
      return NextResponse.json({ 
        error: 'Please verify your account first. Check your email for OTP.' 
      }, { status: 401 });
    }

    // Check if account is active
    if (!seller.isActive) {
      console.log('❌ Account is inactive');
      return NextResponse.json({ 
        error: 'Your account has been deactivated. Please contact support.' 
      }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, seller.passwordHash);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('✅ Login successful:', {
      id: seller._id,
      companyName: seller.companyName,
      email: seller.email,
      verificationStatus: seller.verificationStatus
    });

    // Remove sensitive data from response
    const { passwordHash, otp, otpExpiry, ...sellerResponse } = seller.toObject();

    const token = await signAuthToken({
      sub: seller._id.toString(),
      role: 'supplier',
      email: seller.email
    });

    const response = NextResponse.json({ 
      message: 'Login successful',
      seller: sellerResponse,
      token
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('❌ Error during login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

// POST /api/supplier/resend-otp - Resend OTP for verification
export async function PUT(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email } = body;

    console.log('📧 Resend OTP Request:', { email });

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      console.log('❌ Seller not found:', email);
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Check if already verified
    if (seller.verificationStatus === 'verified') {
      console.log('❌ Account already verified');
      return NextResponse.json({ 
        error: 'Account is already verified' 
      }, { status: 400 });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔢 New OTP generated:', otp);
    console.log('⏰ OTP Expires at:', otpExpiry);

    // Update seller with new OTP
    seller.otp = otp;
    seller.otpExpiry = otpExpiry;
    await seller.save();

    console.log('✅ OTP resent successfully:', {
      id: seller._id,
      email: seller.email
    });

    return NextResponse.json({ 
      message: 'OTP sent successfully. Please check your email.',
      otp // Include OTP in development only
    });
  } catch (error) {
    console.error('❌ Error resending OTP:', error);
    return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
  }
}
