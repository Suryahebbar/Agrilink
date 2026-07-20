import { ethers, Contract, ContractFactory, Wallet, formatUnits, parseUnits } from 'ethers';
import fs from 'fs';
import path from 'path';

// Contract ABI and Bytecode
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "agreementId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "farmer1Name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "farmer2Name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AgreementCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "agreementId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "signer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "signerName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AgreementSigned",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_farmer1Name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_farmer2Name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_farmer1LandSize",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_farmer2LandSize",
        "type": "uint256"
      }
    ],
    "name": "createAgreement",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_agreementId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_signerName",
        "type": "string"
      }
    ],
    "name": "signAgreement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_agreementId",
        "type": "string"
      }
    ],
    "name": "getAgreement",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "agreementId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "farmer1Name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "farmer2Name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "farmer1LandSize",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "farmer2LandSize",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "createdBy",
            "type": "address"
          }
        ],
        "internalType": "struct LandIntegrationAgreement.Agreement",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_agreementId",
        "type": "string"
      }
    ],
    "name": "getAgreementSignatures",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "agreementId",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "signer",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "signerName",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct LandIntegrationAgreement.Signature[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserAgreements",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_agreementId",
        "type": "string"
      }
    ],
    "name": "verifyAgreementIntegrity",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: Contract | null = null;
  private contractAddress: string;

  constructor() {
    // Use local Hardhat network
    this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    this.contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';
    
    if (this.contractAddress) {
      this.contract = new Contract(this.contractAddress, contractABI, this.provider);
    }
  }

  async deployContract(): Promise<string> {
    try {
      // Read bytecode
      const bytecodePath = path.join(process.cwd(), 'artifacts', 'contracts_LandIntegrationAgreementSimple_sol_LandIntegrationAgreement.bin');
      const bytecode = fs.readFileSync(bytecodePath, 'utf8').trim();
      
      // Get deployer account (first account from Hardhat)
      const deployer = new Wallet(process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
      
      // Deploy contract
      const factory = new ContractFactory(contractABI, bytecode, deployer);
      const contract = await factory.deploy();
      
      // Wait for deployment
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();
      
      this.contractAddress = contractAddress;
      this.contract = new Contract(this.contractAddress, contractABI, this.provider);
      
      console.log('LandIntegrationAgreement deployed to:', this.contractAddress);
      return this.contractAddress;
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
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
      const wallet = new Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract!.connect(wallet) as Contract;
      
      // Convert land sizes to wei (smallest unit)
      const farmer1LandSizeWei = parseUnits(farmer1LandSize.toString(), 18);
      const farmer2LandSizeWei = parseUnits(farmer2LandSize.toString(), 18);
      
      const tx = await contractWithSigner.createAgreement(
        farmer1Name,
        farmer2Name,
        farmer1LandSizeWei,
        farmer2LandSizeWei
      );
      
      const receipt = await tx.wait();
      
      // Get agreement ID from event
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
      const wallet = new Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract!.connect(wallet) as Contract;
      
      const tx = await contractWithSigner.signAgreement(agreementId, signerName);
      await tx.wait();
      
      console.log(`Agreement ${agreementId} signed by ${signerName}`);
    } catch (error) {
      console.error('Error signing agreement:', error);
      throw error;
    }
  }

  async getAgreement(agreementId: string): Promise<any> {
    try {
      const agreement = await this.contract!.getAgreement(agreementId);
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
      const signatures = await this.contract!.getAgreementSignatures(agreementId);
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

  async getUserAgreements(userAddress: string): Promise<string[]> {
    try {
      return await this.contract!.getUserAgreements(userAddress);
    } catch (error) {
      console.error('Error getting user agreements:', error);
      throw error;
    }
  }

  async verifyAgreementIntegrity(agreementId: string): Promise<boolean> {
    try {
      return await this.contract!.verifyAgreementIntegrity(agreementId);
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
}

export default BlockchainService;
