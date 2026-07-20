import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    const farmerId = '69413add22ca8631e5bde118';
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);
    
    console.log('Testing with farmer ID:', farmerId);
    console.log('Farmer ObjectId:', farmerObjectId);
    
    // Check FarmerProfile
    const farmerProfile1 = await FarmerProfile.findOne({ user: farmerObjectId });
    const farmerProfile2 = await FarmerProfile.findOne({ userId: farmerId });
    const allFarmerProfiles = await FarmerProfile.find({});
    
    console.log('FarmerProfile by user ObjectId:', farmerProfile1?._id);
    console.log('FarmerProfile by userId string:', farmerProfile2?._id);
    console.log('All FarmerProfile user fields:', allFarmerProfiles.map((fp: any) => ({ _id: fp._id, user: fp.user, userId: fp.userId })));
    
    // Check LandDetails  
    const landDetails1 = await LandDetails.find({ user: farmerObjectId });
    const landDetails2 = await LandDetails.find({ userId: farmerId });
    const allLandDetails = await LandDetails.find({});
    
    console.log('LandDetails by user ObjectId count:', landDetails1.length);
    console.log('LandDetails by userId string count:', landDetails2.length);
    console.log('All LandDetails user fields:', allLandDetails.map((ld: any) => ({ _id: ld._id, user: ld.user, userId: ld.userId })));
    
    return NextResponse.json({
      farmerId,
      farmerObjectId: farmerObjectId.toString(),
      farmerProfile: {
        byObjectId: farmerProfile1 ? { _id: farmerProfile1._id, user: farmerProfile1.user, userId: farmerProfile1.userId } : null,
        byStringId: farmerProfile2 ? { _id: farmerProfile2._id, user: farmerProfile2.user, userId: farmerProfile2.userId } : null,
        allProfiles: allFarmerProfiles.map((fp: any) => ({ _id: fp._id, user: fp.user, userId: fp.userId }))
      },
      landDetails: {
        byObjectId: landDetails1.length,
        byStringId: landDetails2.length,
        allDetails: allLandDetails.map((ld: any) => ({ _id: ld._id, user: ld.user, userId: ld.userId }))
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
