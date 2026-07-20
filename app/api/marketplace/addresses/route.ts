import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceAddress } from '@/lib/models/marketplace-address';
import { connectDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // shipping, billing, both
    
    await connectDB();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const query: any = { userId };
    if (type && type !== 'all') {
      query.$or = [
        { type },
        { type: 'both' }
      ];
    }

    const addresses = await MarketplaceAddress.find(query)
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const addressData = await request.json();
    const { userId, type, fullName, phone, email, address, isDefault, landmark, instructions } = addressData;

    await connectDB();

    if (!userId || !fullName || !phone || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If setting as default, unset other default addresses
    if (isDefault) {
      await MarketplaceAddress.updateMany(
        { userId, type: { $in: [type, 'both'] } },
        { isDefault: false }
      );
    }

    const newAddress = new MarketplaceAddress({
      userId,
      type: type || 'shipping',
      fullName,
      phone,
      email,
      address,
      isDefault: isDefault || false,
      landmark,
      instructions
    });

    await newAddress.save();

    return NextResponse.json({
      message: 'Address created successfully',
      address: newAddress
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');
    
    const addressData = await request.json();
    const { type, fullName, phone, email, address, isDefault, landmark, instructions } = addressData;

    await connectDB();

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    const existingAddress = await MarketplaceAddress.findById(addressId);
    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset other default addresses
    if (isDefault && !existingAddress.isDefault) {
      await MarketplaceAddress.updateMany(
        { userId: existingAddress.userId, type: { $in: [type || existingAddress.type, 'both'] } },
        { isDefault: false }
      );
    }

    const updatedAddress = await MarketplaceAddress.findByIdAndUpdate(
      addressId,
      {
        type: type || existingAddress.type,
        fullName,
        phone,
        email,
        address,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
        landmark,
        instructions
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Address updated successfully',
      address: updatedAddress
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');
    
    await connectDB();

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    const address = await MarketplaceAddress.findById(addressId);
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await MarketplaceAddress.findByIdAndDelete(addressId);

    return NextResponse.json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
