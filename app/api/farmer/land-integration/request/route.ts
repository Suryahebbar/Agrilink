import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LandIntegration } from '../../../../../lib/models/LandIntegration';
import { LandDetails } from '../../../../../lib/models/LandDetails';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { getUserFromRequest } from '../../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth || auth.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, targetLandId, integrationPeriod } = await request.json();
    const requestingUserId = auth.sub;

    await connectDB();

    // Get both users' land details
    const [requestingLand, targetLand] = await Promise.all([
      LandDetails.findOne({ userId: requestingUserId, processingStatus: 'completed' }),
      LandDetails.findOne({ userId: targetUserId, _id: new ObjectId(targetLandId), processingStatus: 'completed' })
    ]);

    if (!requestingLand) {
      return NextResponse.json({ error: 'Your land details not found or not processed' }, { status: 404 });
    }

    if (!targetLand) {
      return NextResponse.json({ error: 'Target land details not found' }, { status: 404 });
    }

    // Check if there's already a pending request between these users
    const existingRequest = await LandIntegration.findOne({
      $or: [
        { requestingUser: requestingUserId, targetUser: targetUserId },
        { requestingUser: targetUserId, targetUser: requestingUserId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Integration request already exists with this farmer' }, { status: 400 });
    }

    // Calculate contribution ratios based on land sizes
    const requestingSize = requestingLand.landData?.landSizeInAcres || 0;
    const targetSize = targetLand.landData?.landSizeInAcres || 0;
    const totalSize = requestingSize + targetSize;

    const requestingRatio = totalSize > 0 ? (requestingSize / totalSize) * 100 : 50;
    const targetRatio = totalSize > 0 ? (targetSize / totalSize) * 100 : 50;

    // Create integrated coordinates (combine both land polygons)
    const integrationCoordinates = {
      vertices: [
        ...(requestingLand.landData?.vertices || []),
        ...(targetLand.landData?.vertices || [])
      ],
      centroidLatitude: ((requestingLand.landData?.centroidLatitude || 0) + (targetLand.landData?.centroidLatitude || 0)) / 2,
      centroidLongitude: ((requestingLand.landData?.centroidLongitude || 0) + (targetLand.landData?.centroidLongitude || 0)) / 2
    };

    // Create integration request
    const integrationRequest = new LandIntegration({
      requestingUser: new ObjectId(requestingUserId),
      targetUser: new ObjectId(targetUserId),
      status: 'pending',
      requestDate: new Date(),
      integrationPeriod: {
        startDate: new Date(integrationPeriod.startDate),
        endDate: new Date(integrationPeriod.endDate)
      },
      landDetails: {
        requestingUser: {
          landId: requestingLand._id,
          sizeInAcres: requestingSize,
          contributionRatio: requestingRatio,
          centroidLatitude: requestingLand.landData?.centroidLatitude || 0,
          centroidLongitude: requestingLand.landData?.centroidLongitude || 0
        },
        targetUser: {
          landId: targetLand._id,
          sizeInAcres: targetSize,
          contributionRatio: targetRatio,
          centroidLatitude: targetLand.landData?.centroidLatitude || 0,
          centroidLongitude: targetLand.landData?.centroidLongitude || 0
        },
        totalIntegratedSize: totalSize,
        integrationCoordinates
      },
      financialAgreement: {
        requestingUserContribution: requestingRatio,
        targetUserContribution: targetRatio,
        profitSharingRatio: {
          requestingUser: requestingRatio,
          targetUser: targetRatio
        }
      }
    });

    await integrationRequest.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Integration request sent successfully',
      requestId: integrationRequest._id
    });

  } catch (error) {
    console.error('Error creating integration request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
