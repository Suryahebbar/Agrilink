import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Set the password
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    
    // Ensure verified flag is set since OTP has already been verified
    user.isVerified = true;
    user.phoneVerified = true;
    
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('set-password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
