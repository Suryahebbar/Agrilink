import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LandIntegration } from '../../../../../lib/models/LandIntegration';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { getUserFromRequest } from '../../../../../lib/auth';
import { Types } from 'mongoose';

interface IntegrationWithDetails extends Omit<InstanceType<typeof LandIntegration>, 'requestingUser' | 'targetUser'> {
  requestingUser: Types.ObjectId | string;
  targetUser: Types.ObjectId | string;
}

interface AgreementDetails {
  agreementId: Types.ObjectId;
  otherUserName: string;
  otherUserContact: string;
  executionDate: Date;
  totalLandSize: number;
  yourLandSize: number;
  yourContribution: number;
  signatures?: Array<{
    userName: string;
    signedAt: Date;
  }>;
}

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth || auth.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.sub;

    await connectDB();

    // Find all completed integration requests involving this user
    const completedIntegrations = await LandIntegration.find({
      $or: [
        { requestingUser: userId },
        { targetUser: userId }
      ],
      status: 'completed'
    }).sort({ executionDate: -1 });

    // Get farmer profiles for all other parties
    const agreements = await Promise.all(
      completedIntegrations.map(async (integration: IntegrationWithDetails) => {
        const otherUserId = integration.requestingUser.toString() === userId 
          ? integration.targetUser.toString() 
          : integration.requestingUser.toString();

        const otherProfile = await FarmerProfile.findOne({ userId: otherUserId });
        const isRequestingUser = integration.requestingUser.toString() === userId;

        return {
          agreementId: integration._id,
          otherUserName: otherProfile?.verifiedName || otherProfile?.aadhaarKannadaName || 'Unknown Farmer',
          otherUserContact: otherProfile?.contactNumber || '',
          executionDate: integration.executionDate,
          totalLandSize: integration.landDetails.totalIntegratedSize,
          yourLandSize: isRequestingUser 
            ? integration.landDetails.requestingUser.sizeInAcres 
            : integration.landDetails.targetUser.sizeInAcres,
          yourContribution: isRequestingUser 
            ? integration.landDetails.requestingUser.contributionRatio 
            : integration.landDetails.targetUser.contributionRatio,
          signatures: integration.signatures?.map((sig: { userName: string; signedAt: Date }) => ({
            userName: sig.userName,
            signedAt: sig.signedAt
          })) || [],
          canDownload: true
        };
      })
    );

    return NextResponse.json({
      success: true,
      agreements
    });

  } catch (error) {
    console.error('Error fetching completed agreements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
