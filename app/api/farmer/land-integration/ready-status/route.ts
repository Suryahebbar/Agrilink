import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { getUserFromRequest } from '../../../../../lib/auth';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const { ready, userId: bodyUserId } = await request.json();

    if (!userId) userId = bodyUserId;

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        userId = auth.sub;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Updating ready status for user:', userId, 'to:', ready);

    await connectDB();

    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const queryConditions: any[] = [{ userId: String(userId) }];
    if (userObjId) {
      queryConditions.push({ user: userObjId });
      queryConditions.push({ _id: userObjId });
    }

    // Query robustly using user object or string userId
    let profile = await FarmerProfile.findOne({ $or: queryConditions });
    
    if (!profile) {
      console.log('Profile not found for user, creating one:', userId);
      profile = new FarmerProfile({
        user: userObjId || new mongoose.Types.ObjectId(),
        userId: String(userId),
        readyToIntegrate: ready,
        readyToIntegrateDate: ready ? new Date() : null,
        readyToPool: ready,
        readyToPoolDate: ready ? new Date() : null
      });
    } else {
      profile.readyToIntegrate = ready;
      profile.readyToIntegrateDate = ready ? new Date() : null;
      profile.readyToPool = ready;
      profile.readyToPoolDate = ready ? new Date() : null;
      if (!profile.userId) {
        profile.userId = String(userId);
      }
    }
    
    await profile.save();

    console.log('Profile updated successfully. New ready status:', profile.readyToIntegrate);

    return NextResponse.json({ 
      success: true, 
      message: ready ? 'Marked as ready to integrate' : 'Removed from integration list',
      readyToIntegrate: profile.readyToIntegrate
    });

  } catch (error: any) {
    console.error('Error updating ready status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', details: error.stack }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        userId = auth.sub;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Getting ready status for user:', userId);

    await connectDB();

    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const queryConditions: any[] = [{ userId: String(userId) }];
    if (userObjId) {
      queryConditions.push({ user: userObjId });
      queryConditions.push({ _id: userObjId });
    }

    let profile = await FarmerProfile.findOne({ $or: queryConditions });

    if (!profile) {
      console.log('Profile not found for user, auto-initializing:', userId);
      profile = await FarmerProfile.create({
        user: userObjId || new mongoose.Types.ObjectId(),
        userId: String(userId),
        readyToIntegrate: false,
        readyToIntegrateDate: null,
        readyToPool: false
      });
    }

    console.log('Found profile for user:', userId, 'ready status:', profile.readyToIntegrate);

    return NextResponse.json({ 
      readyToIntegrate: profile.readyToIntegrate ?? profile.readyToPool ?? false,
      readyToIntegrateDate: profile.readyToIntegrateDate
    });

  } catch (error: any) {
    console.error('Error getting ready status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', details: error.stack }, { status: 500 });
  }
}
