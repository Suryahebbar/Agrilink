import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Seller } from '@/lib/models/supplier';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectDB();
    
    console.log('=== Creating Test Order with Time Progression ===');
    
    // Get a supplier to test with
    const supplier = await Seller.findOne({});
    if (!supplier) {
      console.log('No suppliers found in database');
      return NextResponse.json({ error: 'No suppliers found' }, { status: 400 });
    }
    
    const sellerId = supplier._id.toString();
    console.log('Creating test order for supplier:', sellerId, supplier.companyName);
    
    // Create test orders with different timestamps to simulate progression
    const now = new Date();
    const orders = [];
    
    // Order 1: Created 2 days ago (should be shipped)
    const order1Timestamp = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
    const testOrder1 = await FarmerOrder.create({
      orderNumber: `AGR${Date.now()}-2D`,
      user: new mongoose.Types.ObjectId(),
      userId: 'test-user-2days',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        name: '2-Day Old Product',
        price: 150,
        quantity: 1,
        image: '/test-image.jpg',
        sellerId: sellerId,
        sellerName: supplier.companyName || 'Test Seller'
      }],
      totalAmount: 150,
      status: 'confirmed',
      paymentStatus: 'pending',
      shipping: {
        name: 'Test Farmer 2D',
        phone: '1234567890',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      tracking: {
        trackingNumber: `TRK${Date.now()}-2D`,
        carrier: 'Test Carrier'
      },
      statusHistory: [{
        status: 'confirmed',
        timestamp: order1Timestamp,
        note: 'Test order created 2 days ago'
      }],
      createdAt: order1Timestamp,
      updatedAt: order1Timestamp
    });
    orders.push(testOrder1);
    
    // Order 2: Created 1 day ago (should be processing)
    const order2Timestamp = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000));
    const testOrder2 = await FarmerOrder.create({
      orderNumber: `AGR${Date.now()}-1D`,
      user: new mongoose.Types.ObjectId(),
      userId: 'test-user-1day',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        name: '1-Day Old Product',
        price: 200,
        quantity: 2,
        image: '/test-image.jpg',
        sellerId: sellerId,
        sellerName: supplier.companyName || 'Test Seller'
      }],
      totalAmount: 400,
      status: 'confirmed',
      paymentStatus: 'pending',
      shipping: {
        name: 'Test Farmer 1D',
        phone: '1234567890',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      tracking: {
        trackingNumber: `TRK${Date.now()}-1D`,
        carrier: 'Test Carrier'
      },
      statusHistory: [{
        status: 'confirmed',
        timestamp: order2Timestamp,
        note: 'Test order created 1 day ago'
      }],
      createdAt: order2Timestamp,
      updatedAt: order2Timestamp
    });
    orders.push(testOrder2);
    
    // Order 3: Created now (should stay confirmed)
    const testOrder3 = await FarmerOrder.create({
      orderNumber: `AGR${Date.now()}-0D`,
      user: new mongoose.Types.ObjectId(),
      userId: 'test-user-0day',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        name: 'Fresh Product',
        price: 100,
        quantity: 1,
        image: '/test-image.jpg',
        sellerId: sellerId,
        sellerName: supplier.companyName || 'Test Seller'
      }],
      totalAmount: 100,
      status: 'confirmed',
      paymentStatus: 'pending',
      shipping: {
        name: 'Test Farmer Fresh',
        phone: '1234567890',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      tracking: {
        trackingNumber: `TRK${Date.now()}-0D`,
        carrier: 'Test Carrier'
      },
      statusHistory: [{
        status: 'confirmed',
        timestamp: now,
        note: 'Fresh test order created'
      }],
      createdAt: now,
      updatedAt: now
    });
    orders.push(testOrder3);
    
    console.log('Test orders created with time progression');
    
    // Test if supplier can find these orders
    const supplierOrders = await FarmerOrder.find({
      'items.sellerId': { $in: [sellerId, sellerId] }
    });
    
    console.log('Supplier can find orders:', supplierOrders.length);
    
    return NextResponse.json({
      message: 'Test orders with time progression created successfully',
      data: {
        ordersCreated: orders.length,
        sellerId: sellerId,
        sellerName: supplier.companyName,
        supplierFoundOrders: supplierOrders.length,
        orders: orders.map(order => ({
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          hoursAgo: Math.round((now.getTime() - order.createdAt.getTime()) / (60 * 60 * 1000))
        }))
      }
    });
    
  } catch (error) {
    console.error('Error creating test orders:', error);
    return NextResponse.json(
      { error: 'Failed to create test orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
