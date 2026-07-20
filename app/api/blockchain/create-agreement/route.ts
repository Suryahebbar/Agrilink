import { NextRequest, NextResponse } from 'next/server';
import EnhancedBlockchainService from '@/lib/services/enhanced-blockchain.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agreementId,
      farmer1Name,
      farmer2Name,
      farmer1LandSize,
      farmer2LandSize,
      documentCid,
      privateKey
    } = body;

    // Validate required fields
    if (!agreementId || !farmer1Name || !farmer2Name || !documentCid) {
      return NextResponse.json({ 
        error: 'Missing required fields: agreementId, farmer1Name, farmer2Name, documentCid' 
      }, { status: 400 });
    }

    if (!farmer1LandSize || !farmer2LandSize) {
      return NextResponse.json({ 
        error: 'Land sizes are required for both farmers' 
      }, { status: 400 });
    }

    // Initialize blockchain service
    const blockchainService = new EnhancedBlockchainService();

    // Create agreement on blockchain
    const result = await blockchainService.createAgreementWithDocument({
      agreementId,
      farmer1Name,
      farmer2Name,
      farmer1LandSize: Number(farmer1LandSize),
      farmer2LandSize: Number(farmer2LandSize),
      documentCid
    }, privateKey || process.env.BLOCKCHAIN_PRIVATE_KEY || '');

    console.log(`✅ Agreement created: ${agreementId}`);

    return NextResponse.json({
      success: true,
      agreementId: result,
      message: 'Agreement successfully created on blockchain',
      blockchainMode: blockchainService.getMode()
    });

  } catch (error) {
    console.error('Error creating agreement on blockchain:', error);
    return NextResponse.json({ 
      error: 'Failed to create agreement on blockchain',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Blockchain agreement creation endpoint ready',
    usage: 'POST with JSON body containing agreement details',
    fields: [
      'agreementId (required)',
      'farmer1Name (required)', 
      'farmer2Name (required)',
      'farmer1LandSize (required)',
      'farmer2LandSize (required)',
      'documentCid (required)',
      'privateKey (optional, uses env var if not provided)'
    ]
  });
}
