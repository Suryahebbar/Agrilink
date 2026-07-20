import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models/User';
import { sendEmailOtp } from '../../../../lib/otpEmail';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, businessEmail, upiId, password } = body;

    console.log('📝 Supplier Registration Request:', {
      companyName,
      businessEmail,
      upiId,
      hasPassword: !!password
    });

    if (!companyName || !businessEmail || !upiId || !password) {
      console.log('❌ Missing required fields:', { companyName, businessEmail, upiId, hasPassword: !!password });
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: businessEmail });
    if (existing) {
      console.log('❌ Email already registered:', businessEmail);
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const emailOtp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log('🔢 Generated OTP:', emailOtp);
    console.log('⏰ OTP Expires at:', otpExpiresAt);

    const user = await User.create({
      name: companyName, // Use companyName as the user's name
      role: 'supplier',
      companyName,
      email: businessEmail,
      businessEmail,
      upiId,
      passwordHash, // Use passwordHash to match User model
      emailVerified: false,
      phoneVerified: false,
      emailOtp,
      otpExpiresAt,
      // Supplier verification fields
      documentsUploaded: false, // Must upload documents first
      verificationStatus: 'pending', // Admin verification required
    });

    console.log('✅ User created successfully:', {
      id: user._id,
      email: user.email,
      companyName: user.companyName,
      role: user.role
    });

    void sendEmailOtp(user.email, emailOtp, 'supplier registration');

    console.log('📧 OTP sent to email:', user.email);

    return NextResponse.json({
      message: 'Supplier registered. Verify OTP to activate account.',
      userId: user._id,
      otp: emailOtp, // Include OTP for development testing
      email: businessEmail,
      companyName: companyName
    });
  } catch (error) {
    console.error('register-supplier error', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
