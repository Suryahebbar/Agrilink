import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import mongoose from 'mongoose';

// Type for farmer check results
interface FarmerCheckResult {
  userExists: boolean;
  userName: string;
  farmerProfile: boolean;
  landDetails: boolean;
  landIntegrations: boolean;
  totalData: number;
}

export async function GET() {
  try {
    await connectDB();
    
    // Check if farmer exists in User collection
    const farmerId = '692d5d04a2dbe5b5fa763825';
    const user = await User.findById(farmerId);
    
    // Get farmers with complete data
    const farmersWithData = [
      '692d2035c0b46de538276a92',
      '692d5d9da2dbe5b5fa76382d'
    ];
    
    const results: Record<string, FarmerCheckResult> = {};
    
    for (const farmerId of farmersWithData) {
      const [userExists, profileCount, landCount, integrationCount] = await Promise.all([
        User.findById(farmerId),
        FarmerProfile.countDocuments({ $or: [{ user: farmerId }, { userId: farmerId }] }),
        LandDetails.countDocuments({ $or: [{ user: farmerId }, { userId: farmerId }] }),
        LandIntegration.countDocuments({ $or: [{ requestingUser: farmerId }, { targetUser: farmerId }] })
      ]);
      
      results[farmerId] = {
        userExists: !!userExists,
        userName: userExists?.name || 'N/A',
        farmerProfile: profileCount > 0,
        landDetails: landCount > 0,
        landIntegrations: integrationCount > 0,
        totalData: profileCount + landCount + integrationCount
      };
    }
    
    return NextResponse.json({
      requestedFarmer: {
        id: farmerId,
        exists: !!user,
        name: user?.name || 'N/A'
      },
      farmersWithCompleteData: results
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
