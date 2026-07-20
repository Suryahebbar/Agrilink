import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/models/supplier';
import { Seller } from '@/lib/models/seller';
import { connectDB } from '@/lib/db';

export async function POST(request: Request) {
  try {
    await connectDB();

    // Get or create a seller for the products
    let seller = await Seller.findOne({ companyName: 'Demo Agricultural Supplies' });
    if (!seller) {
      // Create a demo seller if it doesn't exist
      seller = new Seller({
        companyName: 'Demo Agricultural Supplies',
        email: 'demo@agrisupplies.com',
        phone: '+919876543210',
        passwordHash: 'demo_hash',
        address: {
          street: '123 Farm Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        verificationStatus: 'verified',
        isActive: true
      });
      await seller.save();
    }

    const sampleProducts = [
      {
        sellerId: seller._id,
        name: 'Premium Wheat Seeds - High Yield Variety',
        sku: 'WHEAT-001',
        category: 'seeds',
        description: 'High-quality wheat seeds suitable for Indian climate. Disease resistant and high yielding variety perfect for commercial farming.',
        price: 299,
        stockQuantity: 150,
        reorderThreshold: 20,
        images: [
          {
            url: 'https://res.cloudinary.com/dxfpm6vjo/image/upload/v1765290377/bpfis/products/kfvzfg8dyxbukxrv0vy5.jpg',
            alt: 'Premium Wheat Seeds',
            position: 1
          }
        ],
        tags: ['wheat', 'seeds', 'high-yield', 'organic'],
        status: 'active',
        specifications: {
          variety: 'HD-2967',
          germination: '85%',
          purity: '98%',
          seedRate: '100 kg/ha',
          maturity: '120-130 days'
        },
        dimensions: {
          weight: 50,
          unit: 'kg'
        }
      },
      {
        sellerId: seller._id,
        name: 'Organic Bio Fertilizer - NPK Rich',
        sku: 'FERT-001',
        category: 'fertilizers',
        description: '100% organic bio-fertilizer rich in Nitrogen, Phosphorus, and Potassium. Improves soil fertility and crop yield naturally.',
        price: 450,
        stockQuantity: 80,
        reorderThreshold: 15,
        images: [
          {
            url: 'https://res.cloudinary.com/dxfpm6vjo/image/upload/v1765290377/bpfis/products/kfvzfg8dyxbukxrv0vy5.jpg',
            alt: 'Organic Bio Fertilizer',
            position: 1
          }
        ],
        tags: ['fertilizer', 'organic', 'npk', 'bio'],
        status: 'active',
        specifications: {
          npkRatio: '10:10:10',
          formulation: 'Granular',
          application: 'Soil application',
          packaging: '50 kg bag',
          certification: 'Organic Certified'
        },
        dimensions: {
          weight: 50,
          unit: 'kg'
        }
      },
      {
        sellerId: seller._id,
        name: 'Professional Garden Tools Set - 5 Pieces',
        sku: 'TOOLS-001',
        category: 'tools',
        description: 'Complete garden tools set including spade, fork, hoe, rake, and trowel. Perfect for all gardening needs.',
        price: 899,
        stockQuantity: 25,
        reorderThreshold: 5,
        images: [
          {
            url: 'https://res.cloudinary.com/dxfpm6vjo/image/upload/v1765290377/bpfis/products/kfvzfg8dyxbukxrv0vy5.jpg',
            alt: 'Garden Tools Set',
            position: 1
          }
        ],
        tags: ['tools', 'garden', 'set', 'professional'],
        status: 'active',
        specifications: {
          pieces: '5',
          material: 'Stainless steel with wooden handles',
          warranty: '1 year',
          weight: '2.5 kg total',
          includes: 'Spade, Fork, Hoe, Rake, Trowel'
        },
        dimensions: {
          weight: 2.5,
          unit: 'kg'
        }
      },
      {
        sellerId: seller._id,
        name: 'Drip Irrigation Kit - Complete Setup',
        sku: 'IRRIG-001',
        category: 'equipment',
        description: 'Complete drip irrigation system for efficient water management in farms. Includes all necessary components for easy installation.',
        price: 2499,
        stockQuantity: 12,
        reorderThreshold: 3,
        images: [
          {
            url: 'https://res.cloudinary.com/dxfpm6vjo/image/upload/v1765290377/bpfis/products/kfvzfg8dyxbukxrv0vy5.jpg',
            alt: 'Drip Irrigation Kit',
            position: 1
          }
        ],
        tags: ['irrigation', 'drip', 'water-saving', 'kit'],
        status: 'active',
        specifications: {
          coverage: '1 acre',
          pipeMaterial: 'UV stabilized HDPE',
          dripSpacing: '30 cm',
          pressure: '1.0 - 2.0 kg/cm²',
          warranty: '2 years'
        },
        dimensions: {
          weight: 15,
          unit: 'kg'
        }
      },
      {
        sellerId: seller._id,
        name: 'Organic Pesticide - Neem Oil Based',
        sku: 'PEST-001',
        category: 'pesticides',
        description: 'Natural neem oil based pesticide effective against common pests. Safe for organic farming and environment friendly.',
        price: 399,
        stockQuantity: 60,
        reorderThreshold: 10,
        images: [
          {
            url: 'https://res.cloudinary.com/dxfpm6vjo/image/upload/v1765290377/bpfis/products/kfvzfg8dyxbukxrv0vy5.jpg',
            alt: 'Organic Pesticide',
            position: 1
          }
        ],
        tags: ['pesticide', 'organic', 'neem', 'natural'],
        status: 'active',
        specifications: {
          activeIngredient: 'Neem oil 3000 ppm',
          formulation: 'Emulsifiable concentrate',
          dosage: '2 ml/liter of water',
          packaging: '500 ml bottle',
          toxicity: 'Low toxicity to humans and animals'
        },
        dimensions: {
          weight: 0.5,
          unit: 'kg'
        }
      }
    ];

    // Clear existing products from this seller to avoid duplicates
    await Product.deleteMany({ sellerId: seller._id });

    // Insert products
    const insertedProducts = [];
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      insertedProducts.push(product);
    }

    return NextResponse.json({
      message: 'Sample supplier products created successfully',
      count: insertedProducts.length,
      products: insertedProducts.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        category: p.category,
        sku: p.sku
      }))
    });
  } catch (error) {
    console.error('Error creating sample supplier products:', error);
    return NextResponse.json({ error: 'Failed to create sample products' }, { status: 500 });
  }
}
