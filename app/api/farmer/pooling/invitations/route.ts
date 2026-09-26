import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPoolingInvitation } from '@/lib/models/FarmPoolingInvitation';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandIntegration } from '@/lib/models/LandIntegration';
import { LandDetails } from '@/lib/models/LandDetails';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        userId = auth.sub;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const received = await FarmPoolingInvitation.find({ receiverId: userId }).sort({ createdAt: -1 });
    const sent = await FarmPoolingInvitation.find({ senderId: userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      received,
      sent
    });
  } catch (error: any) {
    console.error('Error fetching pooling invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let senderId = searchParams.get('userId');
    const { targetUserId, targetUserName, userId: bodyUserId } = await request.json();

    if (!senderId) senderId = bodyUserId;

    if (!senderId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        senderId = auth.sub;
      }
    }

    if (!senderId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!targetUserId || !targetUserName) {
      return NextResponse.json({ error: 'Target user details required' }, { status: 400 });
    }

    await connectDB();

    // Fetch sender profile for name
    const senderProfile = await FarmerProfile.findOne({ $or: [{ user: senderId }, { userId: senderId }] });
    const senderName = senderProfile?.verifiedName || senderProfile?.aadhaarKannadaName || `Farmer ${String(senderId).slice(-6)}`;

    // Check if there is already a pending or accepted invitation between these two
    const existing = await FarmPoolingInvitation.findOne({
      $or: [
        { senderId: String(senderId), receiverId: String(targetUserId) },
        { senderId: String(targetUserId), receiverId: String(senderId) }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (existing) {
      return NextResponse.json({ error: 'An invitation is already active or pending between you' }, { status: 400 });
    }

    // Try to find or prepare LandIntegration record as well
    const senderLand = await LandDetails.findOne({ $or: [{ user: senderId }, { userId: senderId }] });
    const targetLand = await LandDetails.findOne({ $or: [{ user: targetUserId }, { userId: targetUserId }] });

    let integrationRequestId: string | undefined;

    if (senderLand && targetLand) {
      try {
        const senderObjId = mongoose.Types.ObjectId.isValid(senderId) ? new mongoose.Types.ObjectId(senderId) : new mongoose.Types.ObjectId();
        const targetObjId = mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : new mongoose.Types.ObjectId();

        const requestingSize = senderLand.landData?.landSizeInAcres || 2.5;
        const targetSize = targetLand.landData?.landSizeInAcres || 2.5;
        const totalSize = requestingSize + targetSize;
        const requestingRatio = totalSize > 0 ? (requestingSize / totalSize) * 100 : 50;
        const targetRatio = totalSize > 0 ? (targetSize / totalSize) * 100 : 50;

        const landInt = new LandIntegration({
          requestingUser: senderObjId,
          targetUser: targetObjId,
          status: 'pending',
          requestDate: new Date(),
          integrationPeriod: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          },
          landDetails: {
            requestingUser: {
              landId: senderLand._id,
              sizeInAcres: requestingSize,
              contributionRatio: requestingRatio,
              centroidLatitude: senderLand.landData?.centroidLatitude || 12.9716,
              centroidLongitude: senderLand.landData?.centroidLongitude || 77.5946
            },
            targetUser: {
              landId: targetLand._id,
              sizeInAcres: targetSize,
              contributionRatio: targetRatio,
              centroidLatitude: targetLand.landData?.centroidLatitude || 12.9720,
              centroidLongitude: targetLand.landData?.centroidLongitude || 77.5950
            },
            totalIntegratedSize: totalSize,
            integrationCoordinates: {
              vertices: [],
              centroidLatitude: 12.9718,
              centroidLongitude: 77.5948
            }
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
        await landInt.save();
        integrationRequestId = landInt._id.toString();
      } catch (err) {
        console.error('Non-critical: Failed to pre-create LandIntegration object:', err);
      }
    }

    const invitation = new FarmPoolingInvitation({
      senderId: String(senderId),
      senderName,
      receiverId: String(targetUserId),
      receiverName: targetUserName,
      status: 'pending',
      integrationRequestId
    });

    await invitation.save();

    return NextResponse.json({
      success: true,
      invitation
    });
  } catch (error: any) {
    console.error('Error sending pooling invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const { invitationId, action, userId: bodyUserId } = await request.json();

    if (!userId) userId = bodyUserId;

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        userId = auth.sub;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!invitationId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await connectDB();

    const invitation = await FarmPoolingInvitation.findOne({
      _id: invitationId,
      receiverId: String(userId)
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or unauthorized' }, { status: 404 });
    }

    invitation.status = action === 'accept' ? 'accepted' : 'rejected';

    if (action === 'reject') {
      if (invitation.integrationRequestId) {
        try {
          await LandIntegration.findByIdAndDelete(invitation.integrationRequestId);
        } catch (e) {
          console.error('Clean integration error:', e);
        }
      }
      try {
        const { FarmPool } = await import('@/lib/models/FarmPool');
        await FarmPool.deleteMany({
          'participants.userId': { $all: [invitation.senderId, invitation.receiverId] }
        });
      } catch (poolErr) {
        console.error('Clean pool error:', poolErr);
      }
      // Reset readyToIntegrate flag for profiles
      await FarmerProfile.updateMany(
        { $or: [{ userId: { $in: [invitation.senderId, invitation.receiverId] } }, { user: { $in: [invitation.senderId, invitation.receiverId] } }] },
        { $set: { readyToIntegrate: false } }
      );
    }

    if (action === 'accept') {
      const senderLand = await LandDetails.findOne({ $or: [{ user: invitation.senderId }, { userId: invitation.senderId }] });
      const receiverLand = await LandDetails.findOne({ $or: [{ user: invitation.receiverId }, { userId: invitation.receiverId }] });

      // Check if LandIntegration object exists or create it now
      let landInt;
      if (invitation.integrationRequestId) {
        landInt = await LandIntegration.findById(invitation.integrationRequestId);
      }

      if (!landInt) {

        const requestingSize = senderLand?.landData?.landSizeInAcres || 2.5;
        const targetSize = receiverLand?.landData?.landSizeInAcres || 2.5;
        const totalSize = requestingSize + targetSize;
        const requestingRatio = totalSize > 0 ? (requestingSize / totalSize) * 100 : 50;
        const targetRatio = totalSize > 0 ? (targetSize / totalSize) * 100 : 50;

        const senderObjId = mongoose.Types.ObjectId.isValid(invitation.senderId) ? new mongoose.Types.ObjectId(invitation.senderId) : new mongoose.Types.ObjectId();
        const receiverObjId = mongoose.Types.ObjectId.isValid(invitation.receiverId) ? new mongoose.Types.ObjectId(invitation.receiverId) : new mongoose.Types.ObjectId();
        const senderLandId = senderLand?._id || new mongoose.Types.ObjectId();
        const receiverLandId = receiverLand?._id || new mongoose.Types.ObjectId();

        landInt = new LandIntegration({
          requestingUser: senderObjId,
          targetUser: receiverObjId,
          status: 'accepted',
          requestDate: new Date(),
          responseDate: new Date(),
          integrationPeriod: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          },
          landDetails: {
            requestingUser: {
              landId: senderLandId,
              sizeInAcres: requestingSize,
              contributionRatio: requestingRatio,
              centroidLatitude: senderLand?.landData?.centroidLatitude || 12.9716,
              centroidLongitude: senderLand?.landData?.centroidLongitude || 77.5946
            },
            targetUser: {
              landId: receiverLandId,
              sizeInAcres: targetSize,
              contributionRatio: targetRatio,
              centroidLatitude: receiverLand?.landData?.centroidLatitude || 12.9720,
              centroidLongitude: receiverLand?.landData?.centroidLongitude || 77.5950
            },
            totalIntegratedSize: totalSize,
            integrationCoordinates: {
              vertices: [],
              centroidLatitude: 12.9718,
              centroidLongitude: 77.5948
            }
          },
          financialAgreement: {
            requestingUserContribution: requestingRatio,
            targetUserContribution: targetRatio,
            profitSharingRatio: {
              requestingUser: requestingRatio,
              targetUser: targetRatio
            }
          },
          agreementDocument: `/agreements/${new mongoose.Types.ObjectId()}.pdf`
        });
      } else {
        landInt.status = 'accepted';
        landInt.responseDate = new Date();
      }

      await landInt.save();
      invitation.integrationRequestId = landInt._id.toString();

      // Mark both profiles as actively participating in pooling
      await FarmerProfile.updateMany(
        { $or: [{ userId: { $in: [invitation.senderId, invitation.receiverId] } }, { user: { $in: [invitation.senderId, invitation.receiverId] } }] },
        { $set: { readyToIntegrate: true } }
      );

      // Create new FarmPool record awaiting counselor assignment
      try {
        const { FarmPool } = await import('@/lib/models/FarmPool');
        const senderProfile = await FarmerProfile.findOne({ $or: [{ user: invitation.senderId }, { userId: invitation.senderId }] });
        const receiverProfile = await FarmerProfile.findOne({ $or: [{ user: invitation.receiverId }, { userId: invitation.receiverId }] });
        
        await FarmPool.create({
          name: `${senderProfile?.verifiedName || invitation.senderName || 'Farmer'} & ${receiverProfile?.verifiedName || invitation.receiverName || 'Farmer'} Joint Pool`,
          status: 'awaiting_counselor',
          participants: [
            {
              userId: invitation.senderId,
              fullName: senderProfile?.verifiedName || invitation.senderName || 'Farmer A',
              phone: senderProfile?.contactNumber || 'N/A',
              address: senderProfile?.homeAddress || 'N/A',
              landId: senderLand?._id || new mongoose.Types.ObjectId(),
              landSize: senderLand?.landData?.landSizeInAcres || 2.5,
              surveyNumber: senderLand?.rtcDetails?.surveyNumber || senderLand?.landData?.surveyNumber || 'N/A',
              investmentContribution: 0,
              labourContribution: 0,
              machineryContribution: '',
              landContribution: senderLand?.landData?.landSizeInAcres || 2.5
            },
            {
              userId: invitation.receiverId,
              fullName: receiverProfile?.verifiedName || invitation.receiverName || 'Farmer B',
              phone: receiverProfile?.contactNumber || 'N/A',
              address: receiverProfile?.homeAddress || 'N/A',
              landId: receiverLand?._id || new mongoose.Types.ObjectId(),
              landSize: receiverLand?.landData?.landSizeInAcres || 2.5,
              surveyNumber: receiverLand?.rtcDetails?.surveyNumber || receiverLand?.landData?.surveyNumber || 'N/A',
              investmentContribution: 0,
              labourContribution: 0,
              machineryContribution: '',
              landContribution: receiverLand?.landData?.landSizeInAcres || 2.5
            }
          ]
        });
      } catch (poolErr) {
        console.error('Error creating FarmPool on invitation accept:', poolErr);
      }
    }

    await invitation.save();

    return NextResponse.json({
      success: true,
      invitation
    });
  } catch (error: any) {
    console.error('Error updating pooling invitation:', error);
    return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
  }
}

