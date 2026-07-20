import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    // Use farmer ID that has completed land integration
    const farmerId = '692d2035c0b46de538276a92';
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);
    
    console.log('Fetching complete data for farmer with land integration:', farmerId);
    
    // Fetch data from all 3 collections
    const [
      farmerProfileData,
      landDetailsData,
      landIntegrationSentData,
      landIntegrationReceivedData
    ] = await Promise.all([
      // 1. farmerprofiles collection
      FarmerProfile.findOne({ $or: [{ user: farmerObjectId }, { userId: farmerId }] }),
      
      // 2. landdetails collection  
      LandDetails.find({ $or: [{ user: farmerObjectId }, { userId: farmerId }] }).sort({ createdAt: -1 }),
      
      // 3. landintegrations collection - requests sent
      LandIntegration.find({ requestingUser: farmerObjectId })
        .populate('targetUser', 'name email')
        .populate('landDetails.requestingUser.landId', 'rtcDetails')
        .populate('landDetails.targetUser.landId', 'rtcDetails')
        .sort({ requestDate: -1 }),
      
      // 3. landintegrations collection - requests received
      LandIntegration.find({ targetUser: farmerObjectId })
        .populate('requestingUser', 'name email')
        .populate('landDetails.requestingUser.landId', 'rtcDetails')
        .populate('landDetails.targetUser.landId', 'rtcDetails')
        .sort({ requestDate: -1 })
    ]);
    
    return NextResponse.json({
      farmerId,
      collections: {
        farmerprofiles: {
          collection: "farmerprofiles",
          description: "Farmer profile information with personal details, land information, and document status",
          data: farmerProfileData,
          count: farmerProfileData ? 1 : 0
        },
        landdetails: {
          collection: "landdetails", 
          description: "Land parcels with RTC details, geographical data, and land sketches",
          data: landDetailsData,
          count: landDetailsData.length
        },
        landintegrations: {
          collection: "landintegrations",
          description: "Land integration requests and agreements between farmers",
          sent: landIntegrationSentData,
          received: landIntegrationReceivedData,
          totalCount: landIntegrationSentData.length + landIntegrationReceivedData.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
