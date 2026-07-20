import { ethers, Contract, ContractFactory, Wallet, formatUnits, parseUnits } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Contract ABI (simplified for development)
const contractABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_farmer1Name", "type": "string" },
      { "internalType": "string", "name": "_farmer2Name", "type": "string" },
      { "internalType": "uint256", "name": "_farmer1LandSize", "type": "uint256" },
      { "internalType": "uint256", "name": "_farmer2LandSize", "type": "uint256" }
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
  }
];

class SimpleBlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: Contract | null = null;
  private contractAddress: string = '';
  private isDevelopmentMode: boolean = true;
  private initializationAttempted: boolean = false;

  constructor() {
    // Default to development mode, only try blockchain if explicitly requested
    this.isDevelopmentMode = true;
    this.initializationAttempted = false;
    console.log('📝 Running in development mode (blockchain simulation)');
  }

  async deployContract(): Promise<string> {
    try {
      if (this.isDevelopmentMode) {
        // Mock deployment for development
        const mockAddress = `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`;
        this.contractAddress = mockAddress;
        process.env.BLOCKCHAIN_CONTRACT_ADDRESS = mockAddress;
        
        console.log(`📝 [DEV] Mock contract deployed to: ${mockAddress}`);
        return mockAddress;
      }

      // Real deployment
      const bytecodePath = path.join(process.cwd(), 'artifacts', 'contracts_LandIntegrationAgreementSimple_sol_LandIntegrationAgreement.bin');
      if (!fs.existsSync(bytecodePath)) {
        throw new Error('Contract bytecode not found. Please compile the contract first.');
      }
      
      const bytecode = fs.readFileSync(bytecodePath, 'utf8').trim();
      const deployer = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
      
      const factory = new ContractFactory(contractABI, bytecode, deployer);
      const contract = await factory.deploy();
      
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();
      
      this.contractAddress = contractAddress;
      this.contract = new Contract(this.contractAddress, contractABI, this.provider);
      process.env.BLOCKCHAIN_CONTRACT_ADDRESS = contractAddress;
      
      console.log('🔗 Contract deployed to:', contractAddress);
      return contractAddress;
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }

  private async tryBlockchainConnection(): Promise<boolean> {
    if (this.initializationAttempted) {
      return !this.isDevelopmentMode;
    }

    this.initializationAttempted = true;
    
    try {
      // Only try if BLOCKCHAIN_MODE is set to 'real'
      if (process.env.BLOCKCHAIN_MODE !== 'real') {
        return false;
      }

      // Try to connect to Hardhat node
      this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      
      await this.provider.getBlockNumber(); // Test connection
      
      this.isDevelopmentMode = false;
      console.log('🔗 Connected to Hardhat node');
      
      // Initialize contract if address is known
      if (process.env.BLOCKCHAIN_CONTRACT_ADDRESS) {
        this.contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
        this.contract = new Contract(this.contractAddress, contractABI, this.provider);
      }
      
      return true;
    } catch (error) {
      this.isDevelopmentMode = true;
      this.provider = null;
      this.contract = null;
      console.log('📝 Running in development mode (blockchain simulation)');
      return false;
    }
  }

  async createAgreement(
    farmer1Name: string,
    farmer2Name: string,
    farmer1LandSize: number,
    farmer2LandSize: number,
    privateKey: string
  ): Promise<string> {
    try {
      if (this.isDevelopmentMode) {
        // Mock agreement creation
        const agreementId = `AGR_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        console.log(`📝 [DEV] Created agreement ${agreementId} between ${farmer1Name} and ${farmer2Name}`);
        console.log(`📝 [DEV] Land sizes: ${farmer1LandSize} acres, ${farmer2LandSize} acres`);
        return agreementId;
      }

      // Real blockchain interaction
      await this.tryBlockchainConnection();
      
      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const wallet = new Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);
      
      const farmer1LandSizeWei = parseUnits(farmer1LandSize.toString(), 18);
      const farmer2LandSizeWei = parseUnits(farmer2LandSize.toString(), 18);
      
      const tx = await (contractWithSigner as any).createAgreement(
        farmer1Name,
        farmer2Name,
        farmer1LandSizeWei,
        farmer2LandSizeWei
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs?.find((e: any) => e.event === 'AgreementCreated');
      return event?.args?.agreementId || '';
    } catch (error) {
      console.error('Error creating agreement:', error);
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
        // Mock signing
        console.log(`📝 [DEV] ${signerName} signed agreement ${agreementId}`);
        return;
      }

      // Real blockchain signing
      await this.tryBlockchainConnection();
      
      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const wallet = new Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);
      
      const tx = await (contractWithSigner as any).signAgreement(agreementId, signerName);
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
        // Mock agreement data
        return {
          agreementId,
          farmer1Name: 'Development Farmer 1',
          farmer2Name: 'Development Farmer 2',
          farmer1LandSize: '2.5',
          farmer2LandSize: '3.0',
          timestamp: Math.floor(Date.now() / 1000),
          isActive: true,
          createdBy: '0xDevelopmentAddress'
        };
      }

      // Real blockchain query
      await this.tryBlockchainConnection();
      
      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const agreement = await (this.contract as any).getAgreement(agreementId);
      return {
        agreementId: agreement.agreementId,
        farmer1Name: agreement.farmer1Name,
        farmer2Name: agreement.farmer2Name,
        farmer1LandSize: formatUnits(agreement.farmer1LandSize, 18),
        farmer2LandSize: formatUnits(agreement.farmer2LandSize, 18),
        timestamp: Number(agreement.timestamp),
        isActive: agreement.isActive,
        createdBy: agreement.createdBy
      };
    } catch (error) {
      console.error('Error getting agreement:', error);
      throw error;
    }
  }

  async getAgreementSignatures(agreementId: string): Promise<any[]> {
    try {
      if (this.isDevelopmentMode) {
        // Mock signatures
        return [
          {
            agreementId,
            signer: '0xDevelopmentFarmer1',
            signerName: 'Development Farmer 1',
            timestamp: Math.floor(Date.now() / 1000)
          },
          {
            agreementId,
            signer: '0xDevelopmentFarmer2',
            signerName: 'Development Farmer 2',
            timestamp: Math.floor(Date.now() / 1000)
          }
        ];
      }

      // Real blockchain query
      await this.tryBlockchainConnection();
      
      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      const signatures = await (this.contract as any).getAgreementSignatures(agreementId);
      return signatures.map((sig: any) => ({
        agreementId: sig.agreementId,
        signer: sig.signer,
        signerName: sig.signerName,
        timestamp: Number(sig.timestamp)
      }));
    } catch (error) {
      console.error('Error getting signatures:', error);
      throw error;
    }
  }

  async verifyAgreementIntegrity(agreementId: string): Promise<boolean> {
    try {
      if (this.isDevelopmentMode) {
        // Mock verification - always true in development
        console.log(`📝 [DEV] Agreement ${agreementId} integrity verified (mock)`);
        return true;
      }

      // Real blockchain verification
      await this.tryBlockchainConnection();
      
      if (!this.provider || !this.contract) {
        throw new Error('Blockchain not available');
      }

      return await (this.contract as any).verifyAgreementIntegrity(agreementId);
    } catch (error) {
      console.error('Error verifying agreement:', error);
      throw error;
    }
  }

  getContractAddress(): string {
    return this.contractAddress;
  }

  isContractDeployed(): boolean {
    return !!this.contractAddress;
  }

  isProviderAvailable(): boolean {
    return !!this.provider && !this.isDevelopmentMode;
  }

  getMode(): string {
    return this.isDevelopmentMode ? 'DEVELOPMENT' : 'BLOCKCHAIN';
  }
}

export default SimpleBlockchainService;
