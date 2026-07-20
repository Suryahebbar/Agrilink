import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Seller } from '@/lib/models/supplier';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectDB();
    
    console.log('=== Creating Test Delivered Order ===');
    
    // Get a supplier to test with
    const supplier = await Seller.findOne({});
    if (!supplier) {
      console.log('No suppliers found in database');
      return NextResponse.json({ error: 'No suppliers found' }, { status: 400 });
    }
    
    const sellerId = supplier._id.toString();
    console.log('Creating delivered test order for supplier:', sellerId, supplier.companyName);
    
    // Create a delivered test order
    const orderNumber = `AGR${Date.now()}-DEL`;
    const testOrder = await FarmerOrder.create({
      orderNumber,
      user: new mongoose.Types.ObjectId(),
      userId: 'test-user-delivered',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        name: 'Test Delivered Product',
        price: 100,
        quantity: 2,
        image: '/test-image.jpg',
        sellerId: sellerId,
        sellerName: supplier.companyName || 'Test Seller'
      }],
      totalAmount: 200,
      status: 'delivered',
      paymentStatus: 'paid',
      shipping: {
        name: 'Test Farmer Delivered',
        phone: '1234567890',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      tracking: {
        trackingNumber: `TRK${Date.now()}-DEL`,
        carrier: 'Test Carrier',
        shippedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        actualDelivery: new Date(Date.now() - 24 * 60 * 60 * 1000),
        currentLocation: 'Delivered'
      },
      statusHistory: [{
        status: 'confirmed',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
        note: 'Test order confirmed'
      }, {
        status: 'processing',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        note: 'Test order processing'
      }, {
        status: 'shipped',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
        note: 'Test order shipped'
      }, {
        status: 'delivered',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        note: 'Test order delivered'
      }],
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    });
    
    console.log('Test delivered order created successfully:', testOrder._id);
    
    return NextResponse.json({
      message: 'Test delivered order created successfully',
      data: {
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        status: testOrder.status,
        sellerId: sellerId,
        sellerName: supplier.companyName,
        userId: testOrder.userId,
        productId: testOrder.items[0].productId
      }
    });
    
  } catch (error) {
    console.error('Error creating test delivered order:', error);
    return NextResponse.json(
      { error: 'Failed to create test delivered order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
