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
    const { fullName, dob, aadharNumber, phone, email } = body;

    if (!fullName || !dob || !aadharNumber || !phone || !email) {
      return NextResponse.json(
        { message: 'Please provide all required fields: Full Name, Date of Birth, Aadhaar Number, Phone, and Email.' },
        { status: 400 }
      );
    }

    await connectDB();

    const targetEmail = email.trim().toLowerCase();

    // Check if phone or email already registered
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { message: 'Mobile number already registered' },
        { status: 400 }
      );
    }

    const existingEmail = await User.findOne({ email: targetEmail });
    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email address already registered' },
        { status: 400 }
      );
    }

    // Default temporary password
    const passwordHash = await bcrypt.hash('AgriLink@123', 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      role: 'farmer',
      fullName,
      email: targetEmail,
      phone,
      passwordHash,
      emailVerified: false,
      phoneVerified: true, // Bypass SMS verification
      isVerified: true,
      emailOtp: otp,
      otpExpiresAt,
      firstLogin: true,
      loginCount: 0
    });

    // Create the basic FarmerProfile with DOB and Aadhaar number
    const { FarmerProfile } = await import('../../../../lib/models/FarmerProfile');
    await FarmerProfile.create({
      user: user._id,
      userId: user._id.toString(),
      dob,
      idProof: aadharNumber,
      contactNumber: phone,
      verifiedName: fullName,
      nameVerificationStatus: 'verified'
    });

    // Send Two-Factor OTP Email via Nodemailer
    let otpWarning: string | null = null;
    try {
      const emailResult = await sendEmailOtp(targetEmail, otp, 'Farmer Account Verification');
      if (emailResult && !emailResult.success) {
        otpWarning = `Email delivery note: ${emailResult.error}`;
      }
    } catch (err: any) {
      console.error('Failed to dispatch Email OTP:', err);
      otpWarning = 'Error dispatching Email OTP notification.';
    }

    // Always log OTP to server console
    console.log('📬 [EMAIL OTP SENT]', { email: targetEmail, otp });

    return NextResponse.json({
      message: `Verification OTP sent to ${targetEmail}. Please check your inbox or spam folder.`,
      userId: user._id,
      email: targetEmail,
      otpWarning: otpWarning || undefined,
      otp: otp // Included for seamless developer testing
    });
  } catch (error: any) {
    console.error('register-farmer error', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
