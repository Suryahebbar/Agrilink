import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Product } from '@/lib/models/supplier';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectDB();
    
    console.log('=== Fixing Existing Farmer Orders ===');
    
    // Get all farmer orders with null sellerId
    const ordersWithNullSellerId = await FarmerOrder.find({
      'items.sellerId': null
    });
    
    console.log(`Found ${ordersWithNullSellerId.length} orders with null sellerId`);
    
    let updatedOrders = 0;
    let updatedItems = 0;
    
    for (const order of ordersWithNullSellerId) {
      let orderUpdated = false;
      
      for (const item of order.items) {
        if (!item.sellerId && item.productId) {
          try {
            // Look up the product to get seller information
            const product = await Product.findById(item.productId);
            if (product && product.sellerId) {
              item.sellerId = product.sellerId.toString();
              item.sellerName = (product as any).sellerName || 'Unknown Seller';
              orderUpdated = true;
              updatedItems++;
              console.log(`Updated order ${order.orderNumber}, item ${item.name} with sellerId: ${product.sellerId}`);
            } else {
              console.log(`Could not find seller for product ${item.productId} in order ${order.orderNumber}`);
            }
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
          }
        }
      }
      
      if (orderUpdated) {
        await order.save();
        updatedOrders++;
        console.log(`Updated order ${order.orderNumber}`);
      }
    }
    
    return NextResponse.json({
      message: 'Existing farmer orders fix completed',
      stats: {
        totalOrdersWithNullSellerId: ordersWithNullSellerId.length,
        updatedOrders,
        updatedItems
      }
    });
    
  } catch (error) {
    console.error('Error fixing existing farmer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fix existing farmer orders' },
      { status: 500 }
    );
  }
}
