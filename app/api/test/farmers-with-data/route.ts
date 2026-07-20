import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    // Get all farmers with data in any of the three collections
    const [farmerProfiles, landDetails, landIntegrations] = await Promise.all([
      FarmerProfile.find({}).select('user userId'),
      LandDetails.find({}).select('user userId'),
      LandIntegration.find({}).select('requestingUser targetUser')
    ]);
    
    // Collect unique farmer IDs
    const farmerIds = new Set();
    
    farmerProfiles.forEach((fp: any) => {
      farmerIds.add(fp.user?.toString());
      if (fp.userId) farmerIds.add(fp.userId);
    });
    
    landDetails.forEach((ld: any) => {
      farmerIds.add(ld.user?.toString());
      if (ld.userId) farmerIds.add(ld.userId);
    });
    
    landIntegrations.forEach((li: any) => {
      farmerIds.add(li.requestingUser?.toString());
      farmerIds.add(li.targetUser?.toString());
    });
    
    // Get counts for each farmer
    const farmersWithData = [];
    for (const farmerId of farmerIds) {
      const [profileCount, landCount, sentCount, receivedCount] = await Promise.all([
        FarmerProfile.countDocuments({ $or: [{ user: farmerId }, { userId: farmerId }] }),
        LandDetails.countDocuments({ $or: [{ user: farmerId }, { userId: farmerId }] }),
        LandIntegration.countDocuments({ requestingUser: farmerId }),
        LandIntegration.countDocuments({ targetUser: farmerId })
      ]);
      
      farmersWithData.push({
        farmerId,
        farmerProfile: profileCount > 0,
        landDetails: landCount > 0,
        landIntegrationsSent: sentCount > 0,
        landIntegrationsReceived: receivedCount > 0,
        totalData: profileCount + landCount + sentCount + receivedCount
      });
    }
    
    // Sort by total data amount
    farmersWithData.sort((a, b) => b.totalData - a.totalData);
    
    return NextResponse.json({
      farmersWithData: farmersWithData.slice(0, 10), // Top 10 farmers with most data
      totalFarmersWithData: farmersWithData.length
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
