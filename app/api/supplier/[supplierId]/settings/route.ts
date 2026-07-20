import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// GET /api/supplier/[supplierId]/settings - Get supplier settings
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
    
    // Get supplier settings
    const supplier = await Seller.findById(sellerId).select('-passwordHash');
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    const settings = {
      businessInfo: {
        companyName: supplier.companyName,
        email: supplier.email,
        phone: supplier.phone
      },
      notifications: {
        emailNotifications: supplier.settings?.emailNotifications ?? true,
        smsNotifications: supplier.settings?.smsNotifications ?? false,
        orderUpdates: supplier.settings?.orderNotifications ?? true,
        lowStockAlerts: supplier.settings?.lowStockAlerts ?? true,
        promotionalEmails: supplier.settings?.marketingEmails ?? false
      },
      tax: {
        gstNumber: supplier.gstNumber || '',
        taxInclusive: supplier.settings?.taxInclusive ?? true,
        taxRate: supplier.settings?.taxRate ?? 0.18
      },
      preferences: {
        autoConfirmOrders: supplier.settings?.autoConfirmOrders ?? false,
        defaultShippingMethod: supplier.settings?.defaultShippingMethod || 'standard',
        returnPolicy: supplier.settings?.returnPolicy || '30-days',
        currency: supplier.settings?.currency || 'INR',
        timezone: supplier.settings?.timezone || 'Asia/Kolkata',
        language: supplier.settings?.language || 'en'
      }
    };
    
    return NextResponse.json({ settings });
    
  } catch (error) {
    console.error('Error fetching supplier settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/supplier/[supplierId]/settings - Update supplier settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    await connectDB();
    
    // Authenticate supplier and validate supplierId
    const resolvedParams = await params;
    const auth = await requireAuth(request, { params: resolvedParams });
    const sellerId = auth.sellerId;
    
    const body = await request.json();
    const { businessInfo, notifications, tax, preferences } = body;
    
    // Get current supplier to preserve existing settings
    const currentSupplier = await Seller.findById(sellerId);
    if (!currentSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Build update object
    const updateData: any = {};
    
    if (businessInfo) {
      if (businessInfo.companyName) updateData.companyName = businessInfo.companyName;
      if (businessInfo.email) updateData.email = businessInfo.email;
      if (businessInfo.phone) updateData.phone = businessInfo.phone;
    }
    
    if (tax) {
      if (tax.gstNumber !== undefined) updateData.gstNumber = tax.gstNumber || undefined;
    }
    
    if (notifications || tax || preferences) {
      updateData.settings = {
        ...(currentSupplier.settings || {}),
        emailNotifications: notifications?.emailNotifications ?? currentSupplier.settings?.emailNotifications ?? true,
        smsNotifications: notifications?.smsNotifications ?? currentSupplier.settings?.smsNotifications ?? false,
        orderNotifications: notifications?.orderUpdates ?? currentSupplier.settings?.orderNotifications ?? true,
        lowStockAlerts: notifications?.lowStockAlerts ?? currentSupplier.settings?.lowStockAlerts ?? true,
        marketingEmails: notifications?.promotionalEmails ?? currentSupplier.settings?.marketingEmails ?? false,
        taxInclusive: tax?.taxInclusive ?? currentSupplier.settings?.taxInclusive ?? true,
        taxRate: tax?.taxRate ?? currentSupplier.settings?.taxRate ?? 0.18,
        autoConfirmOrders: preferences?.autoConfirmOrders ?? currentSupplier.settings?.autoConfirmOrders ?? false,
        defaultShippingMethod: preferences?.defaultShippingMethod || currentSupplier.settings?.defaultShippingMethod || 'standard',
        returnPolicy: preferences?.returnPolicy || currentSupplier.settings?.returnPolicy || '30-days',
        currency: preferences?.currency || currentSupplier.settings?.currency || 'INR',
        timezone: preferences?.timezone || currentSupplier.settings?.timezone || 'Asia/Kolkata',
        language: preferences?.language || currentSupplier.settings?.language || 'en'
      };
    }
    
    // Update supplier settings
    const updatedSupplier = await Seller.findByIdAndUpdate(
      sellerId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: updatedSupplier
    });
    
  } catch (error) {
    console.error('Error updating supplier settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
