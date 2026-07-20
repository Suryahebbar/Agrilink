import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.config';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
}

// Mock database (in a real app, this would be a database)
let users: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'manager',
    status: 'active',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    name: 'Editor User',
    email: 'editor@example.com',
    role: 'editor',
    status: 'inactive',
    lastLogin: new Date(Date.now() - 604800000).toISOString(),
  },
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = users.find(u => u.id === id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // First try to update as supplier
    await connectDB();
    let supplier = await Seller.findById(id);
    if (supplier) {
      (supplier as any).status = status;
      await supplier.save();
      return NextResponse.json({ message: 'Supplier status updated successfully' });
    }

    // Then try to update as farmer
    let farmer = await FarmerProfile.findById(id);
    if (farmer) {
      (farmer as any).status = status;
      await farmer.save();
      return NextResponse.json({ message: 'Farmer status updated successfully' });
    }

    // If not found in real database, try mock data
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update mock user
    users[userIndex] = {
      ...users[userIndex],
      ...body,
      id: id, // Prevent ID change
    };

    return NextResponse.json(users[userIndex]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // In a real app, you might want to soft delete instead
    users = users.filter(u => u.id !== id);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
