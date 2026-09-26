import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    console.log("DEBUG GET status: searchParams userId =", userId);

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        userId = auth.sub;
      }
    }

    if (!userId) {
      console.log("DEBUG GET status: Unauthorized request");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("DEBUG GET status: final userId =", userId);

    await connectDB();

    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const queryConditions: any[] = [{ userId: String(userId) }];
    if (userObjId) {
      queryConditions.push({ user: userObjId });
      queryConditions.push({ _id: userObjId });
    }

    // Fetch profile robustly
    const profile = await FarmerProfile.findOne({ $or: queryConditions });
    
    // Fetch land details robustly
    const land = await LandDetails.findOne({ $or: queryConditions });

    console.log("DEBUG GET status: found profile readyToPool =", profile?.readyToPool, "land =", !!land);

    return NextResponse.json({
      success: true,
      readyToPool: profile?.readyToPool ?? profile?.readyToIntegrate ?? false,
      land: land ? {
        id: land._id,
        surveyNumber: land.rtcDetails?.surveyNumber || 'N/A',
        area: land.landData?.landSizeInAcres ? `${land.landData.landSizeInAcres.toFixed(2)} acres` : 'N/A',
        processingStatus: land.processingStatus || 'pending',
        location: land.rtcDetails?.location || 'N/A',
        centroidLatitude: land.landData?.centroidLatitude,
        centroidLongitude: land.landData?.centroidLongitude,
      } : null
    });
  } catch (error: any) {
    console.error('Error fetching pooling status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const { ready, userId: bodyUserId } = await request.json();

    console.log("DEBUG POST status: searchParams userId =", userId, "bodyUserId =", bodyUserId, "ready =", ready);

    if (!userId) userId = bodyUserId;

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        userId = auth.sub;
      }
    }

    if (!userId) {
      console.log("DEBUG POST status: Unauthorized request");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("DEBUG POST status: final userId =", userId, "ready =", ready);

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
        readyToPool: ready,
        readyToIntegrate: ready,
        readyToPoolDate: ready ? new Date() : null,
        readyToIntegrateDate: ready ? new Date() : null
      });
    } else {
      profile.readyToPool = ready;
      profile.readyToIntegrate = ready;
      profile.readyToPoolDate = ready ? new Date() : null;
      profile.readyToIntegrateDate = ready ? new Date() : null;
      if (!profile.userId) {
        profile.userId = String(userId);
      }
    }
    
    await profile.save();

    console.log("DEBUG POST status: successfully saved readyToPool =", profile.readyToPool);

    return NextResponse.json({
      success: true,
      readyToPool: profile.readyToPool
    });
  } catch (error: any) {
    console.error('Error updating pooling status:', error);
    return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 500 });
  }
}
