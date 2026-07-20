import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const farmerId = url.searchParams.get('farmerId') || '692d5d04a2dbe5b5fa763825';
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);
    
    console.log('Checking data for farmer:', farmerId);
    
    // Check all 3 collections for this specific farmer
    const [
      farmerProfileData,
      landDetailsData,
      landIntegrationSentData,
      landIntegrationReceivedData
    ] = await Promise.all([
      // Farmer Profile collection
      FarmerProfile.findOne({ $or: [{ user: farmerObjectId }, { userId: farmerId }] }),
      
      // Land Details collection
      LandDetails.find({ $or: [{ user: farmerObjectId }, { userId: farmerId }] }),
      
      // Land Integration - sent
      LandIntegration.find({ requestingUser: farmerObjectId }),
      
      // Land Integration - received
      LandIntegration.find({ targetUser: farmerObjectId })
    ]);
    
    // Also check all collections to see what exists
    const [allProfiles, allLandDetails, allIntegrations] = await Promise.all([
      FarmerProfile.find({}).select('user userId'),
      LandDetails.find({}).select('user userId'),
      LandIntegration.find({}).select('requestingUser targetUser')
    ]);
    
    return NextResponse.json({
      farmerId,
      farmerObjectId: farmerObjectId.toString(),
      data: {
        farmerProfile: {
          exists: !!farmerProfileData,
          data: farmerProfileData
        },
        landDetails: {
          count: landDetailsData.length,
          data: landDetailsData
        },
        landIntegrations: {
          sent: landIntegrationSentData.length,
          received: landIntegrationReceivedData.length,
          sentData: landIntegrationSentData,
          receivedData: landIntegrationReceivedData
        }
      },
      allData: {
        allFarmerProfiles: allProfiles.map((fp: any) => ({ _id: fp._id, user: fp.user?.toString(), userId: fp.userId })),
        allLandDetails: allLandDetails.map((ld: any) => ({ _id: ld._id, user: ld.user?.toString(), userId: ld.userId })),
        allIntegrations: allIntegrations.map((li: any) => ({ _id: li._id, requestingUser: li.requestingUser?.toString(), targetUser: li.targetUser?.toString() }))
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
