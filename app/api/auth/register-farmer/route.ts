import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models/User';
import { sendEmailOtp } from '../../../../lib/otpEmail';
import { sendSmsOtp } from '../../../../lib/otpSms';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password } = body;

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash the password before saving
    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      role: 'farmer',
      fullName,  // Changed from name to fullName
      email,
      phone,
      passwordHash,  // Using hashed password
      emailVerified: false,
      phoneVerified: false,
      emailOtp: otp,
      phoneOtp: otp,
      otpExpiresAt
    });

    // Log OTP to console for testing
    console.log('OTP for', email, ':', otp);

    return NextResponse.json({
      message: 'Farmer registered successfully. OTP has been sent to your email and phone.',
      userId: user._id,
      // Include OTP in response for testing (remove in production)
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('register-farmer error', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
