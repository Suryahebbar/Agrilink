import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Cart } from '@/lib/models/Cart';
import { Product } from '@/lib/models/supplier';
import mongoose from 'mongoose';

export async function POST() {
  try {
    await connectDB();
    
    console.log('=== Fixing Cart Seller Information ===');
    
    // Get all carts
    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts to process`);
    
    let updatedCarts = 0;
    let updatedItems = 0;
    
    for (const cart of carts) {
      let cartUpdated = false;
      
      for (const item of cart.items) {
        // If item doesn't have sellerId, try to get it from product
        if (!item.sellerId && item.productId) {
          try {
            const product = await Product.findById(item.productId);
            if (product && product.sellerId) {
              item.sellerId = product.sellerId.toString();
              item.sellerName = (product as any).sellerName || 'Unknown Seller';
              cartUpdated = true;
              updatedItems++;
              console.log(`Updated item ${item.name} with sellerId: ${product.sellerId}`);
            }
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
          }
        }
      }
      
      if (cartUpdated) {
        await cart.save();
        updatedCarts++;
        console.log(`Updated cart for user: ${cart.userId}`);
      }
    }
    
    return NextResponse.json({
      message: 'Cart seller information fix completed',
      stats: {
        totalCarts: carts.length,
        updatedCarts,
        updatedItems
      }
    });
    
  } catch (error) {
    console.error('Error fixing cart seller info:', error);
    return NextResponse.json(
      { error: 'Failed to fix cart seller information' },
      { status: 500 }
    );
  }
}
