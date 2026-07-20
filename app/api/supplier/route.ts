import { NextResponse } from 'next/server';
import { Seller } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';
import { authenticateSupplier } from '@/lib/supplier-auth-middleware';
import bcrypt from 'bcryptjs';

// GET /api/supplier - Get current supplier profile
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Use cookie-based authentication
    const auth = await authenticateSupplier(request as any);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Looking for supplier with ID:', auth.sellerId);
    
    // Try to find the supplier by ID first
    let supplier = await Seller.findById(auth.sellerId).select('-passwordHash') as any;
    
    // If not found by ID, try to find by email (fallback)
    if (!supplier && auth.email) {
      console.log('Supplier not found by ID, trying email:', auth.email);
      supplier = await Seller.findOne({ email: auth.email }).select('-passwordHash') as any;
    }
    
    if (!supplier) {
      console.log('Supplier not found, checking all suppliers...');
      const allSuppliers = await Seller.find({}).select('_id email isActive');
      console.log('All suppliers in database:', allSuppliers.map((s: any) => ({ 
        id: s._id, 
        email: s.email, 
        active: s.isActive 
      })));
      
      return NextResponse.json({ 
        supplier: null,
        needsSetup: true,
        message: 'Profile not found - setup required'
      }, { status: 404 });
    }

    console.log('Supplier found:', supplier.email);
    return NextResponse.json({ supplier, needsSetup: false });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

// POST /api/supplier/register - Register new supplier
export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { companyName, email, phone, password, address, gstNumber } = body;

    console.log('📝 Supplier Registration Request:', {
      companyName,
      email,
      phone,
      hasPassword: !!password,
      address,
      gstNumber
    });

    // Validate required fields
    if (!companyName || !email || !phone || !password || !address) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: companyName, email, phone, password, address' 
      }, { status: 400 });
    }

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      console.log('❌ Seller already exists:', email);
      return NextResponse.json({ error: 'Seller with this email already exists' }, { status: 409 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔢 Generated OTP:', otp);
    console.log('⏰ OTP Expires at:', otpExpiry);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new seller with OTP
    const seller = new Seller({
      companyName,
      email,
      phone,
      passwordHash: hashedPassword,
      address,
      gstNumber,
      verificationStatus: 'pending',
      otp,
      otpExpiry
    });

    await seller.save();

    console.log('✅ Seller created successfully:', {
      id: seller._id,
      companyName: seller.companyName,
      email: seller.email,
      verificationStatus: seller.verificationStatus
    });

    // Remove sensitive data from response
    const { passwordHash, otp: sellerOtp, ...sellerResponse } = seller.toObject();

    return NextResponse.json({ 
      message: 'Supplier registration successful. Please check your email for OTP verification.',
      seller: sellerResponse,
      otp: sellerOtp // Include OTP in development only
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier account' }, { status: 500 });
  }
}

// POST /api/supplier/verify-otp - Verify OTP and activate account
export async function PUT(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, otp } = body;

    console.log('🔍 OTP Verification Request:', { email, otp });

    if (!email || !otp) {
      return NextResponse.json({ 
        error: 'Email and OTP are required' 
      }, { status: 400 });
    }

    // Find seller with valid OTP
    const seller = await Seller.findOne({ 
      email, 
      otp, 
      otpExpiry: { $gt: new Date() } 
    });

    if (!seller) {
      console.log('❌ Invalid or expired OTP');
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Clear OTP and update verification status
    seller.otp = undefined;
    seller.otpExpiry = undefined;
    seller.verificationStatus = 'verified';
    await seller.save();

    console.log('✅ OTP verified successfully:', {
      id: seller._id,
      email: seller.email,
      verificationStatus: seller.verificationStatus
    });

    return NextResponse.json({ 
      message: 'Account verified successfully. You can now login.',
      seller: {
        id: seller._id,
        companyName: seller.companyName,
        email: seller.email,
        verificationStatus: seller.verificationStatus
      }
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
