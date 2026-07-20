import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';
import { uploadFile } from '@/lib/cloudinary';

// GET /api/supplier/[supplierId]/profile - Get supplier profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Authenticate supplier and validate supplierId
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    // Get supplier profile
    const supplier = await Seller.findById(sellerId).select('-passwordHash -otp -otpExpiry').lean();
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ seller: supplier });
    
  } catch (error: any) {
    console.error('Error fetching supplier profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: error.status || 500 }
    );
  }
}

// PATCH /api/supplier/[supplierId]/profile - Update supplier profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Authenticate supplier and validate supplierId
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get('content-type') || '';
    let updateData: any = {};
    let avatarFile: File | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract form fields
      const companyName = formData.get('companyName') as string;
      const phone = formData.get('phone') as string;
      const gstNumber = formData.get('gstNumber') as string;
      const addressStr = formData.get('address') as string;
      const businessDetailsStr = formData.get('businessDetails') as string;
      avatarFile = formData.get('avatar') as File | null;
      
      if (companyName) updateData.companyName = companyName;
      if (phone) updateData.phone = phone;
      if (gstNumber !== null) updateData.gstNumber = gstNumber || undefined;
      
      // Parse address
      if (addressStr) {
        try {
          updateData.address = JSON.parse(addressStr);
        } catch {
          console.error('Failed to parse address JSON');
        }
      }
      
      // Parse business details
      if (businessDetailsStr) {
        try {
          updateData.businessDetails = JSON.parse(businessDetailsStr);
        } catch {
          console.error('Failed to parse businessDetails JSON');
        }
      }
      
      // Upload avatar if provided
      if (avatarFile && avatarFile.size > 0) {
        const buffer = Buffer.from(await avatarFile.arrayBuffer());
        const uploadResult = await uploadFile(buffer, 'avatars', `supplier-${sellerId}`);
        
        if (uploadResult.success && uploadResult.data) {
          updateData.avatarUrl = uploadResult.data.url;
        }
      }
    } else {
      // Handle JSON request
      const body = await request.json();
      updateData = body;
    }
    
    // Update supplier profile
    const updatedSupplier = await Seller.findByIdAndUpdate(
      sellerId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -otp -otpExpiry').lean();
    
    if (!updatedSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      seller: updatedSupplier
    });
    
  } catch (error: any) {
    console.error('Error updating supplier profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: error.status || 500 }
    );
  }
}

