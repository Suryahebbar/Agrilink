import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const { centroidLatitude, centroidLongitude, currentCrop, currentSoil, userId: bodyUserId } = await request.json();

    if (!userId) userId = bodyUserId;

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (!auth || auth.role !== 'farmer') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = auth.sub;
    }

    await connectDB();

    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;

    // Find all farmers who are ready to pool or integrate (excluding current user)
    const readyFarmers = await FarmerProfile.find({
      $and: [
        ...(userObjectId ? [{ user: { $ne: userObjectId } }] : []),
        { userId: { $ne: String(userId) } },
        {
          $or: [
            { readyToPool: true },
            { readyToIntegrate: true }
          ]
        }
      ]
    });

    if (readyFarmers.length === 0) {
      return NextResponse.json({ neighbours: [] });
    }

    // Get land details for these ready farmers
    const readyFarmerIds = readyFarmers.map((f: any) => f.userId).filter(Boolean);
    const readyFarmerObjectIds = readyFarmers.map((f: any) => {
      try {
        return f.user ? new mongoose.Types.ObjectId(f.user) : null;
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const queryIds = [...readyFarmerIds, ...readyFarmerObjectIds];

    // Find land details (support completed or pending for dev verification) using both user and userId
    const landDetails = await LandDetails.find({
      $or: [
        { user: { $in: queryIds } },
        { userId: { $in: queryIds } }
      ],
      processingStatus: { $in: ['completed', 'pending'] }
    });

    const neighbours = [];

    for (const land of landDetails) {
      const landUser = land.user || land.userId;
      if (!landUser) continue;

      const targetLat = land.landData?.centroidLatitude ?? land.landData?.latitude;
      const targetLon = land.landData?.centroidLongitude ?? land.landData?.longitude;

      // Find matching farmer profile by string or ObjectId string comparison
      const farmerProfile = readyFarmers.find((f: any) => 
        String(f.userId) === String(landUser) || 
        String(f.user) === String(landUser)
      );

      const distance = (centroidLatitude && centroidLongitude && targetLat && targetLon)
        ? Math.round(calculateDistance(centroidLatitude, centroidLongitude, targetLat, targetLon))
        : 150;
      const compatibility = Math.min(99, Math.max(75, 100 - Math.floor(distance / 50)));

      neighbours.push({
        userId: String(landUser),
        userName: farmerProfile?.verifiedName || farmerProfile?.aadhaarKannadaName || `Farmer ${String(landUser).slice(-6)}`,
        landId: land._id,
        sizeInAcres: land.landData?.landSizeInAcres || 2.5,
        surveyNumber: land.rtcDetails?.surveyNumber || 'N/A',
        location: land.rtcDetails?.location || land.rtcDetails?.village || 'Adjacent Plot',
        centroidLatitude: targetLat,
        centroidLongitude: targetLon,
        distance,
        compatibility,
        soilType: land.rtcDetails?.soilType || 'Black Cotton',
        cropType: land.rtcDetails?.cropType || 'Paddy / Sugarcane'
      });
    }

    // Sort by proximity
    neighbours.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ neighbours });

  } catch (error) {
    console.error('Error finding pooling neighbours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  try {
    // If coordinates are way outside typical degree bounds (-180 to 180), treat as canvas pixel coordinates
    if (Math.abs(lat1) > 180 || Math.abs(lon1) > 180 || Math.abs(lat2) > 180 || Math.abs(lon2) > 180) {
      const dx = lat2 - lat1;
      const dy = lon2 - lon1;
      return Math.round(Math.sqrt(dx * dx + dy * dy));
    }

    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    if (a < 0 || a > 1) {
      const dx = lat2 - lat1;
      const dy = lon2 - lon1;
      return Math.round(Math.sqrt(dx * dx + dy * dy));
    }

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    return isNaN(dist) ? 150 : dist;
  } catch (e) {
    return 150;
  }
}
