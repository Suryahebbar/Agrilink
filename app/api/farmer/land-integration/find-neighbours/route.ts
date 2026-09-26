import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { LandDetails } from '../../../../../lib/models/LandDetails';
import { getUserFromRequest } from '../../../../../lib/auth';

import mongoose from 'mongoose';

interface NeighbouringLand {
  userId: string;
  userName: string;
  landId: string;
  sizeInAcres: number;
  centroidLatitude: number;
  centroidLongitude: number;
  distance: number;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const { centroidLatitude, centroidLongitude, userId: bodyUserId } = await request.json();

    if (!userId) userId = bodyUserId;

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (!auth || auth.role !== 'farmer') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = auth.sub;
    }

    await connectDB();

    // Find all farmers who are ready to integrate (excluding current user)
    const readyFarmers = await FarmerProfile.find({
      userId: { $ne: userId },
      readyToIntegrate: true,
      nameVerificationStatus: { $in: ['verified', 'pending'] }
    });

    if (readyFarmers.length === 0) {
      return NextResponse.json({ neighbours: [] });
    }

    // Get land details for ready farmers
    const readyFarmerIds = readyFarmers.map((f: any) => f.userId);
    const readyFarmerObjectIds = readyFarmerIds.map((id: string) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const queryIds = [...readyFarmerIds, ...readyFarmerObjectIds];

    const landDetails = await LandDetails.find({
      userId: { $in: queryIds },
      'landData.centroidLatitude': { $exists: true },
      'landData.centroidLongitude': { $exists: true },
      processingStatus: 'completed'
    });

    // Calculate distances and find neighbours (within 500 meters)
    const neighbours = [];
    const maxDistance = 500; // 500 meters

    for (const land of landDetails) {
      // Ensure landData exists before accessing properties
      if (!land.landData || !land.userId) continue;
      
      const distance = calculateDistance(
        centroidLatitude,
        centroidLongitude,
        land.landData.centroidLatitude,
        land.landData.centroidLongitude
      );

      if (distance <= maxDistance) {
        const farmerProfile = readyFarmers.find((f: any) => f.userId === land.userId);
        neighbours.push({
          userId: land.userId,
          userName: farmerProfile?.verifiedName || farmerProfile?.aadhaarKannadaName || `Farmer ${land.userId.slice(-6)}`,
          landId: land._id,
          sizeInAcres: land.landData.landSizeInAcres || 0,
          centroidLatitude: land.landData.centroidLatitude,
          centroidLongitude: land.landData.centroidLongitude,
          distance
        });
      }
    }

    // Sort by distance (closest first)
    neighbours.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ neighbours });

  } catch (error) {
    console.error('Error finding neighbours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  try {
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
