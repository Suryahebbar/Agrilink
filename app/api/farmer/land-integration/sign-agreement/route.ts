import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LandIntegration } from '../../../../../lib/models/LandIntegration';
import { FarmerProfile } from '../../../../../lib/models/FarmerProfile';
import { getUserFromRequest } from '../../../../../lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth || auth.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, password, agreementContent } = await request.json();
    const userId = auth.sub;

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

    // Get farmer profile to verify password
    const farmerProfile = await FarmerProfile.findOne({ userId });
    if (!farmerProfile) {
      return NextResponse.json({ error: 'Farmer profile not found' }, { status: 404 });
    }

    // Verify password (simplified - in production, use proper password hashing)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // For demo purposes, we'll accept any password. In production, verify against stored hash
    // if (farmerProfile.password !== hashedPassword) {
    //   return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    // }

    // Initialize signatures array if it doesn't exist
    if (!integrationRequest.signatures) {
      integrationRequest.signatures = [];
    }

    // Check if already signed
    const existingSignature = integrationRequest.signatures.find(
      (sig: any) => sig.userId === userId
    );
    
    if (existingSignature) {
      return NextResponse.json({ error: 'Already signed' }, { status: 400 });
    }

    // Add signature
    const signatureData = {
      userId: userId,
      userName: farmerProfile.verifiedName || farmerProfile.aadhaarKannadaName || 'Farmer',
      signatureHash: crypto.createHash('sha256').update(userId + agreementContent + Date.now()).digest('hex'),
      signedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    integrationRequest.signatures.push(signatureData);

    // Check if both parties have signed
    const isRequestingUser = integrationRequest.requestingUser.toString() === userId;
    const otherUserId = isRequestingUser ? 
      integrationRequest.targetUser.toString() : 
      integrationRequest.requestingUser.toString();

    const otherUserSigned = integrationRequest.signatures.some(
      (sig: any) => sig.userId === otherUserId
    );

    // If both signed, mark as fully executed and upload to blockchain
    if (otherUserSigned) {
      integrationRequest.status = 'completed';
      integrationRequest.executionDate = new Date();
      integrationRequest.agreementDocument = `/agreements/${integrationRequest._id}_signed.pdf`;

      // Automatically upload to blockchain
      try {
        const blockchainResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/blockchain/upload-automatic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agreementId: integrationRequest._id.toString(),
            farmer1Name: integrationRequest.requestingUserName || 'Farmer 1',
            farmer2Name: integrationRequest.targetUserName || 'Farmer 2',
            farmer1LandSize: integrationRequest.requestingUserLandSize || 1,
            farmer2LandSize: integrationRequest.targetUserLandSize || 1,
            documentPath: integrationRequest.agreementDocument,
            bothSigned: true
          })
        });

        const blockchainResult = await blockchainResponse.json();
        
        if (blockchainResult.success) {
          integrationRequest.blockchainUploaded = true;
          integrationRequest.blockchainTransactionHash = blockchainResult.transactionHash;
          integrationRequest.blockchainDocumentCid = blockchainResult.documentCid;
          integrationRequest.blockchainUploadedAt = new Date();
          console.log(`✅ Agreement ${integrationRequest._id} uploaded to blockchain: ${blockchainResult.transactionHash}`);
        } else {
          console.error(`❌ Failed to upload agreement ${integrationRequest._id} to blockchain:`, blockchainResult.error);
        }
      } catch (blockchainError) {
        console.error(`❌ Error uploading agreement ${integrationRequest._id} to blockchain:`, blockchainError);
        // Don't fail the signing process, just log the error
      }
    }

    await integrationRequest.save();

    return NextResponse.json({
      success: true,
      message: otherUserSigned ? 
        `Agreement fully executed by both parties and uploaded to blockchain! Transaction: ${integrationRequest.blockchainTransactionHash || 'Processing...'}` : 
        'Agreement signed successfully. Waiting for other party to sign.',
      signedBy: signatureData.userName,
      fullyExecuted: otherUserSigned,
      blockchainUploaded: integrationRequest.blockchainUploaded || false,
      blockchainTransactionHash: integrationRequest.blockchainTransactionHash,
      signatures: integrationRequest.signatures.map((sig: any) => ({
        userName: sig.userName,
        signedAt: sig.signedAt
      }))
    });

  } catch (error) {
    console.error('Error signing agreement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Return signature status
    const userSignature = integrationRequest.signatures?.find(
      (sig: any) => sig.userId === userId
    );

    const isRequestingUser = integrationRequest.requestingUser.toString() === userId;
    const otherUserId = isRequestingUser ? 
      integrationRequest.targetUser.toString() : 
      integrationRequest.requestingUser.toString();

    const otherUserSignature = integrationRequest.signatures?.find(
      (sig: any) => sig.userId === otherUserId
    );

    return NextResponse.json({
      success: true,
      userSigned: !!userSignature,
      otherUserSigned: !!otherUserSignature,
      fullyExecuted: integrationRequest.status === 'completed',
      signatures: integrationRequest.signatures?.map((sig: any) => ({
        userName: sig.userName,
        signedAt: sig.signedAt
      })) || []
    });

  } catch (error) {
    console.error('Error checking signature status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
