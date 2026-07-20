import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    const farmerId = '692d2035c0b46de538276a92';
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);
    
    // Fetch data exactly like the main API
    const [
      farmerProfileData,
      landDetailsData,
      landIntegrationSentData,
      landIntegrationReceivedData
    ] = await Promise.all([
      FarmerProfile.findOne({ $or: [{ user: farmerObjectId }, { userId: farmerId }] }),
      LandDetails.find({ $or: [{ user: farmerObjectId }, { userId: farmerId }] }).sort({ createdAt: -1 }),
      LandIntegration.find({ requestingUser: farmerObjectId })
        .populate('targetUser', 'name email')
        .populate('landDetails.requestingUser.landId', 'rtcDetails')
        .populate('landDetails.targetUser.landId', 'rtcDetails')
        .sort({ requestDate: -1 }),
      LandIntegration.find({ targetUser: farmerObjectId })
        .populate('requestingUser', 'name email')
        .populate('landDetails.requestingUser.landId', 'rtcDetails')
        .populate('landDetails.targetUser.landId', 'rtcDetails')
        .sort({ requestDate: -1 })
    ]);
    
    // Format data exactly like the main API
    const enhancedFarmer = {
      farmerProfile: farmerProfileData ? {
        _id: farmerProfileData._id,
        userId: farmerProfileData.userId,
        user: farmerProfileData.user,
        verifiedName: farmerProfileData.verifiedName,
        kannadaName: farmerProfileData.kannadaName,
        aadhaarKannadaName: farmerProfileData.aadhaarKannadaName,
        age: farmerProfileData.age,
        gender: farmerProfileData.gender,
        dob: farmerProfileData.dob,
        contactNumber: farmerProfileData.contactNumber,
        homeAddress: farmerProfileData.homeAddress,
        nameVerificationStatus: farmerProfileData.nameVerificationStatus,
        landParcelIdentity: farmerProfileData.landParcelIdentity,
        ownershipVerified: farmerProfileData.ownershipVerified,
        totalCultivableArea: farmerProfileData.totalCultivableArea,
        soilProperties: farmerProfileData.soilProperties,
        irrigationPotential: farmerProfileData.irrigationPotential,
        croppingHistory: farmerProfileData.croppingHistory,
        revenueObligations: farmerProfileData.revenueObligations,
        mutationTraceability: farmerProfileData.mutationTraceability,
        documents: farmerProfileData.documents,
        readyToIntegrate: farmerProfileData.readyToIntegrate,
        readyToIntegrateDate: farmerProfileData.readyToIntegrateDate,
        createdAt: farmerProfileData.createdAt,
        updatedAt: farmerProfileData.updatedAt
      } : null,
      landDetails: landDetailsData.map((land: any) => ({
        _id: land._id,
        sketchImage: land.sketchImage,
        landData: land.landData,
        rtcDetails: land.rtcDetails,
        processingStatus: land.processingStatus,
        processedAt: land.processedAt,
        createdAt: land.createdAt,
        updatedAt: land.updatedAt
      })),
      landIntegrations: {
        sent: landIntegrationSentData.map((integration: any) => ({
          _id: integration._id,
          targetUser: integration.targetUser,
          status: integration.status,
          requestDate: integration.requestDate,
          responseDate: integration.responseDate,
          integrationPeriod: integration.integrationPeriod,
          landDetails: integration.landDetails,
          financialAgreement: integration.financialAgreement,
          agreementDocument: integration.agreementDocument,
          signatures: integration.signatures,
          executionDate: integration.executionDate,
          blockchain: integration.blockchain,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        })),
        received: landIntegrationReceivedData.map((integration: any) => ({
          _id: integration._id,
          requestingUser: integration.requestingUser,
          status: integration.status,
          requestDate: integration.requestDate,
          responseDate: integration.responseDate,
          integrationPeriod: integration.integrationPeriod,
          landDetails: integration.landDetails,
          financialAgreement: integration.financialAgreement,
          agreementDocument: integration.agreementDocument,
          signatures: integration.signatures,
          executionDate: integration.executionDate,
          blockchain: integration.blockchain,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        }))
      }
    };
    
    return NextResponse.json({
      success: true,
      data: enhancedFarmer,
      debug: {
        farmerProfileFound: !!farmerProfileData,
        landDetailsCount: landDetailsData.length,
        landIntegrationsSentCount: landIntegrationSentData.length,
        landIntegrationsReceivedCount: landIntegrationReceivedData.length
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
