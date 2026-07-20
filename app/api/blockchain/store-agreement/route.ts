import { NextResponse } from 'next/server';
import SimpleBlockchainService from '../../../../lib/services/simple-blockchain.service';
import { connectDB } from '../../../../lib/db';
import { LandIntegration } from '../../../../lib/models/LandIntegration';
import { FarmerProfile } from '../../../../lib/models/FarmerProfile';
import { getUserFromRequest } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth || auth.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();
    
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
    if (integrationRequest.requestingUser.toString() !== auth.sub && 
        integrationRequest.targetUser.toString() !== auth.sub) {
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

    // Initialize blockchain service
    const blockchainService = new SimpleBlockchainService();
    
    // Auto-deploy contract if not deployed
    if (!blockchainService.isContractDeployed()) {
      console.log('📝 Auto-deploying blockchain contract...');
      await blockchainService.deployContract();
    }

    // Create agreement on blockchain
    const farmer1Name = requestingProfile?.verifiedName || requestingProfile?.aadhaarKannadaName || 'Farmer 1';
    const farmer2Name = targetProfile?.verifiedName || targetProfile?.aadhaarKannadaName || 'Farmer 2';
    const farmer1LandSize = integrationRequest.landDetails.requestingUser.sizeInAcres;
    const farmer2LandSize = integrationRequest.landDetails.targetUser.sizeInAcres;

    // Use admin private key for deployment (in production, this should be securely stored)
    const adminPrivateKey = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
    const blockchainAgreementId = await blockchainService.createAgreement(
      farmer1Name,
      farmer2Name,
      farmer1LandSize,
      farmer2LandSize,
      adminPrivateKey
    );

    // Sign the agreement on blockchain for both parties
    // In production, each user would sign with their own private key
    const farmer1PrivateKey = process.env.BLOCKCHAIN_FARMER1_PRIVATE_KEY || adminPrivateKey;
    const farmer2PrivateKey = process.env.BLOCKCHAIN_FARMER2_PRIVATE_KEY || adminPrivateKey;

    await blockchainService.signAgreement(blockchainAgreementId, farmer1Name, farmer1PrivateKey);
    await blockchainService.signAgreement(blockchainAgreementId, farmer2Name, farmer2PrivateKey);

    // Update the integration request with blockchain information
    await LandIntegration.findByIdAndUpdate(requestId, {
      $set: {
        'blockchain.agreementId': blockchainAgreementId,
        'blockchain.contractAddress': blockchainService.getContractAddress(),
        'blockchain.deployedAt': new Date(),
        'blockchain.transactionHash': blockchainAgreementId, // In production, use actual transaction hash
        'blockchain.isImmutable': true
      }
    });

    return NextResponse.json({
      success: true,
      blockchainAgreementId,
      contractAddress: blockchainService.getContractAddress(),
      mode: blockchainService.getMode(),
      message: `Agreement successfully stored on ${blockchainService.getMode().toLowerCase()}`
    });

  } catch (error) {
    console.error('Error storing agreement on blockchain:', error);
    return NextResponse.json(
      { error: 'Failed to store agreement on blockchain' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    await connectDB();

    // Find the integration request
    const integrationRequest = await LandIntegration.findById(requestId);
    if (!integrationRequest) {
      return NextResponse.json({ error: 'Integration request not found' }, { status: 404 });
    }

    // Check if agreement is stored on blockchain
    const blockchainInfo = integrationRequest.blockchain;
    
    if (!blockchainInfo || !blockchainInfo.agreementId) {
      return NextResponse.json({
        success: true,
        isOnBlockchain: false,
        message: 'Agreement not yet stored on blockchain'
      });
    }

    // Get blockchain agreement details
    const blockchainService = new SimpleBlockchainService();
    const agreement = await blockchainService.getAgreement(blockchainInfo.agreementId);
    const signatures = await blockchainService.getAgreementSignatures(blockchainInfo.agreementId);
    const isVerified = await blockchainService.verifyAgreementIntegrity(blockchainInfo.agreementId);

    return NextResponse.json({
      success: true,
      isOnBlockchain: true,
      blockchainInfo,
      agreement,
      signatures,
      isVerified,
      mode: blockchainService.getMode(),
      message: `Agreement verified on ${blockchainService.getMode().toLowerCase()}`
    });

  } catch (error) {
    console.error('Error fetching blockchain agreement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blockchain agreement' },
      { status: 500 }
    );
  }
}
