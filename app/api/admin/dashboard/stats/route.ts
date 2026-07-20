import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.config';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Product, Order } from '@/lib/models/supplier';

export async function GET() {
  try {
    // Verify admin authentication
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database if not already connected
    await connectDB();

    // Get counts for dashboard
    const [
      totalFarmers,
      totalSuppliers,
      totalProducts,
      totalSupplierOrders,
      recentFarmers,
      recentSuppliers,
      recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }).catch(() => 0),
      User.countDocuments({ role: 'supplier' }).catch(() => 0),
      Product.countDocuments({ status: 'active' }).catch(() => 0),
      Order.countDocuments().catch(() => 0),
      User.find({ role: 'farmer' }).sort({ createdAt: -1 }).limit(5).catch(() => []),
      User.find({ role: 'supplier' }).sort({ createdAt: -1 }).limit(5).catch(() => []),
      Order.find().sort({ createdAt: -1 }).limit(5).catch(() => [])
    ]);

    // Create recent activities from farmers, suppliers, and orders
    const recentActivities = [
      ...recentFarmers.map(farmer => ({
        id: farmer._id,
        type: 'farmer_registration',
        title: 'New Farmer Registered',
        description: `${farmer.fullName || farmer.email} joined the platform`,
        timestamp: farmer.createdAt,
        user: farmer.fullName || farmer.email,
        status: 'completed'
      })),
      ...recentSuppliers.map(supplier => ({
        id: supplier._id,
        type: 'supplier_registration',
        title: 'New Supplier Registered',
        description: `${supplier.companyName || supplier.email} joined the platform`,
        timestamp: supplier.createdAt,
        user: supplier.companyName || supplier.email,
        status: 'completed'
      })),
      ...recentOrders.map(order => ({
        id: order._id,
        type: 'supplier_order',
        title: `Order #${order._id.toString().substring(0, 8)}`,
        description: `New order placed`,
        timestamp: order.createdAt,
        user: order.customerName || 'Customer',
        status: order.status || 'pending',
        amount: order.totalAmount || 0
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    // Return response with basic data
    const stats = {
      totalFarmers,
      totalSuppliers,
      totalProducts,
      totalMarketplaceOrders: 0, // Will add later
      totalSupplierOrders,
      totalRevenue: 0,
      recentActivities,
      topProducts: [],
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        customer: order.customerName || 'Customer',
        amount: order.totalAmount || 0,
        status: order.status || 'pending'
      })),
      recentActivity: recentActivities
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
