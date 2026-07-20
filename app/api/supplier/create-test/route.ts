import { NextResponse } from 'next/server';
import { Seller, Product, Order, Review, InventoryLog } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await connectDB();
    
    // Check if test seller already exists
    const existingSeller = await Seller.findOne({ email: 'test@supplier.com' });
    if (existingSeller) {
      return NextResponse.json({
        success: true,
        message: 'Test seller already exists',
        seller: {
          id: existingSeller._id,
          companyName: existingSeller.companyName,
          email: existingSeller.email
        }
      });
    }

    // Create test seller with proper password hash
    const passwordHash = await bcrypt.hash('test123', 12);
    const seller = new Seller({
      companyName: 'Test Supplier Company',
      email: 'test@supplier.com',
      phone: '9876543210',
      passwordHash: passwordHash,
      address: {
        street: '123 Test Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India'
      },
      gstNumber: '29ABCDE1234F1ZV',
      isActive: true,
      verificationStatus: 'verified'
    });

    await seller.save();

    // Create sample products
    const products = [
      {
        sellerId: seller._id,
        name: 'Organic Wheat Seeds',
        sku: 'WHT-001',
        category: 'seeds',
        description: 'High-quality organic wheat seeds suitable for all seasons',
        price: 450,
        stockQuantity: 500,
        reorderThreshold: 100,
        status: 'active',
        images: [{ url: '/images/wheat-seeds.jpg', alt: 'Wheat Seeds', position: 0 }],
        tags: ['organic', 'wheat', 'seeds']
      },
      {
        sellerId: seller._id,
        name: 'NPK Fertilizer 20-20-20',
        sku: 'FRT-001',
        category: 'fertilizers',
        description: 'Balanced NPK fertilizer for optimal plant growth',
        price: 1200,
        stockQuantity: 200,
        reorderThreshold: 50,
        status: 'active',
        images: [{ url: '/images/npk-fertilizer.jpg', alt: 'NPK Fertilizer', position: 0 }],
        tags: ['fertilizer', 'npk', 'balanced']
      },
      {
        sellerId: seller._id,
        name: 'Agricultural Sprayer',
        sku: 'TOOL-001',
        category: 'tools',
        description: 'Professional grade agricultural sprayer with 16L capacity',
        price: 3500,
        stockQuantity: 25,
        reorderThreshold: 10,
        status: 'active',
        images: [{ url: '/images/sprayer.jpg', alt: 'Agricultural Sprayer', position: 0 }],
        tags: ['sprayer', 'tools', 'equipment']
      }
    ];

    const createdProducts = await Product.insertMany(products);

    // Create sample orders
    const orders = [
      {
        sellerId: seller._id,
        orderNumber: 'ORD-2024-001',
        customer: {
          name: 'Ramesh Kumar',
          phone: '9876543210',
          address: {
            street: '456 Farm Road',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001'
          }
        },
        items: [
          {
            productId: createdProducts[0]._id,
            name: 'Organic Wheat Seeds',
            sku: 'WHT-001',
            quantity: 5,
            price: 450,
            total: 2250
          }
        ],
        totalAmount: 2250,
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        sellerId: seller._id,
        orderNumber: 'ORD-2024-002',
        customer: {
          name: 'Suresh Patel',
          phone: '9876543211',
          address: {
            street: '789 Agriculture Lane',
            city: 'Ahmedabad',
            state: 'Gujarat',
            pincode: '380001'
          }
        },
        items: [
          {
            productId: createdProducts[1]._id,
            name: 'NPK Fertilizer 20-20-20',
            sku: 'FRT-001',
            quantity: 2,
            price: 1200,
            total: 2400
          }
        ],
        totalAmount: 2400,
        paymentStatus: 'paid',
        orderStatus: 'processing',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    const createdOrders = await Order.insertMany(orders);

    // Create sample reviews
    const reviews = [
      {
        sellerId: seller._id,
        productId: createdProducts[0]._id,
        productName: 'Organic Wheat Seeds',
        customerName: 'Ramesh Kumar',
        rating: 5,
        title: 'Excellent Quality Seeds',
        body: 'The wheat seeds are of excellent quality. Germination rate is very high.',
        sentiment: 'good',
        isFlagged: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        productId: createdProducts[1]._id,
        productName: 'NPK Fertilizer 20-20-20',
        customerName: 'Suresh Patel',
        rating: 4,
        title: 'Good Product',
        body: 'Good fertilizer, improved my crop yield. Packaging could be better.',
        sentiment: 'good',
        isFlagged: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    await Review.insertMany(reviews);

    // Create sample inventory logs
    const inventoryLogs = [
      {
        sellerId: seller._id,
        productId: createdProducts[0]._id,
        change: -50,
        reason: 'sale',
        referenceId: createdOrders[0]._id,
        previousStock: 550,
        newStock: 500,
        notes: 'Order ORD-2024-001',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        productId: createdProducts[1]._id,
        change: -2,
        reason: 'sale',
        referenceId: createdOrders[1]._id,
        previousStock: 202,
        newStock: 200,
        notes: 'Order ORD-2024-002',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    await InventoryLog.insertMany(inventoryLogs);

    console.log('✅ Test seller created:', seller._id);

    return NextResponse.json({
      success: true,
      message: 'Test seller created successfully',
      seller: {
        id: seller._id,
        companyName: seller.companyName,
        email: seller.email
      }
    });

  } catch (error) {
    console.error('❌ Error creating test seller:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test seller'
    }, { status: 500 });
  }
}
