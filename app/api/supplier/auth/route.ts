import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Seller } from '@/lib/models/seller';
import { connectDB } from '@/lib/db';

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to validate required fields
function validateRequiredFields(data: any, requiredFields: string[]): string[] {
  const missing: string[] = [];
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
}

// POST /api/supplier/register - Register new supplier
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log(' Supplier registration request received:', {
      email: body.email,
      phone: body.phone,
      companyName: body.companyName,
      hasPassword: !!body.password
    });

    // Validate required fields
    const requiredFields = ['companyName', 'email', 'phone', 'password'];
    const missingFields = validateRequiredFields(body, requiredFields);
    
    if (missingFields.length > 0) {
      console.log(' Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const { companyName, email, phone, password, address, gstNumber } = body;

    // Check if seller already exists
    console.log(' Checking for existing seller with email:', email);
    const existingSeller = await Seller.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingSeller) {
      console.log(' Seller already exists:', {
        email: existingSeller.email,
        phone: existingSeller.phone,
        companyName: existingSeller.companyName
      });
      
      return NextResponse.json(
        { error: 'A seller with this email or phone number already exists' },
        { status: 409 }
      );
    }

    // Hash password
    console.log(' Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate OTP
    const emailOtp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(' Generated email OTP:', emailOtp, 'expires at:', otpExpiresAt);

    // Create new seller
    console.log(' Creating new seller...');
    const seller = new Seller({
      companyName,
      email,
      phone,
      passwordHash,
      address: address || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      gstNumber,
      emailOtp,
      otpExpiresAt,
      emailVerified: false,
      phoneVerified: false
    });

    await seller.save();
    console.log(' Seller created successfully:', {
      id: seller._id,
      companyName: seller.companyName,
      email: seller.email,
      verificationStatus: seller.verificationStatus
    });

    // TODO: Send OTP email
    console.log(' TODO: Send OTP email to:', email);

    // Return success response with OTP for development
    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for verification OTP.',
      seller: {
        id: seller._id,
        companyName: seller.companyName,
        email: seller.email,
        verificationStatus: seller.verificationStatus
      },
      // Include OTP in development for testing
      otp: process.env.NODE_ENV === 'development' ? emailOtp : undefined
    });

  } catch (error) {
    console.error(' Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}

// POST /api/supplier/verify-email - Verify email with OTP
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, otp } = body;

    console.log(' Email verification request:', { email, otp });

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      console.log(' Seller not found for email:', email);
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Check OTP
    if (!seller.emailOtp || seller.emailOtp !== otp) {
      console.log(' Invalid OTP:', { provided: otp, stored: seller.emailOtp });
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (!seller.otpExpiresAt || seller.otpExpiresAt < new Date()) {
      console.log(' OTP expired:', { expiresAt: seller.otpExpiresAt, now: new Date() });
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify email
    seller.emailVerified = true;
    seller.emailOtp = undefined;
    seller.otpExpiresAt = undefined;
    await seller.save();

    console.log(' Email verified successfully:', { email, id: seller._id });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      seller: {
        id: seller._id,
        companyName: seller.companyName,
        email: seller.email,
        emailVerified: seller.emailVerified,
        verificationStatus: seller.verificationStatus
      }
    });

  } catch (error) {
    console.error(' Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during email verification' },
      { status: 500 }
    );
  }
}

// POST /api/supplier/resend-otp - Resend OTP
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email } = body;

    console.log(' Resend OTP request:', { email });

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      console.log(' Seller not found for email:', email);
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Generate new OTP
    const emailOtp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update seller with new OTP
    seller.emailOtp = emailOtp;
    seller.otpExpiresAt = otpExpiresAt;
    await seller.save();

    console.log(' New OTP generated:', { email, otp: emailOtp, expiresAt: otpExpiresAt });

    // TODO: Send OTP email
    console.log(' TODO: Send OTP email to:', email);

    return NextResponse.json({
      success: true,
      message: 'New OTP sent to your email',
      // Include OTP in development for testing
      otp: process.env.NODE_ENV === 'development' ? emailOtp : undefined
    });

  } catch (error) {
    console.error(' Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error while resending OTP' },
      { status: 500 }
    );
  }
}

// POST /api/supplier/login - Supplier login
export async function POST_LOGIN(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;

    console.log(' Login request:', { email });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      console.log(' Seller not found for email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if seller is active
    if (!seller.isActive) {
      console.log(' Seller account is inactive:', { email, id: seller._id });
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, seller.passwordHash);
    if (!isValidPassword) {
      console.log(' Invalid password for email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log(' Login successful:', { email, id: seller._id });

    // TODO: Generate JWT token
    // TODO: Create session

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      seller: {
        id: seller._id,
        companyName: seller.companyName,
        email: seller.email,
        phone: seller.phone,
        verificationStatus: seller.verificationStatus,
        emailVerified: seller.emailVerified,
        phoneVerified: seller.phoneVerified
      }
    });

  } catch (error) {
    console.error(' Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
