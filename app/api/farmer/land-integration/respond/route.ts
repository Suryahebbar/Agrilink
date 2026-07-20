import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LandIntegration } from '../../../../../lib/models/LandIntegration';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { getUserFromRequest } from '../../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth || auth.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action } = await request.json();
    const userId = auth.sub;

    console.log('Integration request response:', { requestId, action, userId });

    await connectDB();

    // Find the integration request
    const integrationRequest = await LandIntegration.findById(requestId);
    console.log('Found integration request:', integrationRequest);
    
    if (!integrationRequest) {
      console.log('Integration request not found for ID:', requestId);
      return NextResponse.json({ error: 'Integration request not found' }, { status: 404 });
    }

    // Verify the user is the target of this request
    if (integrationRequest.targetUser.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized to respond to this request' }, { status: 403 });
    }

    // Update request status
    integrationRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    integrationRequest.responseDate = new Date();
    await integrationRequest.save();

    // Get user profiles for notification
    const [requestingProfile, targetProfile] = await Promise.all([
      FarmerProfile.findOne({ userId: integrationRequest.requestingUser.toString() }),
      FarmerProfile.findOne({ userId: integrationRequest.targetUser.toString() })
    ]);

    if (action === 'accept') {
      // Generate agreement document (simplified for now)
      const agreementContent = generateAgreementDocument(integrationRequest, requestingProfile, targetProfile);
      
      // Update with agreement document path (in real implementation, save as PDF)
      integrationRequest.agreementDocument = `/agreements/${integrationRequest._id}.pdf`;
      await integrationRequest.save();

      // Mark both farmers as not ready to integrate (since they're now integrated)
      await FarmerProfile.updateMany(
        { 
          userId: { 
            $in: [
              integrationRequest.requestingUser.toString(),
              integrationRequest.targetUser.toString()
            ] 
          } 
        },
        { 
          $set: { 
            readyToIntegrate: false,
            readyToIntegrateDate: null
          } 
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Integration accepted. Agreement generated successfully.',
        agreementDocument: integrationRequest.agreementDocument
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'Integration request rejected' 
      });
    }

  } catch (error) {
    console.error('Error responding to integration request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateAgreementDocument(request: any, requestingProfile: any, targetProfile: any): string {
  const requestingName = requestingProfile?.verifiedName || requestingProfile?.aadhaarKannadaName || 'Farmer';
  const targetName = targetProfile?.verifiedName || targetProfile?.aadhaarKannadaName || 'Farmer';
  
  return `
LAND INTEGRATION AGREEMENT

This agreement is made on ${new Date().toLocaleDateString()} between:

PARTY A: ${requestingName}
- Land Size: ${request.landDetails.requestingUser.sizeInAcres.toFixed(2)} acres
- Contribution Ratio: ${request.landDetails.requestingUser.contributionRatio.toFixed(1)}%

PARTY B: ${targetName}
- Land Size: ${request.landDetails.targetUser.sizeInAcres.toFixed(2)} acres  
- Contribution Ratio: ${request.landDetails.targetUser.contributionRatio.toFixed(1)}%

INTEGRATION DETAILS:
- Total Integrated Land: ${request.landDetails.totalIntegratedSize.toFixed(2)} acres
- Integration Period: ${request.integrationPeriod.startDate.toLocaleDateString()} to ${request.integrationPeriod.endDate.toLocaleDateString()}
- Financial Contribution Ratio: ${request.financialAgreement.profitSharingRatio.requestingUser.toFixed(1)}% / ${request.financialAgreement.profitSharingRatio.targetUser.toFixed(1)}%
- Profit Sharing Ratio: Same as contribution ratio

TERMS AND CONDITIONS:
1. Both parties agree to integrate their agricultural lands for the specified period.
2. All investments and profits will be shared according to the agreed ratios.
3. Either party may terminate this agreement with 30 days notice.
4. Disputes will be resolved through mutual discussion or legal mediation.

SIGNATURES:
Party A: ________________________ Date: ___________
Party B: ________________________ Date: ___________
  `.trim();
}
