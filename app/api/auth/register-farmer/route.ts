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
    const { fullName, dob, aadharNumber, phone, email: userEmail } = body;

    if (!fullName || !dob || !aadharNumber || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if the phone is already registered
    const existing = await User.findOne({ phone });
    if (existing) {
      return NextResponse.json(
        { message: 'Mobile number already registered' },
        { status: 400 }
      );
    }

    // Determine target email: user's input or fallback
    const targetEmail = userEmail ? userEmail.trim().toLowerCase() : `${phone}@agrilink.com`;

    // Check if target email is taken
    const existingEmail = await User.findOne({ email: targetEmail });
    if (existingEmail) {
      return NextResponse.json(
        { message: userEmail ? 'Email address already registered' : 'Fallback email identifier already in use' },
        { status: 400 }
      );
    }

    // Default password for the basic account: AgriLink@123
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
      phoneVerified: false,
      emailOtp: otp,
      phoneOtp: otp,
      otpExpiresAt
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
      nameVerificationStatus: 'pending'
    });

    // Dispatch OTP via SMS and Email
    let otpWarning: string | null = null;
    try {
      const smsResult = await sendSmsOtp(phone, otp, 'Aadhaar Verification');
      if (smsResult && !smsResult.success) {
        otpWarning = `SMS OTP status: ${smsResult.error}`;
      }

      // Send email OTP if user specified an email
      if (userEmail) {
        const emailResult = await sendEmailOtp(targetEmail, otp, 'Farmer Registration');
        if (emailResult && !emailResult.success) {
          const emailWarn = `Email OTP status: ${emailResult.error}`;
          otpWarning = otpWarning ? `${otpWarning} | ${emailWarn}` : emailWarn;
        }
      }
    } catch (err) {
      console.error('Failed to dispatch OTP notifications:', err);
      otpWarning = 'Network error occurred dispatching OTP notifications.';
    }

    // Log OTP to console for testing
    console.log('OTP for', phone, ':', otp);

    return NextResponse.json({
      message: 'Farmer registration initiated. OTP sent.',
      userId: user._id,
      otpWarning: otpWarning || undefined,
      // Include OTP in response for testing in dev
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
