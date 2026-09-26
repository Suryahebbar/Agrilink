import { ethers, Contract, Wallet } from 'ethers';
import { 
  hashContractNode, 
  hashContributionNode, 
  hashProfitDistributionNode, 
  hashCropSaleNode, 
  hashInvestmentNode 
} from '../hashContract';

export interface BlockchainAnchorResult {
  success: boolean;
  isSimulated: boolean;
  proofHash: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  contractAddress?: string;
  error?: string;
}

export const AGRI_LEDGER_ABI = [
  "function sealAgreement(string _poolId, string _poolName, string _documentHash, uint256 _participantCount) external",
  "function recordContribution(string _recordId, string _poolId, string _contributorId, string _contributorName, string _contributionType, string _activityName, uint256 _quantity, string _unit, uint256 _totalValueInr, string _proofHash) external",
  "function recordProfitDistribution(string _distributionId, string _poolId, string _season, uint256 _grossRevenueInr, uint256 _totalExpensesInr, uint256 _netMarginInr, uint256 _memberCount, string _distributionHash) external",
  "function recordCropSale(string _saleId, string _poolId, string _cropName, uint256 _quantity, string _unit, uint256 _pricePerUnitInr, uint256 _totalAmountInr, string _buyerName, string _buyerContact, string _receiptHash) external",
  "function recordInvestment(string _investmentId, string _poolId, string _investorId, string _investorName, string _investorType, uint256 _amountInr, string _terms, string _investmentHash) external",
  "function getAgreement(string _poolId) external view returns (tuple(string poolId, string poolName, string documentHash, uint256 participantCount, uint256 timestamp, bool isSealed, address sealedBy))",
  "function getContributions(string _poolId) external view returns (tuple(string recordId, string poolId, string contributorId, string contributorName, string contributionType, string activityName, uint256 quantity, string unit, uint256 totalValueInr, uint256 timestamp, string proofHash)[])",
  "function getProfitDistributions(string _poolId) external view returns (tuple(string distributionId, string poolId, string season, uint256 grossRevenueInr, uint256 totalExpensesInr, uint256 netMarginInr, uint256 memberCount, uint256 timestamp, string distributionHash)[])",
  "function getCropSales(string _poolId) external view returns (tuple(string saleId, string poolId, string cropName, uint256 quantity, string unit, uint256 pricePerUnitInr, uint256 totalAmountInr, string buyerName, string buyerContact, uint256 timestamp, string receiptHash)[])",
  "function getInvestments(string _poolId) external view returns (tuple(string investmentId, string poolId, string investorId, string investorName, string investorType, uint256 amountInr, string terms, uint256 timestamp, string investmentHash)[])"
];

class AgriLedgerBlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: Contract | null = null;
  private signer: Wallet | null = null;
  private isConnected: boolean = false;
  private contractAddress: string;

  constructor() {
    this.contractAddress = process.env.AGRI_LEDGER_CONTRACT_ADDRESS || process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    this.initialize();
  }

  private initialize() {
    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      const privateKey = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new Wallet(privateKey, this.provider);
      this.contract = new Contract(this.contractAddress, AGRI_LEDGER_ABI, this.signer);
      this.isConnected = true;
    } catch {
      this.isConnected = false;
    }
  }

  private generateSimulatedTx(proofHash: string): BlockchainAnchorResult {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto') as typeof import('crypto');
    const now = new Date().toISOString();
    const txHash = '0x' + crypto.createHash('sha256').update(proofHash + now).digest('hex');
    const blockNumber = Math.floor(Math.random() * 500000) + 12450000;

    return {
      success: true,
      isSimulated: true,
      proofHash,
      transactionHash: txHash,
      blockNumber,
      timestamp: now,
      contractAddress: this.contractAddress
    };
  }

  // ─── 1. DIGITAL AGREEMENT SEALING ──────────────────────────────────────────
  async sealAgreementOnChain(pool: any, sealedAt: string): Promise<BlockchainAnchorResult> {
    const proofHash = hashContractNode(pool, sealedAt);
    try {
      if (this.contract && process.env.BLOCKCHAIN_MODE === 'real') {
        const tx = await this.contract.sealAgreement(
          pool._id.toString(),
          pool.name || 'Farm Pool',
          proofHash,
          pool.participants?.length || 0
        );
        const receipt = await tx.wait();
        return {
          success: true,
          isSimulated: false,
          proofHash,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          timestamp: new Date().toISOString(),
          contractAddress: this.contractAddress
        };
      }
    } catch (e) {
      console.warn('Real blockchain call failed, using cryptographic simulated anchor:', e);
    }
    return this.generateSimulatedTx(proofHash);
  }

  // ─── 2. CONTRIBUTION LEDGER ANCHORING ──────────────────────────────────────
  async anchorContributionOnChain(contribution: any): Promise<BlockchainAnchorResult> {
    const proofHash = hashContributionNode(contribution);
    try {
      if (this.contract && process.env.BLOCKCHAIN_MODE === 'real') {
        const tx = await this.contract.recordContribution(
          contribution._id.toString(),
          contribution.poolId.toString(),
          contribution.userId?.toString() || '',
          contribution.farmerName || 'Farmer',
          contribution.type || 'labour',
          contribution.activityName || 'Activity',
          Math.round(contribution.quantity || 0),
          contribution.unit || 'hours',
          Math.round(contribution.totalValue || 0),
          proofHash
        );
        const receipt = await tx.wait();
        return {
          success: true,
          isSimulated: false,
          proofHash,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          timestamp: new Date().toISOString(),
          contractAddress: this.contractAddress
        };
      }
    } catch (e) {
      console.warn('Real blockchain call failed for contribution, using simulated anchor:', e);
    }
    return this.generateSimulatedTx(proofHash);
  }

  // ─── 3. PROFIT DISTRIBUTION ANCHORING ──────────────────────────────────────
  async anchorProfitDistributionOnChain(settlement: any): Promise<BlockchainAnchorResult> {
    const distributionHash = hashProfitDistributionNode(settlement);
    try {
      if (this.contract && process.env.BLOCKCHAIN_MODE === 'real') {
        const tx = await this.contract.recordProfitDistribution(
          settlement._id.toString(),
          settlement.poolId.toString(),
          settlement.season || 'Current Season',
          Math.round(settlement.grossHarvestRevenue || 0),
          Math.round(settlement.totalInputExpenses || 0),
          Math.round(settlement.netDistributableMargin || 0),
          settlement.memberSettlements?.length || 0,
          distributionHash
        );
        const receipt = await tx.wait();
        return {
          success: true,
          isSimulated: false,
          proofHash: distributionHash,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          timestamp: new Date().toISOString(),
          contractAddress: this.contractAddress
        };
      }
    } catch (e) {
      console.warn('Real blockchain call failed for profit distribution, using simulated anchor:', e);
    }
    return this.generateSimulatedTx(distributionHash);
  }

  // ─── 4. CROP SALE TRANSACTIONS ANCHORING ────────────────────────────────────
  async anchorCropSaleOnChain(sale: any): Promise<BlockchainAnchorResult> {
    const receiptHash = hashCropSaleNode(sale);
    try {
      if (this.contract && process.env.BLOCKCHAIN_MODE === 'real') {
        const tx = await this.contract.recordCropSale(
          sale._id.toString(),
          sale.poolId.toString(),
          sale.cropName || 'Produce',
          Math.round(sale.quantity || 0),
          sale.unit || 'Quintals',
          Math.round(sale.pricePerUnit || 0),
          Math.round(sale.totalAmount || 0),
          sale.buyerName || 'Buyer',
          sale.buyerContact || '',
          receiptHash
        );
        const receipt = await tx.wait();
        return {
          success: true,
          isSimulated: false,
          proofHash: receiptHash,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          timestamp: new Date().toISOString(),
          contractAddress: this.contractAddress
        };
      }
    } catch (e) {
      console.warn('Real blockchain call failed for crop sale, using simulated anchor:', e);
    }
    return this.generateSimulatedTx(receiptHash);
  }

  // ─── 5. INVESTMENT RECORDS ANCHORING ───────────────────────────────────────
  async anchorInvestmentOnChain(inv: any): Promise<BlockchainAnchorResult> {
    const investmentHash = hashInvestmentNode(inv);
    try {
      if (this.contract && process.env.BLOCKCHAIN_MODE === 'real') {
        const tx = await this.contract.recordInvestment(
          inv._id.toString(),
          inv.poolId.toString(),
          inv.investorId?.toString() || '',
          inv.investorName || 'Investor',
          inv.investorType || 'third_party',
          Math.round(inv.amount || 0),
          inv.terms || 'Standard Agreement',
          investmentHash
        );
        const receipt = await tx.wait();
        return {
          success: true,
          isSimulated: false,
          proofHash: investmentHash,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          timestamp: new Date().toISOString(),
          contractAddress: this.contractAddress
        };
      }
    } catch (e) {
      console.warn('Real blockchain call failed for investment, using simulated anchor:', e);
    }
    return this.generateSimulatedTx(investmentHash);
  }
}

export const agriLedgerService = new AgriLedgerBlockchainService();
export default agriLedgerService;
