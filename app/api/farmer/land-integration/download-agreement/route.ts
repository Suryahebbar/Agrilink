import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LandIntegration } from '../../../../../lib/models/LandIntegration';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { LandDetails } from '../../../../../lib/models/LandDetails';
import { getUserFromRequest } from '../../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth || auth.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const userId = auth.sub;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    await connectDB();

    // Find the integration request
    const integrationRequest = await LandIntegration.findById(requestId);
    if (!integrationRequest) {
      return NextResponse.json({ error: 'Integration request not found' }, { status: 404 });
    }

    // Verify the user is part of this integration
    if (integrationRequest.requestingUser.toString() !== userId && 
        integrationRequest.targetUser.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if agreement is fully executed
    if (integrationRequest.status !== 'completed') {
      return NextResponse.json({ error: 'Agreement not fully executed' }, { status: 400 });
    }

    // Get farmer profiles for both parties
    const [requestingProfile, targetProfile] = await Promise.all([
      FarmerProfile.findOne({ userId: integrationRequest.requestingUser.toString() }),
      FarmerProfile.findOne({ userId: integrationRequest.targetUser.toString() })
    ]);

    // Get land details for both parties
    const [requestingLand, targetLand] = await Promise.all([
      LandDetails.findOne({ userId: integrationRequest.requestingUser.toString() }),
      LandDetails.findOne({ userId: integrationRequest.targetUser.toString() })
    ]);

    // Generate agreement content
    const agreementContent = generateAgreementContent(
      integrationRequest,
      requestingProfile,
      targetProfile,
      requestingLand,
      targetLand
    );

    // Return agreement as downloadable text file
    return new NextResponse(agreementContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="land-integration-agreement-${integrationRequest._id}.txt"`
      }
    });

  } catch (error) {
    console.error('Error downloading agreement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function extractAadhaarNumber(aadhaarText?: string): string {
  if (!aadhaarText) return '_________________';
  
  // Look for Aadhaar pattern (12 digits)
  const aadhaarMatch = aadhaarText.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
  if (aadhaarMatch) {
    return aadhaarMatch[0].replace(/\s/g, '');
  }
  
  // Alternative pattern search
  const altMatch = aadhaarText.match(/(\d{12}|\d{4}-\d{4}-\d{4}|\d{4}\s\d{4}\s\d{4})/);
  if (altMatch) {
    return altMatch[0].replace(/[-\s]/g, '');
  }
  
  return '_________________';
}

function generateAgreementContent(
  integrationRequest: any,
  requestingProfile: any,
  targetProfile: any,
  requestingLand: any,
  targetLand: any
): string {
  const farmer1Name = requestingProfile?.verifiedName || requestingProfile?.aadhaarKannadaName || 'Farmer 1';
  const farmer2Name = targetProfile?.verifiedName || targetProfile?.aadhaarKannadaName || 'Farmer 2';
  
  // Extract Aadhaar from OCR text
  const farmer1Aadhaar = extractAadhaarNumber(
    requestingProfile?.documents?.aadhaar?.extractedText || 
    requestingProfile?.aadharOcrText || 
    requestingProfile?.aadhaarNumber
  );
  const farmer2Aadhaar = extractAadhaarNumber(
    targetProfile?.documents?.aadhaar?.extractedText || 
    targetProfile?.aadharOcrText || 
    targetProfile?.aadhaarNumber
  );
  
  // Extract survey number from farmer profile (landParcelIdentity) or RTC details
  const farmer1SurveyNo = requestingProfile?.landParcelIdentity || 
                         requestingLand?.rtcDetails?.surveyNumber || 
                         requestingLand?.surveyNumber || 
                         '_________________';
  const farmer2SurveyNo = targetProfile?.landParcelIdentity || 
                         targetLand?.rtcDetails?.surveyNumber || 
                         targetLand?.surveyNumber || 
                         '_________________';
  
  const farmer1LandSize = integrationRequest.landDetails.requestingUser.sizeInAcres;
  const farmer2LandSize = integrationRequest.landDetails.targetUser.sizeInAcres;
  const totalLandSize = integrationRequest.landDetails.totalIntegratedSize;
  
  const startDate = new Date(integrationRequest.integrationPeriod.startDate).toLocaleDateString();
  const endDate = new Date(integrationRequest.integrationPeriod.endDate).toLocaleDateString();
  
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const formattedDate = currentDate.toLocaleDateString();

  // Get signature information
  const farmer1Signature = integrationRequest.signatures?.find((sig: any) => sig.userId === integrationRequest.requestingUser.toString());
  const farmer2Signature = integrationRequest.signatures?.find((sig: any) => sig.userId === integrationRequest.targetUser.toString());

  return `
SMART LAND INTEGRATION AGREEMENT

This Smart Land Integration Agreement is executed on this ${currentDay} day of ${currentMonth}, ${currentYear}, between the undersigned farmers (collectively referred to as the Integrated Farmer Group) who voluntarily agree to integrate their agricultural lands for joint cultivation and shared economic benefit. Each farmer declares that he or she is the lawful owner or authorized cultivator of the land described below and consents to its integration for the duration of this agreement.

Farmer 1: ${farmer1Name}, Aadhaar/ID: ${farmer1Aadhaar}, Land Survey No(s): ${farmer1SurveyNo}, Land Size: ${farmer1LandSize.toFixed(2)} acres.
Farmer 2: ${farmer2Name}, Aadhaar/ID: ${farmer2Aadhaar}, Land Survey No(s): ${farmer2SurveyNo}, Land Size: ${farmer2LandSize.toFixed(2)} acres.

The purpose of this agreement is to integrate the above lands into a single operational unit for cultivation, production, and related agricultural activities, with all records maintained digitally through the AgriLink platform. The total integrated land area shall be ${totalLandSize.toFixed(2)} acres. All participating farmers agree that this collaboration is voluntary, transparent, and digitally verifiable.

The agreement shall remain valid for a period of ${Math.ceil((new Date(integrationRequest.integrationPeriod.endDate).getTime() - new Date(integrationRequest.integrationPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months, commencing on ${startDate} and ending on ${endDate}, unless mutually renewed or terminated earlier under conditions described herein. During the term of this agreement, the integrated land will be cultivated collectively, and all input costs, labour contributions, crop management responsibilities, and operational decisions shall be carried out through mutual consent and digitally recorded on the blockchain system for transparency and auditability.

Profits arising from agricultural produce, government benefits, subsidies, insurance settlements, or any other financial gains shall be shared among the farmers in accordance with the sharing model agreed upon at the time of signing: in proportion to each farmer's land contribution. Farmer 1 shall receive ${integrationRequest.financialAgreement.profitSharingRatio.requestingUser.toFixed(1)}% and Farmer 2 shall receive ${integrationRequest.financialAgreement.profitSharingRatio.targetUser.toFixed(1)}% of all profits. The selected profit-sharing method shall be final and binding for the duration of this agreement unless amended mutually by all parties and digitally countersigned.

In the event of crop loss or natural disaster affecting the integrated land, any compensation or relief received from government agencies, insurance providers, or other bodies shall be distributed among the farmers based on the same profit-sharing arrangement adopted for the season. Each farmer acknowledges that all financial entries, resource contributions, and operational logs maintained by the AgriLink platform constitute valid evidence of activity and participation.

The Admin of the AgriLink platform shall act solely as a technological facilitator, providing identity verification, land record validation, smart-contract execution, and secure blockchain storage. The Admin shall not claim ownership over any land nor hold responsibility for disputes arising between farmers beyond matters recorded digitally on the platform. The Admin reserves the right to suspend or nullify this agreement on grounds of fraud, data manipulation, or violation of platform policies.

This agreement may be terminated through mutual consent of all farmers, expiry of the agreed term, or due to misconduct or breach by any party. Upon termination, each farmer's land shall revert to independent control, and all pending financial settlements must be completed within 30 days based on the ledger entries maintained during the period of collaboration. All blockchain records shall remain permanently stored as part of the project's digital ledger.

Any disputes arising from this agreement that cannot be resolved mutually shall first undergo mediation facilitated by the Admin, and if still unresolved, shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996, with jurisdiction falling under the courts of Bangalore District.

By signing below, each farmer confirms that the information provided is true, that they understand the terms of land integration, profit sharing, responsibilities, and duration, and that they voluntarily enter into this agreement. The Admin signs as a validating authority and digital witness for the purpose of smart-contract execution.

DIGITAL SIGNATURES:
${farmer1Name} - Signed on: ${farmer1Signature ? new Date(farmer1Signature.signedAt).toLocaleDateString() : 'Not signed'}
${farmer2Name} - Signed on: ${farmer2Signature ? new Date(farmer2Signature.signedAt).toLocaleDateString() : 'Not signed'}

Agreement ID: ${integrationRequest._id}
Generated on: ${formattedDate}
Status: FULLY EXECUTED - Both parties have digitally signed this agreement

This agreement is legally binding and has been stored securely on the blockchain for verification purposes.
  `.trim();
}
