import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import FarmerSchemeProfile, { IFarmerSchemeProfile } from '../../../../models/FarmerSchemeProfile';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bpfis';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

// GET - Retrieve farmer's scheme profiles
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const profiles = await FarmerSchemeProfile.find({ 
      userId, 
      isActive: true 
    })
    .sort({ isDefault: -1, createdAt: -1 })
    .select('-searchResults'); // Exclude search results for list view

    return NextResponse.json({ 
      success: true, 
      data: profiles,
      count: profiles.length 
    });

  } catch (error: any) {
    console.error('Error fetching scheme profiles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profiles', 
      message: error.message 
    }, { status: 500 });
  }
}

// POST - Create or update farmer scheme profile
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { userId, profileData, profileName, searchResults, isDefault } = body;

    if (!userId || !profileName) {
      return NextResponse.json({ 
        error: 'User ID and profile name are required' 
      }, { status: 400 });
    }

    // Create or update profile
    const profile = await FarmerSchemeProfile.findOneAndUpdate(
      { 
        userId, 
        profileName: profileName.trim(),
        isActive: true 
      },
      {
        userId,
        profileData,
        profileName: profileName.trim(),
        searchResults: searchResults ? [searchResults] : [],
        isDefault: isDefault || false,
        isActive: true
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    return NextResponse.json({ 
      success: true, 
      data: profile,
      message: 'Profile saved successfully' 
    });

  } catch (error: any) {
    console.error('Error saving scheme profile:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'Profile with this name already exists' 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      error: 'Failed to save profile', 
      message: error.message 
    }, { status: 500 });
  }
}

// PUT - Update existing profile
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { profileId, profileData, profileName, isDefault } = body;

    if (!profileId) {
      return NextResponse.json({ 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    const profile = await FarmerSchemeProfile.findByIdAndUpdate(
      profileId,
      {
        ...(profileData && { profileData }),
        ...(profileName && { profileName: profileName.trim() }),
        ...(isDefault !== undefined && { isDefault })
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return NextResponse.json({ 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: profile,
      message: 'Profile updated successfully' 
    });

  } catch (error: any) {
    console.error('Error updating scheme profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile', 
      message: error.message 
    }, { status: 500 });
  }
}

// DELETE - Soft delete profile
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    
    if (!profileId) {
      return NextResponse.json({ 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    const profile = await FarmerSchemeProfile.findByIdAndUpdate(
      profileId,
      { isActive: false },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json({ 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error deleting scheme profile:', error);
    return NextResponse.json({ 
      error: 'Failed to delete profile', 
      message: error.message 
    }, { status: 500 });
  }
}
