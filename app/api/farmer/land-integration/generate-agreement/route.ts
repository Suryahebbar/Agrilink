import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LandIntegration } from '../../../../../lib/models/LandIntegration';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { LandDetails } from '../../../../../lib/models/LandDetails';
import { getUserFromRequest } from '../../../../../lib/auth';
import { DigitizedPlot } from '../../../../../lib/models/DigitizedPlot';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const body = await request.json();
    const { requestId, userId: bodyUserId } = body;

    if (!userId) userId = bodyUserId;

    if (!userId) {
      const auth = await getUserFromRequest(request);
      if (auth && auth.role === 'farmer') {
        userId = auth.sub;
      }
    }

    await connectDB();

    // Find the integration request
    const integrationRequest = await LandIntegration.findById(requestId);
    if (!integrationRequest) {
      return NextResponse.json({ error: 'Integration request not found' }, { status: 404 });
    }

    // Verify the user is part of this integration (if userId is available)
    if (userId && 
        integrationRequest.requestingUser.toString() !== String(userId) && 
        integrationRequest.targetUser.toString() !== String(userId)) {
      console.warn(`User ${userId} requested agreement for request ${requestId} but is not primary party. Allowing view for demonstration.`);
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

    const requestingSurveyNo = requestingProfile?.landParcelIdentity || requestingLand?.rtcDetails?.surveyNumber;
    const targetSurveyNo = targetProfile?.landParcelIdentity || targetLand?.rtcDetails?.surveyNumber;

    let requestingPlot = null;
    let targetPlot = null;

    if (requestingSurveyNo && requestingSurveyNo !== 'N/A') {
      requestingPlot = await DigitizedPlot.findOne({
        'administrative.survey': requestingSurveyNo
      });
    }
    if (!requestingPlot) {
      const namePattern = requestingProfile?.verifiedName || requestingProfile?.aadhaarKannadaName;
      if (namePattern) {
        requestingPlot = await DigitizedPlot.findOne({
          'owner.name': new RegExp(namePattern.trim(), 'i')
        });
      }
    }

    if (targetSurveyNo && targetSurveyNo !== 'N/A') {
      targetPlot = await DigitizedPlot.findOne({
        'administrative.survey': targetSurveyNo
      });
    }
    if (!targetPlot) {
      const namePattern = targetProfile?.verifiedName || targetProfile?.aadhaarKannadaName;
      if (namePattern) {
        targetPlot = await DigitizedPlot.findOne({
          'owner.name': new RegExp(namePattern.trim(), 'i')
        });
      }
    }

    // Generate agreement content
    const agreementContent = generateAgreementContent(
      integrationRequest,
      requestingProfile,
      targetProfile,
      requestingLand,
      targetLand,
      requestingPlot,
      targetPlot
    );

    return NextResponse.json({
      success: true,
      agreementContent,
      agreementData: {
        requestId: integrationRequest._id,
        farmer1: {
          name: requestingProfile?.verifiedName || requestingProfile?.aadhaarKannadaName || 'Farmer 1',
          aadhaar: extractAadhaarNumber(
            requestingProfile?.documents?.aadhaar?.extractedText || 
            requestingProfile?.aadharOcrText
          ),
          surveyNo: requestingProfile?.landParcelIdentity || 
                   requestingLand?.rtcDetails?.surveyNumber || 
                   '_________________',
          landSize: integrationRequest.landDetails.requestingUser.sizeInAcres
        },
        farmer2: {
          name: targetProfile?.verifiedName || targetProfile?.aadhaarKannadaName || 'Farmer 2',
          aadhaar: extractAadhaarNumber(
            targetProfile?.documents?.aadhaar?.extractedText || 
            targetProfile?.aadharOcrText
          ),
          surveyNo: targetProfile?.landParcelIdentity || 
                   targetLand?.rtcDetails?.surveyNumber || 
                   '_________________',
          landSize: integrationRequest.landDetails.targetUser.sizeInAcres
        },
        totalLandSize: integrationRequest.landDetails.totalIntegratedSize,
        integrationPeriod: integrationRequest.integrationPeriod,
        profitSharing: integrationRequest.financialAgreement.profitSharingRatio
      }
    });

  } catch (error) {
    console.error('Error generating agreement:', error);
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
  targetLand: any,
  requestingPlot?: any,
  targetPlot?: any
): string {
  const farmer1Name = requestingProfile?.verifiedName || requestingProfile?.aadhaarKannadaName || 'Farmer 1';
  const farmer2Name = targetProfile?.verifiedName || targetProfile?.aadhaarKannadaName || 'Farmer 2';
  
  // Extract Aadhaar from OCR text
  const farmer1Aadhaar = extractAadhaarNumber(
    requestingProfile?.documents?.aadhaar?.extractedText || 
    requestingProfile?.aadharOcrText
  );
  const farmer2Aadhaar = extractAadhaarNumber(
    targetProfile?.documents?.aadhaar?.extractedText || 
    targetProfile?.aadharOcrText
  );
  
  // Extract survey number from farmer profile (landParcelIdentity) or RTC details
  const farmer1SurveyNo = requestingProfile?.landParcelIdentity || 
                         requestingLand?.rtcDetails?.surveyNumber || 
                         '_________________';
  const farmer2SurveyNo = targetProfile?.landParcelIdentity || 
                         targetLand?.rtcDetails?.surveyNumber || 
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

  // Format GIS details helper
  const getGisDetailsString = (plot: any, survey: string) => {
    if (!plot) return `GIS boundary data pending/not available for Survey No: ${survey}.`;
    
    const centroidVal = plot.gis?.latitude && plot.gis?.longitude
      ? `${plot.gis.latitude.toFixed(6)}, ${plot.gis.longitude.toFixed(6)}`
      : 'N/A';
    const areaVal = plot.gis?.area ? `${plot.gis.area.toFixed(2)} Acres` : 'N/A';
    const perimeterVal = plot.gis?.perimeter ? `${plot.gis.perimeter.toFixed(1)} meters` : 'N/A';
    const sidesVal = plot.gis?.side_lengths && plot.gis.side_lengths.length > 0
      ? plot.gis.side_lengths.map((len: number) => `${len.toFixed(1)}m`).join(', ')
      : 'N/A';

    let verticesText = 'N/A';
    if (plot.gis?.geojson_geom?.coordinates?.[0]) {
      verticesText = plot.gis.geojson_geom.coordinates[0].map((coord: number[], idx: number) => {
        return `V${idx + 1}: (${coord[1].toFixed(6)}, ${coord[0].toFixed(6)})`;
      }).join(' -> ');
    }

    return `
    • Centroid Coordinates (Lat, Long): ${centroidVal}
    • Digitized Area: ${areaVal} | Perimeter: ${perimeterVal}
    • Dimensions (Side Lengths): ${sidesVal}
    • Boundary Vertices (Lat, Long):
      ${verticesText}
    `.trim();
  };

  const farmer1GisDetails = getGisDetailsString(requestingPlot, farmer1SurveyNo);
  const farmer2GisDetails = getGisDetailsString(targetPlot, farmer2SurveyNo);

  return `
SMART LAND INTEGRATION AGREEMENT

This Smart Land Integration Agreement is executed on this ${currentDay} day of ${currentMonth}, ${currentYear}, between the undersigned farmers (collectively referred to as the Integrated Farmer Group) who voluntarily agree to integrate their agricultural lands for joint cultivation and shared economic benefit. Each farmer declares that he or she is the lawful owner or authorized cultivator of the land described below and consents to its integration for the duration of this agreement.

Farmer 1: ${farmer1Name}, Aadhaar/ID: ${farmer1Aadhaar}, Land Survey No(s): ${farmer1SurveyNo}, Land Size: ${farmer1LandSize.toFixed(2)} acres.
Farmer 2: ${farmer2Name}, Aadhaar/ID: ${farmer2Aadhaar}, Land Survey No(s): ${farmer2SurveyNo}, Land Size: ${farmer2LandSize.toFixed(2)} acres.

LAND PARCEL BOUNDARY AND DIMENSION SPECIFICATIONS (OFFICIAL REGISTRY GIS DATA):
--------------------------------------------------------------------------------
Farmer 1 (Survey No: ${farmer1SurveyNo}) GIS Polygon:
${farmer1GisDetails}

Farmer 2 (Survey No: ${farmer2SurveyNo}) GIS Polygon:
${farmer2GisDetails}
--------------------------------------------------------------------------------

The purpose of this agreement is to integrate the above lands into a single operational unit for cultivation, production, and related agricultural activities, with all records maintained digitally through the AgriLink platform. The total integrated land area shall be ${totalLandSize.toFixed(2)} acres. All participating farmers agree that this collaboration is voluntary, transparent, and digitally verifiable.

The agreement shall remain valid for a period of ${Math.ceil((new Date(integrationRequest.integrationPeriod.endDate).getTime() - new Date(integrationRequest.integrationPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months, commencing on ${startDate} and ending on ${endDate}, unless mutually renewed or terminated earlier under conditions described herein. During the term of this agreement, the integrated land will be cultivated collectively, and all input costs, labour contributions, crop management responsibilities, and operational decisions shall be carried out through mutual consent and digitally recorded on the blockchain system for transparency and auditability.

Profits arising from agricultural produce, government benefits, subsidies, insurance settlements, or any other financial gains shall be shared among the farmers in accordance with the sharing model agreed upon at the time of signing: in proportion to each farmer's land contribution. Farmer 1 shall receive ${integrationRequest.financialAgreement.profitSharingRatio.requestingUser.toFixed(1)}% and Farmer 2 shall receive ${integrationRequest.financialAgreement.profitSharingRatio.targetUser.toFixed(1)}% of all profits. The selected profit-sharing method shall be final and binding for the duration of this agreement unless amended mutually by all parties and digitally countersigned.

In the event of crop loss or natural disaster affecting the integrated land, any compensation or relief received from government agencies, insurance providers, or other bodies shall be distributed among the farmers based on the same profit-sharing arrangement adopted for the season. Each farmer acknowledges that all financial entries, resource contributions, and operational logs maintained by the AgriLink platform constitute valid evidence of activity and participation.

The Admin of the AgriLink platform shall act solely as a technological facilitator, providing identity verification, land record validation, smart-contract execution, and secure blockchain storage. The Admin shall not claim ownership over any land nor hold responsibility for disputes arising between farmers beyond matters recorded digitally on the platform. The Admin reserves the right to suspend or nullify this agreement on grounds of fraud, data manipulation, or violation of platform policies.

This agreement may be terminated through mutual consent of all farmers, expiry of the agreed term, or due to misconduct or breach by any party. Upon termination, each farmer's land shall revert to independent control, and all pending financial settlements must be completed within 30 days based on the ledger entries maintained during the period of collaboration. All blockchain records shall remain permanently stored as part of the project's digital ledger.

Any disputes arising from this agreement that cannot be resolved mutually shall first undergo mediation facilitated by the Admin, and if still unresolved, shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996, with jurisdiction falling under the courts of Bangalore District.

By signing below, each farmer confirms that the information provided is true, that they understand the terms of land integration, profit sharing, responsibilities, and duration, and that they voluntarily enter into this agreement. The Admin signs as a validating authority and digital witness for the purpose of smart-contract execution.

Agreement ID: ${integrationRequest._id}
Generated on: ${formattedDate}
  `.trim();
}
