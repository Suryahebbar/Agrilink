import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceReturn } from '@/lib/models/marketplace-return';
import { MarketplaceOrder } from '@/lib/models/marketplace-order';
import { Product } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    await connectDB();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const query: any = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const returns = await MarketplaceReturn.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await MarketplaceReturn.countDocuments(query);

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const returnData = await request.json();
    const { 
      orderId, 
      userId, 
      items, 
      returnReason, 
      refundMethod, 
      bankDetails,
      pickupAddress,
      refundAmount 
    } = returnData;

    await connectDB();

    // Validate order exists and belongs to user
    const order = await MarketplaceOrder.findById(orderId);
    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is eligible for return (delivered orders only)
    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'Order must be delivered to be eligible for return' }, { status: 400 });
    }

    // Check if return already exists for this order
    const existingReturn = await MarketplaceReturn.findOne({ orderId });
    if (existingReturn) {
      return NextResponse.json({ error: 'Return request already exists for this order' }, { status: 400 });
    }

    // Validate return window (e.g., within 30 days of delivery)
    const deliveryDate = new Date(order.updatedAt); // Assuming updatedAt is delivery date for delivered orders
    const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const now = new Date();
    
    if (now.getTime() - deliveryDate.getTime() > returnWindow) {
      return NextResponse.json({ error: 'Return window has expired' }, { status: 400 });
    }

    // Create return request
    const newReturn = new MarketplaceReturn({
      orderId,
      userId,
      items,
      returnReason,
      refundMethod,
      bankDetails: refundMethod === 'bank_transfer' ? bankDetails : undefined,
      pickupAddress,
      refundAmount
    });

    await newReturn.save();

    return NextResponse.json({
      message: 'Return request submitted successfully',
      return: newReturn
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 });
  }
}
