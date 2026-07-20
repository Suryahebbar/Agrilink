import { ethers, Contract, Wallet, formatUnits, parseUnits } from 'ethers';
import type { Web3Storage } from 'web3.storage';

// Dynamic import for web3.storage to avoid TypeScript issues
const importWeb3Storage = async (): Promise<typeof import('web3.storage') | null> => {
  try {
    const web3Storage = await import('web3.storage');
    return web3Storage;
  } catch (error) {
    console.error('Failed to import web3.storage:', error);
    return null;
  }
};

// Enhanced Contract ABI for AgreementRegistry
const contractABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_agreementId", "type": "string" },
      { "internalType": "string", "name": "_farmer1Name", "type": "string" },
      { "internalType": "string", "name": "_farmer2Name", "type": "string" },
      { "internalType": "uint256", "name": "_farmer1LandSize", "type": "uint256" },
      { "internalType": "uint256", "name": "_farmer2LandSize", "type": "uint256" },
      { "internalType": "string", "name": "_documentCid", "type": "string" }
    ],
    "name": "createAgreement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_agreementId", "type": "string" },
      { "internalType": "string", "name": "_cid", "type": "string" },
      { "internalType": "string", "name": "_documentType", "type": "string" }
    ],
    "name": "storeDocument",
    "outputs": [],
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
          { "internalType": "address", "name": "creator", "type": "address" },
          { "internalType": "string", "name": "farmer1Name", "type": "string" },
          { "internalType": "string", "name": "farmer2Name", "type": "string" },
          { "internalType": "uint256", "name": "farmer1LandSize", "type": "uint256" },
          { "internalType": "uint256", "name": "farmer2LandSize", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "string", "name": "documentCid", "type": "string" }
        ],
        "internalType": "struct AgreementRegistry.Agreement",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_agreementId", "type": "string" }
    ],
    "name": "getAgreementDocuments",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "cid", "type": "string" },
          { "internalType": "string", "name": "agreementId", "type": "string" },
          { "internalType": "address", "name": "uploader", "type": "address" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "string", "name": "documentType", "type": "string" },
          { "internalType": "bool", "name": "isActive", "type": "bool" }
        ],
        "internalType": "struct AgreementRegistry.AgreementDocument[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserAgreements",
    "outputs": [
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_agreementId", "type": "string" },
      { "internalType": "string", "name": "_cid", "type": "string" }
    ],
    "name": "verifyDocument",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
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
  documentCid: string;
  creator?: string;
  timestamp?: number;
}

interface UploadResult {
  cid: string;
  filename: string;
  agreementId: string;
  ipfsUrl: string;
  gatewayUrl: string;
}

class EnhancedBlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: Contract | null = null;
  private contractAddress: string = '';
  private web3StorageClient: Web3Storage | null = null;
  private isDevelopmentMode: boolean = true;

  constructor() {
    // Initialize asynchronously
    this.initializeWeb3Storage().catch(console.error);
    this.isDevelopmentMode = process.env.BLOCKCHAIN_MODE !== 'real';
    console.log(`🔗 Enhanced Blockchain Service - Mode: ${this.isDevelopmentMode ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  }

  private async initializeWeb3Storage() {
    const web3StorageToken = process.env.WEB3STORAGE_KEY;
    if (web3StorageToken) {
      try {
        const web3StorageModule = await importWeb3Storage();
        if (web3StorageModule) {
          this.web3StorageClient = new web3StorageModule.Web3Storage({ token: web3StorageToken });
          console.log('📁 Web3.Storage client initialized');
        } else {
          console.log('⚠️ Web3.Storage module not available - IPFS uploads will be simulated');
        }
      } catch (error) {
        console.log('⚠️ Failed to initialize Web3.Storage - IPFS uploads will be simulated');
      }
    } else {
      console.log('⚠️ Web3.Storage API key not found - IPFS uploads will be simulated');
    }
  }

  async uploadToIPFS(file: File, agreementId: string, userId: string): Promise<UploadResult> {
    try {
      if (!this.web3StorageClient) {
        // Mock IPFS upload for development
        const mockCid = `bafybeig${Math.random().toString(36).substr(2, 44)}`;
        return {
          cid: mockCid,
          filename: file.name,
          agreementId,
          ipfsUrl: `https://ipfs.io/ipfs/${mockCid}/${file.name}`,
          gatewayUrl: `https://gateway.ipfs.io/ipfs/${mockCid}/${file.name}`
        };
      }

      // Real IPFS upload
      const web3StorageModule = await importWeb3Storage();
      if (!web3StorageModule) {
        throw new Error('Web3.Storage module not available');
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const web3File = new web3StorageModule.File([buffer], file.name, { type: file.type });

      const filename = `agreements/${userId}/${agreementId}/${file.name}`;
      const cid = await this.web3StorageClient.put([web3File], {
        name: filename,
        wrapWithDirectory: true
      });

      console.log(`📁 File uploaded to IPFS: ${cid}`);

      return {
        cid: cid,
        filename: file.name,
        agreementId,
        ipfsUrl: `https://ipfs.io/ipfs/${cid}/${file.name}`,
        gatewayUrl: `https://gateway.ipfs.io/ipfs/${cid}/${file.name}`
      };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  async createAgreementWithDocument(
    agreementData: AgreementData,
    privateKey: string
  ): Promise<string> {
    try {
      if (this.isDevelopmentMode) {
        // Mock agreement creation
        console.log(`📝 [DEV] Creating agreement ${agreementData.agreementId}`);
        console.log(`📝 [DEV] Document CID: ${agreementData.documentCid}`);
        return agreementData.agreementId;
      }

      await this.initializeBlockchain();

      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const wallet = new Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      // Convert land sizes to wei
      const farmer1LandSizeWei = parseUnits(agreementData.farmer1LandSize.toString(), 18);
      const farmer2LandSizeWei = parseUnits(agreementData.farmer2LandSize.toString(), 18);

      const tx = await (contractWithSigner as any).createAgreement(
        agreementData.agreementId,
        agreementData.farmer1Name,
        agreementData.farmer2Name,
        farmer1LandSizeWei,
        farmer2LandSizeWei,
        agreementData.documentCid
      );

      const receipt = await tx.wait();
      console.log(`✅ Agreement ${agreementData.agreementId} created on blockchain`);
      
      return agreementData.agreementId;
    } catch (error) {
      console.error('Error creating agreement:', error);
      throw error;
    }
  }

  async storeAdditionalDocument(
    agreementId: string,
    cid: string,
    documentType: string,
    privateKey: string
  ): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        console.log(`📝 [DEV] Stored additional document ${cid} for agreement ${agreementId}`);
        return;
      }

      await this.initializeBlockchain();

      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const wallet = new Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      const tx = await (contractWithSigner as any).storeDocument(
        agreementId,
        cid,
        documentType
      );

      await tx.wait();
      console.log(`📄 Additional document stored for agreement ${agreementId}`);
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  }

  async signAgreement(
    agreementId: string,
    signerName: string,
    privateKey: string
  ): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        console.log(`📝 [DEV] ${signerName} signed agreement ${agreementId}`);
        return;
      }

      await this.initializeBlockchain();

      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const wallet = new Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);

      const tx = await (contractWithSigner as any).signAgreement(
        agreementId,
        signerName
      );

      await tx.wait();
      console.log(`✅ Agreement ${agreementId} signed by ${signerName}`);
    } catch (error) {
      console.error('Error signing agreement:', error);
      throw error;
    }
  }

  async getAgreement(agreementId: string): Promise<any> {
    try {
      if (this.isDevelopmentMode) {
        return {
          agreementId,
          creator: '0xDevelopmentAddress',
          farmer1Name: 'Development Farmer 1',
          farmer2Name: 'Development Farmer 2',
          farmer1LandSize: '2.5',
          farmer2LandSize: '3.0',
          timestamp: Math.floor(Date.now() / 1000),
          isActive: true,
          documentCid: 'bafybeidevelopmentmockcid'
        };
      }

      await this.initializeBlockchain();

      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const agreement = await (this.contract as any).getAgreement(agreementId);
      
      return {
        agreementId: agreement.agreementId,
        creator: agreement.creator,
        farmer1Name: agreement.farmer1Name,
        farmer2Name: agreement.farmer2Name,
        farmer1LandSize: formatUnits(agreement.farmer1LandSize, 18),
        farmer2LandSize: formatUnits(agreement.farmer2LandSize, 18),
        timestamp: Number(agreement.timestamp),
        isActive: agreement.isActive,
        documentCid: agreement.documentCid
      };
    } catch (error) {
      console.error('Error getting agreement:', error);
      throw error;
    }
  }

  async verifyDocumentIntegrity(agreementId: string, cid: string): Promise<boolean> {
    try {
      if (this.isDevelopmentMode) {
        console.log(`📝 [DEV] Document ${cid} verified for agreement ${agreementId}`);
        return true;
      }

      await this.initializeBlockchain();

      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      return await (this.contract as any).verifyDocument(agreementId, cid);
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  }

  private async initializeBlockchain(): Promise<void> {
    if (this.provider && this.contract) {
      return; // Already initialized
    }

    try {
      // Initialize provider based on environment
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      if (process.env.BLOCKCHAIN_CONTRACT_ADDRESS) {
        this.contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
        this.contract = new Contract(this.contractAddress, contractABI, this.provider);
        console.log(`🔗 Connected to contract: ${this.contractAddress}`);
      }
    } catch (error) {
      console.error('Error initializing blockchain:', error);
      throw error;
    }
  }

  getContractAddress(): string {
    return this.contractAddress;
  }

  isContractDeployed(): boolean {
    return !!this.contractAddress;
  }

  getMode(): string {
    return this.isDevelopmentMode ? 'DEVELOPMENT' : 'PRODUCTION';
  }
}

export default EnhancedBlockchainService;
