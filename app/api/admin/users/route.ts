import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    
    // Build query based on filters
    let userQuery: any = {};
    
    if (searchTerm) {
      userQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (filter !== 'all') {
      userQuery.status = filter;
    }
    
    // Get suppliers
    const suppliers = await Seller.find(userQuery)
      .select('name email phone companyName status createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get farmers
    const farmers = await FarmerProfile.find(userQuery)
      .select('name email phone farmName status createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    // Combine and format users
    const users = [
      ...suppliers.map((supplier: any) => ({
        _id: supplier._id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        role: 'supplier',
        status: supplier.status,
        createdAt: supplier.createdAt,
        companyName: supplier.companyName
      })),
      ...farmers.map((farmer: any) => ({
        _id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        role: 'farmer',
        status: farmer.status,
        createdAt: farmer.createdAt,
        farmName: farmer.farmName
      }))
    ];

    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
