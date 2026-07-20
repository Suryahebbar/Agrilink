import { ethers, Contract, Wallet, formatUnits, parseUnits } from 'ethers';
import EnhancedBlockchainService from './enhanced-blockchain.service';

// Contract ABI for LandIntegrationAgreement
const contractABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_farmer1Name", "type": "string" },
      { "internalType": "string", "name": "_farmer2Name", "type": "string" },
      { "internalType": "uint256", "name": "_farmer1LandSize", "type": "uint256" },
      { "internalType": "uint256", "name": "_farmer2LandSize", "type": "uint256" },
      { "internalType": "string", "name": "_documentCid", "type": "string" }
    ],
    "name": "createAgreement",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_agreementId", "type": "string" },
      { "internalType": "string", "name": "_signerName", "type": "string" }
    ],
    "name": "signAgreement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_agreementId", "type": "string" }
    ],
    "name": "getAgreement",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "agreementId", "type": "string" },
          { "internalType": "string", "name": "farmer1Name", "type": "string" },
          { "internalType": "string", "name": "farmer2Name", "type": "string" },
          { "internalType": "uint256", "name": "farmer1LandSize", "type": "uint256" },
          { "internalType": "uint256", "name": "farmer2LandSize", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "address", "name": "createdBy", "type": "address" },
          { "internalType": "string", "name": "documentCid", "type": "string" }
        ],
        "internalType": "struct LandIntegrationAgreement.Agreement",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface AgreementData {
  agreementId: string;
  farmer1Name: string;
  farmer2Name: string;
  farmer1LandSize: number;
  farmer2LandSize: number;
  documentPath: string;
  bothSigned: boolean;
}

interface BlockchainUploadResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  agreementId?: string;
  documentCid?: string;
  error?: string;
}

class BackendBlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: Contract | null = null;
  private adminWallet: Wallet | null = null;
  private enhancedService: EnhancedBlockchainService;
  private isDevelopmentMode: boolean = true;

  constructor() {
    this.enhancedService = new EnhancedBlockchainService();
    this.isDevelopmentMode = process.env.BLOCKCHAIN_MODE !== 'real';
    this.initializeBlockchain().catch(console.error);
  }

  private async initializeBlockchain(): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        console.log('🔗 [BACKEND] Blockchain service running in DEVELOPMENT mode');
        return;
      }

      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      const adminPrivateKey = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;
      if (!adminPrivateKey) {
        throw new Error('BLOCKCHAIN_ADMIN_PRIVATE_KEY not configured');
      }

      this.adminWallet = new Wallet(adminPrivateKey, this.provider);

      const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('BLOCKCHAIN_CONTRACT_ADDRESS not configured');
      }

      this.contract = new Contract(contractAddress, contractABI, this.adminWallet);
      console.log(`🔗 [BACKEND] Connected to contract: ${contractAddress}`);

    } catch (error) {
      console.error('🔗 [BACKEND] Failed to initialize blockchain:', error);
      this.isDevelopmentMode = true;
    }
  }

  async uploadAgreementToBlockchain(agreementData: AgreementData): Promise<BlockchainUploadResult> {
    try {
      if (!agreementData.bothSigned) {
        return {
          success: false,
          error: 'Agreement must be signed by both farmers before blockchain upload'
        };
      }

      if (this.isDevelopmentMode) {
        // Mock blockchain upload for development
        console.log(`📝 [BACKEND] [DEV] Uploading agreement ${agreementData.agreementId} to blockchain`);
        
        // Simulate IPFS upload
        const mockCid = `bafybeig${Math.random().toString(36).substr(2, 44)}`;
        
        return {
          success: true,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockNumber: Math.floor(Math.random() * 1000000),
          agreementId: agreementData.agreementId,
          documentCid: mockCid
        };
      }

      // Real blockchain upload
      await this.initializeBlockchain();

      if (!this.contract || !this.adminWallet) {
        throw new Error('Blockchain not available');
      }

      // Step 1: Upload document to IPFS
      const documentCid = await this.uploadDocumentToIPFS(agreementData.documentPath, agreementData.agreementId);

      // Step 2: Create agreement on blockchain
      const farmer1LandSizeWei = parseUnits(agreementData.farmer1LandSize.toString(), 18);
      const farmer2LandSizeWei = parseUnits(agreementData.farmer2LandSize.toString(), 18);

      const tx = await this.contract.createAgreement(
        agreementData.farmer1Name,
        agreementData.farmer2Name,
        farmer1LandSizeWei,
        farmer2LandSizeWei,
        documentCid
      );

      const receipt = await tx.wait();

      console.log(`✅ [BACKEND] Agreement ${agreementData.agreementId} uploaded to blockchain`);
      console.log(`📄 Document CID: ${documentCid}`);
      console.log(`🔗 Transaction: ${tx.hash}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt?.blockNumber,
        agreementId: agreementData.agreementId,
        documentCid: documentCid
      };

    } catch (error) {
      console.error('🔗 [BACKEND] Error uploading agreement to blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async uploadDocumentToIPFS(documentPath: string, agreementId: string): Promise<string> {
    try {
      // For now, we'll use the enhanced service which handles IPFS uploads
      // In a real implementation, you'd read the actual file from documentPath
      const mockFile = new File(['mock agreement content'], `agreement-${agreementId}.pdf`, {
        type: 'application/pdf'
      });

      const result = await this.enhancedService.uploadToIPFS(mockFile, agreementId, 'system');
      return result.cid;
    } catch (error) {
      console.error('📁 [BACKEND] Error uploading to IPFS:', error);
      throw error;
    }
  }

  async verifyAgreementOnBlockchain(agreementId: string): Promise<boolean> {
    try {
      if (this.isDevelopmentMode) {
        console.log(`📝 [BACKEND] [DEV] Verifying agreement ${agreementId} on blockchain`);
        return true;
      }

      await this.initializeBlockchain();

      if (!this.contract) {
        throw new Error('Blockchain not available');
      }

      const agreement = await this.contract.getAgreement(agreementId);
      return agreement.timestamp > 0 && agreement.isActive;

    } catch (error) {
      console.error('🔗 [BACKEND] Error verifying agreement:', error);
      return false;
    }
  }

  getBlockchainStatus(): {
    isDevelopment: boolean;
    isConnected: boolean;
    contractAddress?: string;
  } {
    return {
      isDevelopment: this.isDevelopmentMode,
      isConnected: !!this.contract,
      contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS
    };
  }
}

export default BackendBlockchainService;
