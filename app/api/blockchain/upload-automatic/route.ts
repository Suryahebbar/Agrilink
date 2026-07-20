import { NextRequest, NextResponse } from 'next/server';
import BackendBlockchainService from '@/lib/services/backend-blockchain.service';

const blockchainService = new BackendBlockchainService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agreementId, farmer1Name, farmer2Name, farmer1LandSize, farmer2LandSize, documentPath, bothSigned } = body;

    if (!agreementId || !farmer1Name || !farmer2Name || !farmer1LandSize || !farmer2LandSize || !documentPath) {
      return NextResponse.json(
        { error: 'Missing required agreement data' },
        { status: 400 }
      );
    }

    if (!bothSigned) {
      return NextResponse.json(
        { error: 'Agreement must be signed by both farmers' },
        { status: 400 }
      );
    }

    // Upload agreement to blockchain
    const result = await blockchainService.uploadAgreementToBlockchain({
      agreementId,
      farmer1Name,
      farmer2Name,
      farmer1LandSize,
      farmer2LandSize,
      documentPath,
      bothSigned
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Agreement successfully uploaded to blockchain',
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        documentCid: result.documentCid,
        agreementId: result.agreementId
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to upload to blockchain' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in blockchain upload endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const status = blockchainService.getBlockchainStatus();
  
  return NextResponse.json({
    message: 'Backend blockchain service status',
    ...status
  });
}
