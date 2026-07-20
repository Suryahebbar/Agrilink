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
    const searchId = url.searchParams.get('searchId') || '692d5d04a2dbe5b5fa763825';
    
    console.log('Searching for farmer data with ID:', searchId);
    
    // Search in multiple ways
    const searches = [
      // Direct ObjectId match
      { user: new mongoose.Types.ObjectId(searchId) },
      { userId: searchId },
      // String match in ObjectId field
      { user: searchId },
      // Partial matches
      { userId: { $regex: searchId, $options: 'i' } }
    ];
    
    let foundData = {
      farmerProfile: [],
      landDetails: [],
      landIntegrations: []
    };
    
    // Search FarmerProfile
    for (const search of searches) {
      const results = await FarmerProfile.find(search);
      if (results.length > 0) {
        foundData.farmerProfile = results;
        break;
      }
    }
    
    // Search LandDetails
    for (const search of searches) {
      const results = await LandDetails.find(search);
      if (results.length > 0) {
        foundData.landDetails = results;
        break;
      }
    }
    
    // Search LandIntegration
    for (const search of searches) {
      const results = await LandIntegration.find({
        $or: [
          { requestingUser: new mongoose.Types.ObjectId(searchId) },
          { targetUser: new mongoose.Types.ObjectId(searchId) },
          { requestingUser: searchId },
          { targetUser: searchId }
        ]
      });
      if (results.length > 0) {
        foundData.landIntegrations = results;
        break;
      }
    }
    
    // Get all data to see what exists
    const [allProfiles, allLandDetails, allIntegrations] = await Promise.all([
      FarmerProfile.find({}).limit(10).select('user userId verifiedName'),
      LandDetails.find({}).limit(10).select('user userId'),
      LandIntegration.find({}).limit(5).select('requestingUser targetUser status')
    ]);
    
    return NextResponse.json({
      searchId,
      foundData: {
        farmerProfileCount: foundData.farmerProfile.length,
        landDetailsCount: foundData.landDetails.length,
        landIntegrationsCount: foundData.landIntegrations.length,
        farmerProfile: foundData.farmerProfile,
        landDetails: foundData.landDetails,
        landIntegrations: foundData.landIntegrations
      },
      sampleData: {
        farmerProfiles: allProfiles,
        landDetails: allLandDetails,
        landIntegrations: allIntegrations
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
