import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '../../../../lib/db';
import User from '@/models/User';
import { User as LibUser } from '@/lib/models/User';
import { AUTH_COOKIE_NAME, signAuthToken } from '../../../../lib/auth';
import { Seller } from '@/lib/models/supplier';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Select both potential hashed password fields since some schemas use `password` (select: false) and others `passwordHash`
    const user: any = await User.findOne({ email }).select('+password +passwordHash');
    let legacyUser: any = null;
    if (!user) {
      legacyUser = await LibUser.findOne({ email });
    }
    // Always fetch raw to avoid schema drift issues
    const raw: any = await mongoose.connection.collection('users').findOne({ email });
    if (!user && !legacyUser && !raw) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    let hashed = raw?.passwordHash || raw?.password || user?.passwordHash || user?.password || legacyUser?.passwordHash;
    if (!hashed || typeof hashed !== 'string') {
      // Try legacy model even if primary user was found (different schema field)
      try {
        if (!legacyUser) legacyUser = await LibUser.findOne({ email });
        if (legacyUser?.passwordHash) hashed = legacyUser.passwordHash;
      } catch {}
    }
    if (!hashed || typeof hashed !== 'string') {
      // Try seller record (suppliers) for hash
      try {
        const sellerDoc: any = await Seller.findOne({ email }).select('passwordHash');
        if (sellerDoc?.passwordHash) hashed = sellerDoc.passwordHash;
      } catch {}
    }
    if (!hashed || typeof hashed !== 'string') {
      return NextResponse.json(
        { message: 'Account has no password set. Please reset your password.' },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(password, hashed);
    if (!ok) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const account: any = user || legacyUser || raw;
    const isEmailVerified = (account?.emailVerified ?? account?.isVerified ?? true) as boolean;
    const enforceVerification = process.env.ENFORCE_EMAIL_VERIFICATION === 'true';
    if (enforceVerification && !isEmailVerified) {
      return NextResponse.json(
        { message: 'Please verify your email via OTP before logging in.' },
        { status: 403 }
      );
    }

    let tokenSubject = account._id.toString();
    let tokenRole = account.role;
    let tokenEmail = account.email;

    if (account.role === 'supplier') {
      let seller = await Seller.findOne({ email: account.email });

      // If no Seller profile exists yet, auto-create one so supplier can log in
      if (!seller) {
        seller = await Seller.create({
          companyName: account.companyName || 'Supplier',
          email: account.email,
          phone: account.phone || 'N/A',
          passwordHash: hashed,
          address: {
            street: 'N/A',
            city: 'N/A',
            state: 'N/A',
            pincode: '000000',
            country: 'India',
          },
          verificationStatus: 'verified',
          isActive: true,
        });

        console.log('✅ Auto-created Seller profile during supplier login:', {
          userId: user._id,
          sellerId: seller._id,
          email: seller.email,
        });
      }

      if (!seller.isActive) {
        return NextResponse.json(
          { message: 'Your supplier account is inactive. Please contact support.' },
          { status: 403 }
        );
      }

      // Allow login for pending/verified suppliers.
      // Only block if verification has been explicitly rejected.
      if (seller.verificationStatus === 'rejected') {
        return NextResponse.json(
          { message: 'Your supplier verification was rejected. Please contact support.' },
          { status: 403 }
        );
      }

      tokenSubject = seller._id.toString();
      tokenRole = 'supplier';
      tokenEmail = seller.email;
      
      console.log('Setting supplier token:', {
        sellerId: seller._id.toString(),
        sellerEmail: seller.email,
        userId: user._id.toString()
      });
    }

    const token = await signAuthToken({
      sub: tokenSubject,
      role: tokenRole,
      email: tokenEmail,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: tokenSubject, // Use the same ID that's set in the token
        email: tokenEmail,
        role: tokenRole,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('login error', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
