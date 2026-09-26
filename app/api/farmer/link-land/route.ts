import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DigitizedPlot } from '@/lib/models/DigitizedPlot';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, plotId } = body;

    if (!userId || !plotId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or plotId' },
        { status: 400 }
      );
    }

    // 1. Fetch the digitized plot details
    const plot = await DigitizedPlot.findOne({ plotId });
    if (!plot) {
      return NextResponse.json(
        { success: false, error: 'Digitized plot not found' },
        { status: 404 }
      );
    }

    // 2. Convert userId to ObjectId
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // 3. Format crop history
    const croppingHistory = plot.crops.map((c: any) => `${c.name} (${c.area || '—'})`).join(', ');

    // Fetch existing profile to preserve fields safely
    const existingProfile = await FarmerProfile.findOne({ user: userObjectId });

    // 4. Update the FarmerProfile
    const profile = await FarmerProfile.findOneAndUpdate(
      { user: userObjectId },
      {
        totalCultivableArea: plot.land.cultivable_area || plot.land.total_area,
        landParcelIdentity: `${plot.administrative.survey}/${plot.administrative.surnoc || ''}/${plot.administrative.hissa || ''}`,
        croppingHistory: croppingHistory || 'None',
        soilProperties: plot.land.soil || 'Not Specified',
        rtcAddress: `${plot.administrative.village}, ${plot.administrative.hobli}, ${plot.administrative.taluk}, ${plot.administrative.district}`,
        ownershipVerified: true,
        nameVerificationStatus: 'verified',
        verifiedName: plot.owner.name || existingProfile?.verifiedName
      },
      { new: true, upsert: true }
    );

    // 5. Create or update the LandDetails
    // Map pixel vertices to the LandDetails schema
    const formattedVertices = plot.points.map((pt: number[], idx: number) => ({
      latitude: pt[0], // using pixel X as latitude in simple CRS
      longitude: pt[1], // using pixel Y as longitude in simple CRS
      order: idx
    }));

    const land = await LandDetails.findOneAndUpdate(
      { user: userObjectId },
      {
        userId: userId,
        user: userObjectId,
        landData: {
          centroidLatitude: plot.gis.centroid[0],
          centroidLongitude: plot.gis.centroid[1],
          latitude: plot.gis.latitude,
          longitude: plot.gis.longitude,
          sideLengths: plot.gis.side_lengths || [],
          vertices: formattedVertices,
          landSizeInAcres: parseFloat(plot.land.total_area) || 0,
          geojson: JSON.stringify(plot.gis.geojson_geom)
        },
        rtcDetails: {
          surveyNumber: plot.administrative.survey,
          surnoc: plot.administrative.surnoc || '—',
          hissa: plot.administrative.hissa || '—',
          extent: plot.land.total_area || '',
          location: `${plot.administrative.village}, ${plot.administrative.hobli}`,
          taluk: plot.administrative.taluk,
          hobli: plot.administrative.hobli,
          village: plot.administrative.village,
          soilType: plot.land.soil,
          cropType: plot.crops.map((c: any) => c.name).join(', '),
          
          ownerName: plot.owner.name,
          fatherName: plot.owner.father,
          khataNumber: plot.owner.khata,
          ownershipType: plot.owner.ownership_type,
          
          potKharabA: plot.land.pot_kharab_a,
          potKharabB: plot.land.pot_kharab_b,
          revenue: plot.land.revenue,
          jodi: plot.land.jodi,
          cess: plot.land.cess,
          waterRate: plot.land.water_rate,
          
          landType: plot.land.land_type,
          irrigationSource: plot.land.irrigation_source,
          trees: plot.land.trees,
          allCrops: plot.crops
        },
        processingStatus: 'completed',
        processedAt: new Date()
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Land linked successfully and profile updated.',
      profile,
      land
    });
  } catch (error) {
    console.error('Error linking land:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
