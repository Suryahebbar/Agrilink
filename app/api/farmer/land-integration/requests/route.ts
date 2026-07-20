import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LandIntegration } from '../../../../../lib/models/LandIntegration';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { getUserFromRequest } from '../../../../../lib/auth';
import { Types } from 'mongoose';

interface IntegrationRequest {
  _id: Types.ObjectId;
  requestingUser: Types.ObjectId | string;
  targetUser: Types.ObjectId | string;
  status: string;
  requestDate: Date;
  responseDate?: Date;
  landDetails: any;
  financialAgreement: any;
  integrationPeriod: any;
  agreementDocument?: string;
}

interface FormattedRequest {
  _id: any;
  requestingUser: string;
  targetUser: string;
  status: string;
  requestDate: Date;
  responseDate?: Date;
  isRequestingUser: boolean;
  otherUserName: string;
  otherUserContact?: string;
  landDetails: any;
  financialAgreement: any;
  integrationPeriod: any;
  agreementDocument?: string;
}

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth || auth.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.sub;

    await connectDB();

    // Find all integration requests where this user is involved
    const requests = await LandIntegration.find({
      $or: [
        { requestingUser: userId },
        { targetUser: userId }
      ]
    }).sort({ requestDate: -1 });

    // Get user profiles for display names
    const userIds = requests.map((r: IntegrationRequest) => 
      r.requestingUser.toString() === userId ? r.targetUser : r.requestingUser
    );
    
    const profiles = await FarmerProfile.find({
      userId: { $in: userIds }
    });

    const profileMap = new Map<string, any>();
    profiles.forEach((p: any) => {
      profileMap.set(p.userId.toString(), {
        name: p.verifiedName || p.aadhaarKannadaName || `Farmer ${p.userId.slice(-6)}`,
        contactNumber: p.contactNumber
      });
    });

    // Format requests for frontend
    const formattedRequests = requests.map((request: any): FormattedRequest => {
      const isRequestingUser = request.requestingUser.toString() === userId;
      const otherUserId = isRequestingUser ? request.targetUser.toString() : request.requestingUser.toString();
      const otherUserProfile = profileMap.get(otherUserId);

      return {
        _id: request._id,
        requestingUser: request.requestingUser.toString(),
        targetUser: request.targetUser.toString(),
        status: request.status,
        requestDate: request.requestDate,
        responseDate: request.responseDate,
        isRequestingUser,
        otherUserName: otherUserProfile?.name || 'Unknown Farmer',
        otherUserContact: otherUserProfile?.contactNumber,
        landDetails: request.landDetails,
        financialAgreement: request.financialAgreement,
        integrationPeriod: request.integrationPeriod,
        agreementDocument: request.agreementDocument
      };
    });

    return NextResponse.json({ requests: formattedRequests });

  } catch (error) {
    console.error('Error fetching integration requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
