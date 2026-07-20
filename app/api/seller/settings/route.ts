import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/seller';
import { requireAuth } from '@/lib/supplier-auth-middleware';

// GET /api/seller/settings - Get seller settings
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;
    
    // Get seller settings
    const seller = await Seller.findById(sellerId).select('-passwordHash');
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    const settings = {
      businessInfo: {
        companyName: seller.companyName,
        email: seller.email,
        phone: seller.phone,
        website: seller.website || '',
        description: seller.description || ''
      },
      notifications: {
        emailNotifications: seller.notifications?.emailNotifications ?? true,
        smsNotifications: seller.notifications?.smsNotifications ?? false,
        orderUpdates: seller.notifications?.orderUpdates ?? true,
        lowStockAlerts: seller.notifications?.lowStockAlerts ?? true,
        promotionalEmails: seller.notifications?.promotionalEmails ?? false
      },
      payment: {
        bankName: seller.paymentInfo?.bankName || '',
        accountNumber: seller.paymentInfo?.accountNumber || '',
        ifscCode: seller.paymentInfo?.ifscCode || '',
        accountHolderName: seller.paymentInfo?.accountHolderName || seller.companyName,
        upiId: seller.paymentInfo?.upiId || ''
      },
      shipping: {
        freeShippingThreshold: seller.shippingInfo?.freeShippingThreshold || 500,
        standardShippingFee: seller.shippingInfo?.standardShippingFee || 50,
        expressShippingFee: seller.shippingInfo?.expressShippingFee || 100,
        deliveryTime: seller.shippingInfo?.deliveryTime || '3-5 business days'
      },
      tax: {
        gstNumber: seller.taxInfo?.gstNumber || '',
        panNumber: seller.taxInfo?.panNumber || '',
        taxRegistered: seller.taxInfo?.taxRegistered ?? false
      }
    };
    
    return NextResponse.json({ settings });
    
  } catch (error) {
    console.error('Error fetching seller settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/seller/settings - Update seller settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate seller
    const auth = await requireAuth(request);
    const sellerId = auth.sellerId;
    
    const body = await request.json();
    const { businessInfo, notifications, payment, shipping, tax } = body;
    
    // Update seller settings
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      {
        $set: {
          companyName: businessInfo?.companyName,
          email: businessInfo?.email,
          phone: businessInfo?.phone,
          website: businessInfo?.website,
          description: businessInfo?.description,
          'notifications.emailNotifications': notifications?.emailNotifications,
          'notifications.smsNotifications': notifications?.smsNotifications,
          'notifications.orderUpdates': notifications?.orderUpdates,
          'notifications.lowStockAlerts': notifications?.lowStockAlerts,
          'notifications.promotionalEmails': notifications?.promotionalEmails,
          'paymentInfo.bankName': payment?.bankName,
          'paymentInfo.accountNumber': payment?.accountNumber,
          'paymentInfo.ifscCode': payment?.ifscCode,
          'paymentInfo.accountHolderName': payment?.accountHolderName,
          'paymentInfo.upiId': payment?.upiId,
          'shippingInfo.freeShippingThreshold': shipping?.freeShippingThreshold,
          'shippingInfo.standardShippingFee': shipping?.standardShippingFee,
          'shippingInfo.expressShippingFee': shipping?.expressShippingFee,
          'shippingInfo.deliveryTime': shipping?.deliveryTime,
          'taxInfo.gstNumber': tax?.gstNumber,
          'taxInfo.panNumber': tax?.panNumber,
          'taxInfo.taxRegistered': tax?.taxRegistered
        }
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!updatedSeller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Settings updated successfully',
      seller: updatedSeller
    });
    
  } catch (error) {
    console.error('Error updating seller settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
