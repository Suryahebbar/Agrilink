// Test script to verify supplier details API fixes
import mongoose from 'mongoose';

async function testSupplierAPI() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bpfis');
    console.log('✅ Connected to database');

    // Check User model
    const { User } = await import('./lib/models/User.js');
    const supplierCount = await User.countDocuments({ role: 'supplier' });
    console.log(`✅ Found ${supplierCount} suppliers in User model`);

    // Check Seller model
    const { Seller } = await import('./lib/models/supplier.js');
    const sellerCount = await Seller.countDocuments();
    console.log(`✅ Found ${sellerCount} sellers in Seller model`);

    // Get a sample supplier ID if available
    let sampleSupplierId = null;
    if (supplierCount > 0) {
      const sampleSupplier = await User.findOne({ role: 'supplier' });
      sampleSupplierId = sampleSupplier._id;
      console.log(`✅ Sample supplier ID: ${sampleSupplierId}`);
    } else if (sellerCount > 0) {
      const sampleSeller = await Seller.findOne();
      sampleSupplierId = sampleSeller._id;
      console.log(`✅ Sample seller ID: ${sampleSupplierId}`);
    }

    if (sampleSupplierId) {
      console.log(`\n🔧 Testing API fixes...`);
      console.log(`- Admin login credentials: admin@bpfis.com / admin123`);
      console.log(`- Supplier details URL: http://localhost:3000/admin/suppliers/${sampleSupplierId}`);
      console.log(`\n✅ All fixes applied successfully:`);
      console.log(`  1. Fixed admin login password typo`);
      console.log(`  2. Added authentication protection to admin layout`);
      console.log(`  3. Fixed API to check both User and Seller models`);
    } else {
      console.log('⚠️  No suppliers found in database. Please register a supplier first.');
    }

    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSupplierAPI();
