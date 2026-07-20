import { NextResponse } from 'next/server';
import SimpleBlockchainService from '../../../../lib/services/simple-blockchain.service';

export async function POST(request: Request) {
  try {
    const blockchainService = new SimpleBlockchainService();
    
    // Deploy the contract
    const contractAddress = await blockchainService.deployContract();
    
    return NextResponse.json({
      success: true,
      contractAddress,
      mode: blockchainService.getMode(),
      message: `LandIntegrationAgreement contract deployed to ${blockchainService.getMode().toLowerCase()}`
    });
    
  } catch (error) {
    console.error('Error deploying contract:', error);
    return NextResponse.json(
      { error: 'Failed to deploy contract' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const blockchainService = new SimpleBlockchainService();
    
    if (blockchainService.isContractDeployed()) {
      return NextResponse.json({
        success: true,
        contractAddress: blockchainService.getContractAddress(),
        isDeployed: true,
        mode: blockchainService.getMode(),
        providerAvailable: blockchainService.isProviderAvailable()
      });
    } else {
      return NextResponse.json({
        success: true,
        isDeployed: false,
        mode: blockchainService.getMode(),
        message: 'Contract not yet deployed'
      });
    }
    
  } catch (error) {
    console.error('Error checking contract status:', error);
    return NextResponse.json(
      { error: 'Failed to check contract status' },
      { status: 500 }
    );
  }
}
